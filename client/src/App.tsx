// client/src/App.tsx
import { Toaster } from "@/components/ui-providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AuthForm from "./components/AuthForm";
import ChangeHistory from "./components/ChangeHistory";
import ComponentManager from "./components/ComponentManager";
import ContentTypeManager from "./components/ContentTypeManager";
import OperationQueue from "./components/OperationQueue";
import { ApiProvider } from "./contexts/ApiContext";
import { Auth, Change } from "./types";

interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
}

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

  // Clear change history
  const clearChangeHistory = () => {
    if (window.confirm("Are you sure you want to clear the change history?")) {
      setChanges([]);
      toast("History cleared", {
        description: "Change history has been cleared",
        duration: 3000,
      });
    }
  };

  // Helper function to get the path for a file based on entity type
  const getFilePath = (entityType: string, entityName: string): string => {
    if (entityType.includes("Content Type")) {
      return `content-types/${entityName}.json`;
    } else {
      return `components/${entityName}.json`;
    }
  };

  // Create a line-based diff algorithm that shows only changed lines with context
  function createUnifiedDiff(
    oldStr: string,
    newStr: string,
    context: number = 3
  ): string {
    // Split the strings into lines
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");

    // Find matching lines
    const hunks: DiffHunk[] = [];

    // Simple LCS (Longest Common Subsequence) implementation
    function findLCS() {
      const matrix = Array(oldLines.length + 1)
        .fill(null)
        .map(() => Array(newLines.length + 1).fill(0));

      // Fill the matrix
      for (let i = 1; i <= oldLines.length; i++) {
        for (let j = 1; j <= newLines.length; j++) {
          if (oldLines[i - 1] === newLines[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1] + 1;
          } else {
            matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
          }
        }
      }

      // Backtrack to find the sequence
      let i = oldLines.length;
      let j = newLines.length;
      const lcs: { oldIndex: number; newIndex: number; line: string }[] = [];

      while (i > 0 && j > 0) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          lcs.unshift({
            oldIndex: i - 1,
            newIndex: j - 1,
            line: oldLines[i - 1],
          });
          i--;
          j--;
        } else if (matrix[i - 1][j] > matrix[i][j - 1]) {
          i--;
        } else {
          j--;
        }
      }

      return lcs;
    }

    // Find the longest common subsequence
    const lcs = findLCS();

    // Use LCS to identify changes
    let oldIndex = 0;
    let newIndex = 0;

    // Build hunks of changes
    let currentHunk: DiffHunk | null = null;

    for (const match of lcs) {
      // Process deletions
      while (oldIndex < match.oldIndex) {
        if (!currentHunk) {
          currentHunk = {
            oldStart: Math.max(0, oldIndex - context),
            oldCount: 0,
            newStart: Math.max(0, newIndex - context),
            newCount: 0,
            lines: [] as string[],
          };

          // Add context lines before
          for (let i = currentHunk.oldStart; i < oldIndex; i++) {
            currentHunk.lines.push(" " + oldLines[i]);
            currentHunk.oldCount++;
            currentHunk.newCount++;
          }
        }

        currentHunk.lines.push("-" + oldLines[oldIndex]);
        currentHunk.oldCount++;
        oldIndex++;
      }

      // Process additions
      while (newIndex < match.newIndex) {
        if (!currentHunk) {
          currentHunk = {
            oldStart: Math.max(0, oldIndex - context),
            oldCount: 0,
            newStart: Math.max(0, newIndex - context),
            newCount: 0,
            lines: [] as string[],
          };

          // Add context lines before
          for (let i = currentHunk.oldStart; i < oldIndex; i++) {
            currentHunk.lines.push(" " + oldLines[i]);
            currentHunk.oldCount++;
            currentHunk.newCount++;
          }
        }

        currentHunk.lines.push("+" + newLines[newIndex]);
        currentHunk.newCount++;
        newIndex++;
      }

      // Process matching line
      if (currentHunk) {
        currentHunk.lines.push(" " + oldLines[oldIndex]);
        currentHunk.oldCount++;
        currentHunk.newCount++;
      }

      oldIndex++;
      newIndex++;

      // Finish hunk if we've reached the end of a change block
      if (
        currentHunk &&
        oldIndex < oldLines.length &&
        newIndex < newLines.length &&
        oldLines[oldIndex] === newLines[newIndex]
      ) {
        // Add context lines after
        const contextEnd = Math.min(oldIndex + context, oldLines.length);
        for (let i = oldIndex; i < contextEnd; i++) {
          currentHunk.lines.push(" " + oldLines[i]);
          currentHunk.oldCount++;
          currentHunk.newCount++;
        }

        hunks.push(currentHunk);
        currentHunk = null;
      }
    }

    // Process any remaining deletions
    while (oldIndex < oldLines.length) {
      if (!currentHunk) {
        currentHunk = {
          oldStart: Math.max(0, oldIndex - context),
          oldCount: 0,
          newStart: Math.max(0, newIndex - context),
          newCount: 0,
          lines: [] as string[],
        };

        // Add context lines before
        for (let i = currentHunk.oldStart; i < oldIndex; i++) {
          currentHunk.lines.push(" " + oldLines[i]);
          currentHunk.oldCount++;
          currentHunk.newCount++;
        }
      }

      currentHunk.lines.push("-" + oldLines[oldIndex]);
      currentHunk.oldCount++;
      oldIndex++;
    }

    // Process any remaining additions
    while (newIndex < newLines.length) {
      if (!currentHunk) {
        currentHunk = {
          oldStart: Math.max(0, oldIndex - context),
          oldCount: 0,
          newStart: Math.max(0, newIndex - context),
          newCount: 0,
          lines: [] as string[],
        };

        // Add context lines before
        for (let i = currentHunk.oldStart; i < oldIndex; i++) {
          currentHunk.lines.push(" " + oldLines[i]);
          currentHunk.oldCount++;
          currentHunk.newCount++;
        }
      }

      currentHunk.lines.push("+" + newLines[newIndex]);
      currentHunk.newCount++;
      newIndex++;
    }

    // Add the last hunk if it exists
    if (currentHunk) {
      hunks.push(currentHunk);
    }

    // Format the unified diff
    let diffOutput = "";

    hunks.forEach((hunk) => {
      diffOutput += `@@ -${hunk.oldStart + 1},${hunk.oldCount} +${
        hunk.newStart + 1
      },${hunk.newCount} @@\n`;
      diffOutput += hunk.lines.join("\n") + "\n";
    });

    return diffOutput;
  }

  // Generate a Git patch from changes
  const downloadGitPatch = () => {
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

      // Generate the git patch content
      let patchContent = "";
      const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp for mock indexes

      // Add message header to the patch
      patchContent += `From: Bloomreach Management App <noreply@bloomreach.com>\n`;
      patchContent += `Date: ${new Date().toUTCString()}\n`;
      patchContent += `Subject: [PATCH] Update Bloomreach configuration files\n\n`;
      patchContent += `Update Bloomreach content types and components\n\n`;

      // Process created and updated files
      modifiedEntitiesMap.forEach((change) => {
        const filePath = getFilePath(change.entityType, change.entityName);
        const formattedContent = JSON.stringify(change.entityData, null, 2);

        if (change.action === "CREATE") {
          // Format for new file
          patchContent += `diff --git a/${filePath} b/${filePath}\n`;
          patchContent += `new file mode 100644\n`;
          patchContent += `index 0000000..${timestamp.toString(16)}\n`;
          patchContent += `--- /dev/null\n`;
          patchContent += `+++ b/${filePath}\n`;
          patchContent += `@@ -0,0 +1,${
            formattedContent.split("\n").length
          } @@\n`;

          // Add the new file content with + prefix
          formattedContent.split("\n").forEach((line) => {
            patchContent += `+${line}\n`;
          });
        } else if (change.action === "UPDATE" && change.previousData) {
          // Format for modified file using our improved diff algorithm
          const previousContent = JSON.stringify(change.previousData, null, 2);

          patchContent += `diff --git a/${filePath} b/${filePath}\n`;
          patchContent += `index ${(timestamp - 100).toString(
            16
          )}..${timestamp.toString(16)} 100644\n`;
          patchContent += `--- a/${filePath}\n`;
          patchContent += `+++ b/${filePath}\n`;

          // Generate a proper line-based diff with context
          patchContent += createUnifiedDiff(
            previousContent,
            formattedContent,
            3
          );
        }
      });

      // Process deleted files
      deletedEntitiesMap.forEach((change) => {
        if (change.previousData) {
          const filePath = getFilePath(change.entityType, change.entityName);
          const previousContent = JSON.stringify(change.previousData, null, 2);
          const prevLines = previousContent.split("\n");

          patchContent += `diff --git a/${filePath} b/${filePath}\n`;
          patchContent += `deleted file mode 100644\n`;
          patchContent += `index ${(timestamp - 100).toString(16)}..0000000\n`;
          patchContent += `--- a/${filePath}\n`;
          patchContent += `+++ /dev/null\n`;
          patchContent += `@@ -1,${prevLines.length} +0,0 @@\n`;

          // Add the deleted content with - prefix
          prevLines.forEach((line) => {
            patchContent += `-${line}\n`;
          });
        }
      });

      // Create a blob and download it
      const blob = new Blob([patchContent], { type: "text/plain" });
      saveAs(blob, "bloomreach-changes.patch");

      toast.success("Git patch created successfully");
    } catch (error) {
      console.error("Error generating git patch:", error);
      toast.error("Failed to generate git patch");
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
    manifest += `\n## Alternative Method\n\n`;
    manifest += `You can also download a Git patch file and apply it with \`git apply patch_file.patch\`\n`;

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

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <ApiProvider auth={auth} recordChange={recordChange}>
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
                  <div className="container mx-auto px-6 py-6">
                    {/* Add the OperationQueue component */}
                    <OperationQueue />

                    <TabsContent value="contentTypes" className="mt-0 p-0">
                      <ContentTypeManager />
                    </TabsContent>
                    <TabsContent value="components" className="mt-0 p-0">
                      <ComponentManager />
                    </TabsContent>
                  </div>

                  <div className="container mx-auto px-6 pb-6">
                    <ChangeHistory
                      changes={changes}
                      onClear={clearChangeHistory}
                      onDownloadModifiedFiles={downloadModifiedFiles}
                      onDownloadGitPatch={downloadGitPatch}
                    />
                  </div>
                </div>
              </Tabs>
            </main>
          </div>
        </ApiProvider>
      )}
    </div>
  );
}

export default App;
