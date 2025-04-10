// client/src/components/ComponentManager.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Copy,
  Download,
  Edit,
  PlusCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApi } from "../contexts/ApiContext";
import { copyJsonToClipboard, exportToJson } from "../lib/exportUtils";
import { ApiRequest, Component, ComponentGroup } from "../types";
import ComponentEditor from "./ComponentEditor";
import FilterInput from "./FilterInput";

const ComponentManager: React.FC = () => {
  const { queueOperation, executeOperation } = useApi();

  const [componentGroups, setComponentGroups] = useState<ComponentGroup[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(
    null
  );
  const [currentGroup, setCurrentGroup] = useState<string>("");
  const [channelId, setChannelId] = useState<string>("");
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [jsonExport, setJsonExport] = useState<Component | null>(null);
  const [showGroupForm, setShowGroupForm] = useState<boolean>(false);
  const [newGroup, setNewGroup] = useState<ComponentGroup>({
    name: "",
    hidden: false,
    system: false,
  });

  // Add filter states
  const [componentFilter, setComponentFilter] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("");

  // Fetch component groups when ACTIVE channel ID changes
  useEffect(() => {
    if (activeChannelId) {
      fetchComponentGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]);

  // Fetch components when group changes
  useEffect(() => {
    if (activeChannelId && currentGroup) {
      fetchComponents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroup]);

  // Filter component groups
  const filteredComponentGroups = componentGroups.filter((group) => {
    if (!groupFilter) return true;

    const searchTerm = groupFilter.toLowerCase();
    return group.name.toLowerCase().includes(searchTerm);
  });

  // Filter components
  const filteredComponents = components.filter((component) => {
    if (!componentFilter) return true;

    const searchTerm = componentFilter.toLowerCase();
    const componentName = component.id.split("/")[1];
    return (
      componentName.toLowerCase().includes(searchTerm) ||
      (component.label || "").toLowerCase().includes(searchTerm) ||
      (component.ctype || "").toLowerCase().includes(searchTerm)
    );
  });

  // Handle filter changes
  const handleComponentFilterChange = (value: string) => {
    setComponentFilter(value);
  };

  const handleGroupFilterChange = (value: string) => {
    setGroupFilter(value);
  };

  // Fetch component groups from API
  const fetchComponentGroups = async () => {
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "components",
        operation: "getGroups",
        channelId: activeChannelId,
        brxHost: "",
        authToken: "",
      };

      const result = await executeOperation(params);

      if (result.success && result.data) {
        setComponentGroups(result.data);

        // Set the first group as current if there's no current group
        if (result.data.length > 0 && !currentGroup) {
          setCurrentGroup(result.data[0].name);
        }
      }
    } catch (error) {
      console.error("Failed to fetch component groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch components for the current group
  const fetchComponents = async () => {
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "components",
        operation: "getComponents",
        channelId: activeChannelId,
        componentGroup: currentGroup,
        brxHost: "",
        authToken: "",
      };

      const result = await executeOperation(params);

      if (result.success && result.data) {
        setComponents(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get component details for editing
  const getComponentDetails = async (componentName: string) => {
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "components",
        operation: "getComponent",
        channelId: activeChannelId,
        componentGroup: currentGroup,
        resourceId: componentName,
        brxHost: "",
        authToken: "",
      };

      const result = await executeOperation(params);

      if (result.success && result.data) {
        // Include resource version for PUT operations
        const component: Component = {
          ...result.data,
          resourceVersion: result.resourceVersion,
        };

        setEditingComponent(component);
        setShowEditor(true);
      }
    } catch (error) {
      console.error("Failed to fetch component details:", error);
      toast.error("Failed to load component details");
    } finally {
      setLoading(false);
    }
  };

  // Delete a component
  const deleteComponent = async (componentName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete component ${componentName}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "components",
        operation: "deleteComponent",
        channelId: activeChannelId,
        componentGroup: currentGroup,
        resourceId: componentName,
        brxHost: "",
        authToken: "",
      };

      // Use queueOperation instead of makeApiRequest
      const result = await queueOperation(
        params,
        "DELETE",
        "Component",
        componentName,
        `Delete component ${componentName} from group ${currentGroup}`
      );

      if (result.success) {
        toast.success(
          `Component ${
            result.queued ? "queued for deletion" : "deleted successfully"
          }`
        );
        if (!result.queued) {
          fetchComponents();
        }
      }
    } catch (error) {
      console.error("Failed to delete component:", error);
      toast.error("Failed to delete component");
    } finally {
      setLoading(false);
    }
  };

  // Open editor for creating a new component
  const createComponent = () => {
    setEditingComponent(null);
    setShowEditor(true);
  };

  // Handle saving component (create or update)
  const handleSaveComponent = async (component: Component) => {
    setLoading(true);

    try {
      const operation = component.resourceVersion
        ? "updateComponent"
        : "createComponent";
      const resourceId = component.name || component.id.split("/")[1];
      const action = operation === "createComponent" ? "CREATE" : "UPDATE";
      const actionText = action === "CREATE" ? "Create" : "Update";

      const params: ApiRequest = {
        section: "components",
        operation,
        channelId: activeChannelId,
        componentGroup: currentGroup,
        resourceId,
        resourceData: component,
        brxHost: "",
        authToken: "",
      };

      // Use queueOperation instead of makeApiRequest
      const result = await queueOperation(
        params,
        action,
        "Component",
        resourceId,
        `${actionText} component ${resourceId} in group ${currentGroup}`,
        component.resourceVersion ? component : null
      );

      if (result.success) {
        toast.success(
          `Component ${result.queued ? "queued to be" : ""} ${
            operation === "createComponent" ? "created" : "updated"
          } successfully`
        );
        setShowEditor(false);
        if (!result.queued) {
          fetchComponents();
        }
      }
    } catch (error) {
      console.error("Failed to save component:", error);
      toast.error("Failed to save component");
    } finally {
      setLoading(false);
    }
  };

  // Create a new component group
  const createComponentGroup = async () => {
    if (!newGroup.name) {
      toast.error("Group name is required");
      return;
    }

    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "components",
        operation: "createGroup",
        channelId: activeChannelId,
        componentGroup: newGroup.name,
        resourceData: {
          hidden: newGroup.hidden,
          system: newGroup.system,
        },
        brxHost: "",
        authToken: "",
      };

      // Use queueOperation instead of makeApiRequest
      const result = await queueOperation(
        params,
        "CREATE",
        "Component Group",
        newGroup.name,
        `Create component group ${newGroup.name}`
      );

      if (result.success) {
        toast.success(
          `Component group ${
            result.queued ? "queued for creation" : "created successfully"
          }`
        );
        setShowGroupForm(false);
        setNewGroup({ name: "", hidden: false, system: false });

        if (!result.queued) {
          fetchComponentGroups();
          setCurrentGroup(newGroup.name);
        }
      }
    } catch (error) {
      console.error("Failed to create component group:", error);
      toast.error("Failed to create component group");
    } finally {
      setLoading(false);
    }
  };

  // Delete a component group
  const deleteComponentGroup = async (groupName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete component group ${groupName}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "components",
        operation: "deleteGroup",
        channelId: activeChannelId,
        componentGroup: groupName,
        brxHost: "",
        authToken: "",
      };

      // Use queueOperation instead of makeApiRequest
      const result = await queueOperation(
        params,
        "DELETE",
        "Component Group",
        groupName,
        `Delete component group ${groupName}`
      );

      if (result.success) {
        toast.success(
          `Component group ${
            result.queued ? "queued for deletion" : "deleted successfully"
          }`
        );

        // If we deleted the current group, reset it
        if (currentGroup === groupName && !result.queued) {
          setCurrentGroup("");
          setComponents([]);
        }

        if (!result.queued) {
          fetchComponentGroups();
        }
      }
    } catch (error) {
      console.error("Failed to delete component group:", error);
      toast.error("Failed to delete component group");
    } finally {
      setLoading(false);
    }
  };

  // Export component to JSON
  const exportComponent = (component: Component) => {
    setJsonExport(component);
  };

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    if (!jsonExport) return;
    copyJsonToClipboard(jsonExport);
  };

  // Download JSON file
  const downloadJson = () => {
    if (!jsonExport) return;
    const fileName =
      jsonExport.name || jsonExport.id.split("/")[1] || "component";
    exportToJson(jsonExport, fileName);
  };

  // Handle changes to the channel ID input
  const handleChannelIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannelId(e.target.value);
  };

  // Handle channel ID submission
  const handleChannelIdSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (channelId) {
      setActiveChannelId(channelId); // Set the active channel ID to trigger the fetch
    }
  };

  // Handle changes to the new group form
  const handleNewGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewGroup((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox changes for the new group form
  const handleNewGroupCheckboxChange = (name: string, checked: boolean) => {
    setNewGroup((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <div className="container mx-auto">
      {showEditor ? (
        <ComponentEditor
          component={editingComponent}
          onSave={handleSaveComponent}
          onCancel={() => setShowEditor(false)}
          groupName={currentGroup}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Components</h2>

              {!activeChannelId ? (
                <form onSubmit={handleChannelIdSubmit} className="max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="channelId">Channel ID</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="channelId"
                        value={channelId}
                        onChange={handleChannelIdChange}
                        placeholder="e.g. brxsaas or brxsaas-projectId"
                        required
                      />
                      <Button type="submit">Connect</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the channel ID to manage its components
                    </p>
                  </div>
                </form>
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="px-3 py-1">
                    Channel: {activeChannelId}
                  </Badge>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setActiveChannelId("");
                      setCurrentGroup("");
                      setComponents([]);
                      setComponentGroups([]);
                    }}
                    className="cursor-pointer"
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {activeChannelId && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowGroupForm(true)}
                  disabled={loading}
                  className="cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> New Group
                </Button>
                {currentGroup && (
                  <Button
                    onClick={createComponent}
                    disabled={loading}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> New Component
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={
                    currentGroup ? fetchComponents : fetchComponentGroups
                  }
                  disabled={loading}
                  className="cursor-pointer"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
              </div>
            )}
          </div>

          {showGroupForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  New Component Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Name*</Label>
                    <Input
                      id="groupName"
                      name="name"
                      value={newGroup.name}
                      onChange={handleNewGroupChange}
                      placeholder="e.g. content-components"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hidden"
                        checked={newGroup.hidden}
                        onCheckedChange={(checked) =>
                          handleNewGroupCheckboxChange(
                            "hidden",
                            checked as boolean
                          )
                        }
                      />
                      <Label htmlFor="hidden" className="cursor-pointer">
                        Hidden
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="system"
                        checked={newGroup.system}
                        onCheckedChange={(checked) =>
                          handleNewGroupCheckboxChange(
                            "system",
                            checked as boolean
                          )
                        }
                      />
                      <Label htmlFor="system" className="cursor-pointer">
                        System
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    onClick={createComponentGroup}
                    disabled={!newGroup.name || loading}
                  >
                    Create Group
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGroupForm(false);
                      setNewGroup({ name: "", hidden: false, system: false });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeChannelId && (
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Component Groups
                    </CardTitle>
                  </CardHeader>

                  {/* Add filter for component groups */}
                  <div className="px-3 pb-3">
                    <FilterInput
                      placeholder="Filter groups..."
                      onFilterChange={handleGroupFilterChange}
                    />
                  </div>

                  <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
                    {componentGroups.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground text-sm mb-4">
                          No component groups found.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGroupForm(true)}
                        >
                          Create your first group
                        </Button>
                      </div>
                    ) : filteredComponentGroups.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-muted-foreground text-sm mb-4">
                          No groups match your filter.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGroupFilter("")}
                        >
                          Clear filter
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredComponentGroups.map((group) => (
                          <div
                            key={group.name}
                            className={`flex items-center justify-between p-3 ${
                              currentGroup === group.name ? "bg-muted" : ""
                            } hover:bg-muted/50 cursor-pointer`}
                            onClick={() => setCurrentGroup(group.name)}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {group.name}
                              </span>
                              <div className="flex space-x-1 mt-1">
                                {group.hidden && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-0"
                                  >
                                    Hidden
                                  </Badge>
                                )}
                                {group.system && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs py-0"
                                  >
                                    System
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!group.system && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteComponentGroup(group.name);
                                }}
                                className="opacity-60 hover:opacity-100 cursor-pointer"
                                title="Delete Group"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="col-span-3">
                <Card className="h-full">
                  {!currentGroup ? (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                      <p className="text-muted-foreground mb-4">
                        Select a component group from the sidebar or create a
                        new one.
                      </p>
                    </div>
                  ) : loading ? (
                    <div className="flex justify-center items-center h-64 text-muted-foreground italic">
                      Loading components...
                    </div>
                  ) : components.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <p className="text-muted-foreground mb-4">
                        No components found in group "{currentGroup}".
                      </p>
                      <Button type="button" onClick={createComponent}>
                        Create your first component
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CardHeader>
                        <CardTitle className="text-base font-medium">
                          Components in {currentGroup}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Add filter for components */}
                        <div className="px-4 pb-4">
                          <FilterInput
                            placeholder="Filter components..."
                            onFilterChange={handleComponentFilterChange}
                          />
                        </div>

                        {filteredComponents.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-muted-foreground mb-4">
                              No components match your filter.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setComponentFilter("")}
                            >
                              Clear filter
                            </Button>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Hidden</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredComponents.map((component) => {
                                const componentName =
                                  component.id.split("/")[1];
                                return (
                                  <TableRow
                                    key={component.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                      getComponentDetails(componentName)
                                    }
                                  >
                                    <TableCell className="font-medium">
                                      {componentName}
                                    </TableCell>
                                    <TableCell>
                                      {component.label || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {component.ctype || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {component.hidden ? (
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                      ) : (
                                        <X className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </TableCell>
                                    <TableCell
                                      className="text-right"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex justify-end space-x-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            getComponentDetails(componentName)
                                          }
                                          title="Edit"
                                          className="cursor-pointer"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        {!component.system && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              deleteComponent(componentName)
                                            }
                                            title="Delete"
                                            className="cursor-pointer"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            exportComponent(component)
                                          }
                                          title="Export"
                                          className="cursor-pointer"
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </>
                  )}
                </Card>
              </div>
            </div>
          )}

          {jsonExport && (
            <Dialog
              open={!!jsonExport}
              onOpenChange={(open) => !open && setJsonExport(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>JSON Export: {jsonExport.id}</DialogTitle>
                </DialogHeader>
                <div className="flex justify-end space-x-2 mb-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={downloadJson}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 bg-muted rounded-md">
                  <pre className="text-xs">
                    {JSON.stringify(jsonExport, null, 2)}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
};

export default ComponentManager;
