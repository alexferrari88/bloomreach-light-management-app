import { Toaster } from "@/components/ui-providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AuthForm from "./components/AuthForm";
import ChangeHistory from "./components/ChangeHistory";
import ComponentManager from "./components/ComponentManager";
import ContentTypeManager from "./components/ContentTypeManager";
import { ApiRequest, ApiResponse, Auth, Change } from "./types";

function App() {
  // State for authentication
  const [auth, setAuth] = useState<Auth>({
    brxHost: "",
    authToken: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // State for app navigation
  const [activeSection, setActiveSection] = useState<
    "contentTypes" | "components"
  >("contentTypes");

  // State for change history
  const [changes, setChanges] = useState<Change[]>([]);

  // Load auth from local storage
  useEffect(() => {
    const savedAuth = localStorage.getItem("brxAuth");
    if (savedAuth) {
      const parsedAuth: Auth = JSON.parse(savedAuth);
      if (parsedAuth.brxHost && parsedAuth.authToken) {
        setAuth(parsedAuth);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Handle login
  const handleLogin = (credentials: Auth) => {
    localStorage.setItem("brxAuth", JSON.stringify(credentials));
    setAuth(credentials);
    setIsAuthenticated(true);
    toast.success("Authentication details saved!");
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("brxAuth");
    setAuth({ brxHost: "", authToken: "" });
    setIsAuthenticated(false);
    setChanges([]);
    toast.info("Logged out successfully");
  };

  // Record a change to the history with detailed information
  const recordChange = (
    action: "CREATE" | "UPDATE" | "DELETE",
    entityType: string,
    entityName: string,
    entityData: any = null,
    previousData: any = null
  ) => {
    const change: Change = {
      action,
      entityType,
      entityName,
      entityData,
      previousData,
      timestamp: new Date().toLocaleString(),
    };

    setChanges((prevChanges) => [change, ...prevChanges]);
  };

  // Export change history as JSON
  const exportChangeHistory = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(changes, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "change-history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast.success("Change history exported successfully");
  };

  // Clear change history
  const clearChangeHistory = () => {
    if (window.confirm("Are you sure you want to clear the change history?")) {
      setChanges([]);
      toast({
        title: "History cleared",
        description: "Change history has been cleared",
        duration: 3000,
      });
    }
  };

  // Download modified files for git repository
  const downloadModifiedFiles = () => {
    try {
      // Create maps to track the latest state of every entity
      const modifiedEntitiesMap = new Map<string, Change>();
      const deletedEntitiesMap = new Map<string, Change>();

      // Process all changes to find the final state of each entity
      changes.forEach((change) => {
        const key = `${change.entityType}:${change.entityName}`;

        // Check if this is the most recent change for this entity
        const alreadyTracked =
          modifiedEntitiesMap.has(key) || deletedEntitiesMap.has(key);
        const isMoreRecent =
          alreadyTracked &&
          (modifiedEntitiesMap.has(key)
            ? new Date(change.timestamp) >
              new Date(modifiedEntitiesMap.get(key)!.timestamp)
            : new Date(change.timestamp) >
              new Date(deletedEntitiesMap.get(key)!.timestamp));

        if (!alreadyTracked || isMoreRecent) {
          // If it's a deletion, add to deleted map and remove from modified map
          if (change.action === "DELETE") {
            deletedEntitiesMap.set(key, change);
            modifiedEntitiesMap.delete(key);
          }
          // If it's a creation or update, add to modified map and remove from deleted map
          else {
            modifiedEntitiesMap.set(key, change);
            deletedEntitiesMap.delete(key);
          }
        }
      });

      // Check if we have any changes to export
      if (modifiedEntitiesMap.size === 0 && deletedEntitiesMap.size === 0) {
        toast.error("No changes to download");
        return;
      }

      // For a single file that's not deleted, we can download it directly
      if (modifiedEntitiesMap.size === 1 && deletedEntitiesMap.size === 0) {
        const change = Array.from(modifiedEntitiesMap.values())[0];
        const fileName = `${change.entityName}.json`;
        const content = JSON.stringify(change.entityData, null, 2);

        const blob = new Blob([content], { type: "application/json" });
        saveAs(blob, fileName);

        toast.success(`Downloaded ${fileName}`);
        return;
      }

      // Otherwise create a zip with multiple files and the manifest
      const zip = new JSZip();

      // Add content type files to one folder and components to another
      const contentTypesFolder = zip.folder("content-types");
      const componentsFolder = zip.folder("components");

      // Track all changes for the manifest
      const allChanges: {
        name: string;
        type: string;
        action: "CREATE" | "UPDATE" | "DELETE";
        path: string;
      }[] = [];

      // Add modified entities to the zip
      modifiedEntitiesMap.forEach((change) => {
        const fileName = `${change.entityName}.json`;
        const content = JSON.stringify(change.entityData, null, 2);
        let path = "";

        if (change.entityType.includes("Content Type")) {
          contentTypesFolder?.file(fileName, content);
          path = `content-types/${fileName}`;
        } else if (change.entityType.includes("Component Group")) {
          componentsFolder?.file(fileName, content);
          path = `components/${fileName}`;
        } else if (change.entityType.includes("Component")) {
          componentsFolder?.file(fileName, content);
          path = `components/${fileName}`;
        }

        allChanges.push({
          name: change.entityName,
          type: change.entityType,
          action: change.action,
          path,
        });
      });

      // Add deleted entities to the manifest
      deletedEntitiesMap.forEach((change) => {
        let path = "";
        if (change.entityType.includes("Content Type")) {
          path = `content-types/${change.entityName}.json`;
        } else if (
          change.entityType.includes("Component Group") ||
          change.entityType.includes("Component")
        ) {
          path = `components/${change.entityName}.json`;
        }

        allChanges.push({
          name: change.entityName,
          type: change.entityType,
          action: change.action,
          path,
        });
      });

      // Sort changes by type and then by name
      allChanges.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
      });

      // Create manifest files
      const manifestContent = generateManifestFile(allChanges);
      zip.file("manifest.md", manifestContent);

      // Create git script files
      const gitScriptContent = generateGitScript(allChanges);
      zip.file("apply-changes.sh", gitScriptContent);

      // Generate and download the zip file
      zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, "bloomreach-changes.zip");
        toast.success(
          `Downloaded ${
            modifiedEntitiesMap.size + deletedEntitiesMap.size
          } changes as ZIP`
        );
      });
    } catch (error) {
      console.error("Error downloading modified files:", error);
      toast.error("Failed to download files");
    }
  };

  // Helper function to generate a formatted manifest file
  const generateManifestFile = (
    changes: { name: string; type: string; action: string; path: string }[]
  ): string => {
    const now = new Date().toLocaleString();

    let manifest = `# Bloomreach Changes Manifest\n\n`;
    manifest += `Generated: ${now}\n\n`;
    manifest += `## Summary\n\n`;

    const created = changes.filter((c) => c.action === "CREATE").length;
    const updated = changes.filter((c) => c.action === "UPDATE").length;
    const deleted = changes.filter((c) => c.action === "DELETE").length;

    manifest += `- Created: ${created}\n`;
    manifest += `- Updated: ${updated}\n`;
    manifest += `- Deleted: ${deleted}\n`;
    manifest += `- Total: ${changes.length}\n\n`;

    manifest += `## Changes\n\n`;
    manifest += `| Action | Type | Name | File Path |\n`;
    manifest += `|--------|------|------|----------|\n`;

    changes.forEach((change) => {
      const actionEmoji =
        change.action === "CREATE"
          ? "✅ CREATE"
          : change.action === "UPDATE"
          ? "🔄 UPDATE"
          : "❌ DELETE";

      manifest += `| ${actionEmoji} | ${change.type} | ${change.name} | \`${change.path}\` |\n`;
    });

    manifest += `\n## Instructions\n\n`;
    manifest += `1. Extract the zip file to your git repository\n`;
    manifest += `2. For created and updated files, the files are included in this zip\n`;
    manifest += `3. For deleted files, you need to remove them from your repository\n`;
    manifest += `4. You can use the included \`apply-changes.sh\` script to automate these changes\n`;

    return manifest;
  };

  // Helper function to generate a git script
  const generateGitScript = (
    changes: { name: string; type: string; action: string; path: string }[]
  ): string => {
    let script = `#!/bin/bash\n\n`;
    script += `# Bloomreach Changes Application Script\n`;
    script += `# Generated: ${new Date().toLocaleString()}\n\n`;
    script += `# This script will apply all changes to your git repository\n\n`;

    script += `echo "Applying ${changes.length} Bloomreach changes..."\n\n`;

    // First handle additions and updates (git add)
    const addOrUpdateChanges = changes.filter(
      (c) => c.action === "CREATE" || c.action === "UPDATE"
    );
    if (addOrUpdateChanges.length > 0) {
      script += `# Adding or updating files\n`;
      addOrUpdateChanges.forEach((change) => {
        script += `echo "Adding ${change.path}"\n`;
        script += `git add "${change.path}"\n`;
      });
      script += `\n`;
    }

    // Then handle deletions (git rm)
    const deleteChanges = changes.filter((c) => c.action === "DELETE");
    if (deleteChanges.length > 0) {
      script += `# Removing deleted files\n`;
      deleteChanges.forEach((change) => {
        script += `echo "Removing ${change.path}"\n`;
        script += `git rm "${change.path}" 2>/dev/null || echo "File ${change.path} already removed or not in git"\n`;
      });
      script += `\n`;
    }

    script += `echo "All changes applied. Don't forget to commit the changes!"\n`;
    script += `echo "Example: git commit -m 'Update Bloomreach configuration files'"\n`;

    return script;
  };

  // API request handler with detailed change tracking
  const makeApiRequest = async (params: ApiRequest): Promise<ApiResponse> => {
    try {
      // For update and delete operations, fetch the current state first
      let previousData = null;

      if (
        [
          "update",
          "updateGroup",
          "updateComponent",
          "delete",
          "deleteGroup",
          "deleteComponent",
        ].includes(params.operation)
      ) {
        try {
          // Determine the get operation based on the current operation
          let getOperation: string;
          if (params.operation.includes("Group")) {
            getOperation = "getGroup";
          } else if (
            params.operation.includes("Component") &&
            !params.operation.includes("Group")
          ) {
            getOperation = "getComponent";
          } else {
            getOperation = "getById";
          }

          // Make API request to get current state
          const getResponse = await axios.post<ApiResponse>("/api/execute", {
            ...params,
            operation: getOperation,
            brxHost: auth.brxHost,
            authToken: auth.authToken,
          });

          // Store the current state
          if (getResponse.data.success) {
            previousData = getResponse.data.data;
          }
        } catch (error) {
          console.warn("Could not fetch previous state:", error);
          // Continue with the operation even if we can't get the previous state
        }
      }

      // Now make the actual API request
      const response = await axios.post<ApiResponse>("/api/execute", {
        ...params,
        brxHost: auth.brxHost,
        authToken: auth.authToken,
      });

      // Record the change if it's a mutation operation
      if (
        [
          "create",
          "update",
          "delete",
          "createGroup",
          "updateGroup",
          "deleteGroup",
          "createComponent",
          "updateComponent",
          "deleteComponent",
        ].includes(params.operation)
      ) {
        let action: "CREATE" | "UPDATE" | "DELETE" = "CREATE";
        if (params.operation.startsWith("create")) action = "CREATE";
        else if (params.operation.startsWith("update")) action = "UPDATE";
        else if (params.operation.startsWith("delete")) action = "DELETE";

        let entityType: string = "";
        if (params.section === "contentTypes") {
          entityType = "Content Type";
        } else if (params.operation.includes("Group")) {
          entityType = "Component Group";
        } else {
          entityType = "Component";
        }

        // Get entity name
        let entityName: string = params.resourceId || "";
        if (params.operation.includes("Group") && params.componentGroup) {
          entityName = params.componentGroup;
        }

        // Store the entity data for creates and updates
        const entityData = ["CREATE", "UPDATE"].includes(action)
          ? params.resourceData || response.data.data
          : null;

        recordChange(action, entityType, entityName, entityData, previousData);
      }

      return response.data;
    } catch (error: any) {
      const errorMsg =
        `${error.response?.data?.error}: ${error.response?.data?.details}` ||
        error.message;

      toast.error(errorMsg, {
        duration: 5000,
      });

      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <div className="flex flex-col min-h-screen">
          <header className="border-b bg-card py-4 px-6 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-primary">
              Bloomreach Management App
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">
                {auth.brxHost}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 flex flex-col">
            <Tabs
              value={activeSection}
              onValueChange={(value: string) =>
                setActiveSection(value as "contentTypes" | "components")
              }
              className="w-full"
            >
              <div className="border-b bg-card">
                <div className="container mx-auto">
                  <TabsList className="h-12">
                    <TabsTrigger
                      value="contentTypes"
                      className="flex-1 cursor-pointer"
                    >
                      Content Types
                    </TabsTrigger>
                    <TabsTrigger
                      value="components"
                      className="flex-1 cursor-pointer"
                    >
                      Components
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="contentTypes" className="mt-0 h-full">
                  <ContentTypeManager makeApiRequest={makeApiRequest} />
                </TabsContent>
                <TabsContent value="components" className="mt-0 h-full">
                  <ComponentManager makeApiRequest={makeApiRequest} />
                </TabsContent>

                <div className="container mx-auto px-6 pb-6">
                  <ChangeHistory
                    changes={changes}
                    onClear={clearChangeHistory}
                    onExport={exportChangeHistory}
                    onDownloadModifiedFiles={downloadModifiedFiles}
                  />
                </div>
              </div>
            </Tabs>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
