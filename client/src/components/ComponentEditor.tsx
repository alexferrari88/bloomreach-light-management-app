import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, PlusCircle, Save, Trash2, X } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import {
  Component,
  ComponentEditorProps,
  FieldGroup,
  Parameter,
  ParameterConfig,
} from "../types";

const ComponentEditor: React.FC<ComponentEditorProps> = ({
  component,
  onSave,
  onCancel,
  groupName,
}) => {
  // State for the component being edited
  const [formData, setFormData] = useState<Component>({
    id: "",
    extends: "base/component",
    hidden: false,
    system: false,
    xtype: "",
    ctype: "",
    contentType: "",
    label: "",
    icon: "",
    parameters: [],
    fieldGroups: [],
    resourceVersion: undefined,
  });

  // State for the current parameter being edited
  const [currentParameter, setCurrentParameter] = useState<Parameter>({
    name: "",
    valueType: "string",
    required: false,
    hidden: false,
    overlay: false,
    defaultValue: "",
    displayName: "",
    system: false,
    config: null,
  });

  // State for the current field group being edited
  const [currentFieldGroup, setCurrentFieldGroup] = useState<FieldGroup>({
    name: "",
    displayName: "",
    parameters: [],
  });

  // Flags to track editing states
  const [editingParameterIndex, setEditingParameterIndex] =
    useState<number>(-1);
  const [editingFieldGroupIndex, setEditingFieldGroupIndex] =
    useState<number>(-1);
  const [configType, setConfigType] = useState<string>("none");
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Available parameter types
  const parameterTypes = [
    { value: "string", label: "String" },
    { value: "calendar", label: "Date/Time" },
    { value: "boolean", label: "Boolean" },
    { value: "integer", label: "Integer" },
    { value: "number", label: "Number" },
  ];

  // Load component data if editing an existing one
  useEffect(() => {
    if (component) {
      // Copy the component data to our form
      const componentData: Component = {
        ...component,
        resourceVersion: component.resourceVersion || undefined,
      };
      setFormData(componentData);
    } else {
      // Set default values for a new component
      setFormData({
        id: `${groupName}/`,
        extends: "base/component",
        hidden: false,
        system: false,
        xtype: "",
        ctype: "",
        contentType: "",
        label: "",
        icon: "",
        parameters: [],
        fieldGroups: [],
        resourceVersion: undefined,
      });
    }
  }, [component, groupName]);

  // Handle changes to the component form fields
  const handleComponentChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox changes to the component form fields
  const handleComponentCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle changes to the current parameter being edited
  const handleParameterChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentParameter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox changes to parameters
  const handleParameterCheckboxChange = (name: string, checked: boolean) => {
    setCurrentParameter((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle select changes
  const handleParameterSelectChange = (name: string, value: string) => {
    setCurrentParameter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes to parameter config type
  const handleConfigTypeChange = (value: string) => {
    setConfigType(value);

    // Initialize config object based on selected type
    let configObj: ParameterConfig | null = null;

    if (value === "contentpath") {
      configObj = {
        type: "contentpath",
        pickerConfiguration: "",
        pickerInitialPath: "",
        pickerRememberLastVisited: true,
        pickerSelectableNodeTypes: [],
        relative: true,
      };
    } else if (value === "dropdown") {
      configObj = {
        type: "dropdown",
        sourceId: "",
        value: [],
      };
    } else if (value === "imagesetpath") {
      configObj = {
        type: "imagesetpath",
        pickerConfiguration: "",
        pickerInitialPath: "",
        pickerRememberLastVisited: true,
        pickerSelectableNodeTypes: [],
        previewVariant: "",
        enableUpload: true,
      };
    } else if (value === "none") {
      // Handle the 'none' case by setting config to null
      configObj = null;
    }

    setCurrentParameter((prev) => ({
      ...prev,
      config: configObj,
    }));
  };

  // Handle changes to parameter config properties
  const handleConfigChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (!currentParameter.config) return;

    setCurrentParameter((prev) => ({
      ...prev,
      config: prev.config
        ? {
            ...prev.config,
            [name]: value,
          }
        : null,
    }));
  };

  // Handle checkbox changes to config
  const handleConfigCheckboxChange = (name: string, checked: boolean) => {
    if (!currentParameter.config) return;

    setCurrentParameter((prev) => ({
      ...prev,
      config: prev.config
        ? {
            ...prev.config,
            [name]: checked,
          }
        : null,
    }));
  };

  // Handle changes to dropdown values (comma-separated list)
  const handleDropdownValuesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(",").map((val) => val.trim());

    if (!currentParameter.config) return;

    setCurrentParameter((prev) => ({
      ...prev,
      config: prev.config
        ? {
            ...prev.config,
            value: values,
          }
        : null,
    }));
  };

  // Handle changes to selectable node types (comma-separated list)
  const handleNodeTypesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nodeTypes = e.target.value.split(",").map((type) => type.trim());

    if (!currentParameter.config) return;

    setCurrentParameter((prev) => ({
      ...prev,
      config: prev.config
        ? {
            ...prev.config,
            pickerSelectableNodeTypes: nodeTypes,
          }
        : null,
    }));
  };

  // Add or update a parameter
  const addParameter = () => {
    // Validate parameter form
    if (!currentParameter.name) {
      alert("Parameter name is required");
      return;
    }

    // Check if parameter name is unique
    if (
      formData.parameters.some((p) => p.name === currentParameter.name) &&
      editingParameterIndex === -1
    ) {
      alert(`A parameter with name "${currentParameter.name}" already exists`);
      return;
    }

    if (editingParameterIndex >= 0) {
      // Update existing parameter
      const updatedParameters = [...formData.parameters];
      updatedParameters[editingParameterIndex] = { ...currentParameter };

      setFormData((prev) => ({
        ...prev,
        parameters: updatedParameters,
      }));

      setEditingParameterIndex(-1);
    } else {
      // Add new parameter
      setFormData((prev) => ({
        ...prev,
        parameters: [...prev.parameters, { ...currentParameter }],
      }));
    }

    // Reset parameter form
    setCurrentParameter({
      name: "",
      valueType: "string",
      required: false,
      hidden: false,
      overlay: false,
      defaultValue: "",
      displayName: "",
      system: false,
      config: null,
    });
    setConfigType("");
  };

  // Edit an existing parameter
  const editParameter = (index: number) => {
    const parameter = formData.parameters[index];
    setCurrentParameter({ ...parameter });

    // Set config type if config exists
    if (parameter.config) {
      setConfigType(parameter.config.type || "none");
    } else {
      setConfigType("none");
    }

    setEditingParameterIndex(index);
  };

  // Delete a parameter
  const deleteParameter = (index: number) => {
    const updatedParameters = [...formData.parameters];
    updatedParameters.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      parameters: updatedParameters,
    }));
  };

  // Cancel editing the current parameter
  const cancelParameterEdit = () => {
    setCurrentParameter({
      name: "",
      valueType: "string",
      required: false,
      hidden: false,
      overlay: false,
      defaultValue: "",
      displayName: "",
      system: false,
      config: null,
    });
    setConfigType("none");
    setEditingParameterIndex(-1);
  };

  // Handle changes to the current field group being edited
  const handleFieldGroupChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentFieldGroup((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes to field group parameters checkboxes
  const handleFieldGroupParameterToggle = (paramName: string) => {
    setCurrentFieldGroup((prev) => {
      const paramIndex = prev.parameters.indexOf(paramName);
      if (paramIndex >= 0) {
        // Remove parameter if it exists
        const newParams = [...prev.parameters];
        newParams.splice(paramIndex, 1);
        return { ...prev, parameters: newParams };
      } else {
        // Add parameter if it doesn't exist
        return { ...prev, parameters: [...prev.parameters, paramName] };
      }
    });
  };

  // Add or update a field group
  const addFieldGroup = () => {
    // Validate field group form
    if (!currentFieldGroup.name) {
      alert("Field group name is required");
      return;
    }

    // Check if field group name is unique
    if (
      formData.fieldGroups.some((g) => g.name === currentFieldGroup.name) &&
      editingFieldGroupIndex === -1
    ) {
      alert(
        `A field group with name "${currentFieldGroup.name}" already exists`
      );
      return;
    }

    if (editingFieldGroupIndex >= 0) {
      // Update existing field group
      const updatedFieldGroups = [...formData.fieldGroups];
      updatedFieldGroups[editingFieldGroupIndex] = { ...currentFieldGroup };

      setFormData((prev) => ({
        ...prev,
        fieldGroups: updatedFieldGroups,
      }));

      setEditingFieldGroupIndex(-1);
    } else {
      // Add new field group
      setFormData((prev) => ({
        ...prev,
        fieldGroups: [...prev.fieldGroups, { ...currentFieldGroup }],
      }));
    }

    // Reset field group form
    setCurrentFieldGroup({
      name: "",
      displayName: "",
      parameters: [],
    });
  };

  // Edit an existing field group
  const editFieldGroup = (index: number) => {
    setCurrentFieldGroup({ ...formData.fieldGroups[index] });
    setEditingFieldGroupIndex(index);
  };

  // Delete a field group
  const deleteFieldGroup = (index: number) => {
    const updatedFieldGroups = [...formData.fieldGroups];
    updatedFieldGroups.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      fieldGroups: updatedFieldGroups,
    }));
  };

  // Cancel editing the current field group
  const cancelFieldGroupEdit = () => {
    setCurrentFieldGroup({
      name: "",
      displayName: "",
      parameters: [],
    });
    setEditingFieldGroupIndex(-1);
  };

  // Submit the form
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!formData.id.includes("/")) {
      alert('Component ID must be in format "group/name"');
      return;
    }

    onSave(formData);
  };

  // Extract component name from ID for new components
  const handleComponentNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      id: `${groupName}/${name}`,
    }));
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-card z-10">
        <h2 className="text-xl font-semibold">
          {component ? "Edit Component" : "Create Component"}
        </h2>
        <div className="flex space-x-3">
          <Button
            onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
          >
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 pt-6 border-b">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="fieldgroups">Field Groups</TabsTrigger>
          </TabsList>
        </div>

        <form onSubmit={handleSubmit}>
          <TabsContent value="basic" className="p-6 space-y-6">
            {component ? (
              <div className="grid gap-2">
                <Label htmlFor="id">ID</Label>
                <Input id="id" name="id" value={formData.id} disabled={true} />
                <p className="text-xs text-muted-foreground">
                  Format: group/name
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="componentName">Component Name*</Label>
                <Input
                  id="componentName"
                  name="componentName"
                  onChange={handleComponentNameChange}
                  placeholder="e.g. banner, video, carousel"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be part of the component ID: {groupName}/
                  <em>name</em>
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="extends">Extends</Label>
              <Input
                id="extends"
                name="extends"
                value={formData.extends}
                onChange={handleComponentChange}
                placeholder="e.g. base/component"
              />
              <p className="text-xs text-muted-foreground">
                Component definition this extends from
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  name="label"
                  value={formData.label || ""}
                  onChange={handleComponentChange}
                  placeholder="e.g. Banner, Video"
                />
                <p className="text-xs text-muted-foreground">
                  Display name in the UI
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ctype">Component Type</Label>
                <Input
                  id="ctype"
                  name="ctype"
                  value={formData.ctype || ""}
                  onChange={handleComponentChange}
                  placeholder="e.g. Banner, Video"
                />
                <p className="text-xs text-muted-foreground">
                  Frontend component type
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="xtype">XType</Label>
                <Input
                  id="xtype"
                  name="xtype"
                  value={formData.xtype || ""}
                  onChange={handleComponentChange}
                  placeholder="e.g. hst.span"
                />
                <p className="text-xs text-muted-foreground">
                  Frontend layout type
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contentType">Content Type</Label>
                <Input
                  id="contentType"
                  name="contentType"
                  value={formData.contentType || ""}
                  onChange={handleComponentChange}
                  placeholder="e.g. brxsaas:banner"
                />
                <p className="text-xs text-muted-foreground">
                  Content type for component content
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="icon">Icon (Base64)</Label>
              <Textarea
                id="icon"
                name="icon"
                value={formData.icon || ""}
                onChange={handleComponentChange}
                placeholder="data:image/svg+xml;base64,..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Base64 encoded icon for this component
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hidden"
                  checked={formData.hidden}
                  onCheckedChange={(checked) =>
                    handleComponentCheckboxChange("hidden", checked as boolean)
                  }
                />
                <div>
                  <Label htmlFor="hidden" className="cursor-pointer">
                    Hidden
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hide this component in the UI
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="system"
                  checked={formData.system}
                  onCheckedChange={(checked) =>
                    handleComponentCheckboxChange("system", checked as boolean)
                  }
                />
                <div>
                  <Label htmlFor="system" className="cursor-pointer">
                    System
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mark as protected system component
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="p-6">
            <div className="mb-6">
              {formData.parameters.length === 0 ? (
                <div className="py-12 text-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">
                    No parameters defined yet. Add some below.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Config Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.parameters.map((parameter, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {parameter.name}
                          </TableCell>
                          <TableCell>{parameter.displayName || "-"}</TableCell>
                          <TableCell>{parameter.valueType}</TableCell>
                          <TableCell>
                            {parameter.required ? "Yes" : "No"}
                          </TableCell>
                          <TableCell>{parameter.config?.type || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editParameter(index)}
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteParameter(index)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {editingParameterIndex >= 0
                    ? "Edit Parameter"
                    : "Add Parameter"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="parameterName">Name*</Label>
                    <Input
                      id="parameterName"
                      name="name"
                      value={currentParameter.name}
                      onChange={handleParameterChange}
                      placeholder="e.g. url, document, title"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="parameterDisplayName">Display Name</Label>
                    <Input
                      id="parameterDisplayName"
                      name="displayName"
                      value={currentParameter.displayName || ""}
                      onChange={handleParameterChange}
                      placeholder="e.g. URL, Document, Title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="parameterType">Type*</Label>
                    <Select
                      value={currentParameter.valueType}
                      onValueChange={(value) =>
                        handleParameterSelectChange("valueType", value)
                      }
                    >
                      <SelectTrigger id="parameterType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {parameterTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="parameterDefaultValue">Default Value</Label>
                    <Input
                      id="parameterDefaultValue"
                      name="defaultValue"
                      value={currentParameter.defaultValue || ""}
                      onChange={handleParameterChange}
                      placeholder="Default value"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paramRequired"
                      checked={currentParameter.required}
                      onCheckedChange={(checked) =>
                        handleParameterCheckboxChange(
                          "required",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="paramRequired" className="cursor-pointer">
                      Required
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paramHidden"
                      checked={currentParameter.hidden}
                      onCheckedChange={(checked) =>
                        handleParameterCheckboxChange(
                          "hidden",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="paramHidden" className="cursor-pointer">
                      Hidden
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paramOverlay"
                      checked={currentParameter.overlay}
                      onCheckedChange={(checked) =>
                        handleParameterCheckboxChange(
                          "overlay",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="paramOverlay" className="cursor-pointer">
                      Overlay
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paramSystem"
                      checked={currentParameter.system}
                      onCheckedChange={(checked) =>
                        handleParameterCheckboxChange(
                          "system",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="paramSystem" className="cursor-pointer">
                      System
                    </Label>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="grid gap-2">
                    <Label htmlFor="configType">Config Type</Label>
                    <Select
                      value={configType}
                      onValueChange={handleConfigTypeChange}
                    >
                      <SelectTrigger id="configType">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="contentpath">
                          Content Path
                        </SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="imagesetpath">
                          Image Set Path
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {configType === "contentpath" && currentParameter.config && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="pickerConfiguration">
                              Picker Configuration
                            </Label>
                            <Input
                              id="pickerConfiguration"
                              name="pickerConfiguration"
                              value={
                                currentParameter.config.pickerConfiguration ||
                                ""
                              }
                              onChange={handleConfigChange}
                              placeholder="e.g. cms-pickers/documents-only"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="pickerInitialPath">
                              Initial Path
                            </Label>
                            <Input
                              id="pickerInitialPath"
                              name="pickerInitialPath"
                              value={
                                currentParameter.config.pickerInitialPath || ""
                              }
                              onChange={handleConfigChange}
                              placeholder="e.g. banners"
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="pickerSelectableNodeTypes">
                            Selectable Node Types
                          </Label>
                          <Input
                            id="pickerSelectableNodeTypes"
                            name="pickerSelectableNodeTypes"
                            value={
                              currentParameter.config.pickerSelectableNodeTypes?.join(
                                ", "
                              ) || ""
                            }
                            onChange={handleNodeTypesChange}
                            placeholder="e.g. banner, image, document"
                          />
                          <p className="text-xs text-muted-foreground">
                            Comma-separated list of node types
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="pickerRememberLastVisited"
                              checked={
                                currentParameter.config
                                  .pickerRememberLastVisited || false
                              }
                              onCheckedChange={(checked) =>
                                handleConfigCheckboxChange(
                                  "pickerRememberLastVisited",
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor="pickerRememberLastVisited"
                              className="cursor-pointer"
                            >
                              Remember Last Visited
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="relative"
                              checked={
                                currentParameter.config.relative || false
                              }
                              onCheckedChange={(checked) =>
                                handleConfigCheckboxChange(
                                  "relative",
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor="relative"
                              className="cursor-pointer"
                            >
                              Relative Path
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {configType === "dropdown" && currentParameter.config && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="sourceId">Source ID</Label>
                            <Input
                              id="sourceId"
                              name="sourceId"
                              value={currentParameter.config.sourceId || ""}
                              onChange={handleConfigChange}
                              placeholder="Source ID for the dropdown"
                              required={configType === "dropdown"}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="dropdownValues">Values</Label>
                            <Input
                              id="dropdownValues"
                              name="dropdownValues"
                              value={
                                currentParameter.config.value?.join(", ") || ""
                              }
                              onChange={handleDropdownValuesChange}
                              placeholder="e.g. value1, value2, value3"
                            />
                            <p className="text-xs text-muted-foreground">
                              Comma-separated list of values
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {configType === "imagesetpath" && currentParameter.config && (
                    <Card className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="pickerConfiguration">
                              Picker Configuration
                            </Label>
                            <Input
                              id="pickerConfiguration"
                              name="pickerConfiguration"
                              value={
                                currentParameter.config.pickerConfiguration ||
                                ""
                              }
                              onChange={handleConfigChange}
                              placeholder="e.g. cms-pickers/images"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="pickerInitialPath">
                              Initial Path
                            </Label>
                            <Input
                              id="pickerInitialPath"
                              name="pickerInitialPath"
                              value={
                                currentParameter.config.pickerInitialPath || ""
                              }
                              onChange={handleConfigChange}
                              placeholder="e.g. gallery"
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="previewVariant">
                            Preview Variant
                          </Label>
                          <Input
                            id="previewVariant"
                            name="previewVariant"
                            value={currentParameter.config.previewVariant || ""}
                            onChange={handleConfigChange}
                            placeholder="e.g. thumbnail"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="pickerRememberLastVisited"
                              checked={
                                currentParameter.config
                                  .pickerRememberLastVisited || false
                              }
                              onCheckedChange={(checked) =>
                                handleConfigCheckboxChange(
                                  "pickerRememberLastVisited",
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor="pickerRememberLastVisited"
                              className="cursor-pointer"
                            >
                              Remember Last Visited
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="enableUpload"
                              checked={
                                currentParameter.config.enableUpload || false
                              }
                              onCheckedChange={(checked) =>
                                handleConfigCheckboxChange(
                                  "enableUpload",
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor="enableUpload"
                              className="cursor-pointer"
                            >
                              Enable Upload
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={addParameter}
                    disabled={!currentParameter.name}
                  >
                    {editingParameterIndex >= 0 ? (
                      "Update Parameter"
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Parameter
                      </>
                    )}
                  </Button>

                  {editingParameterIndex >= 0 && (
                    <Button variant="outline" onClick={cancelParameterEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fieldgroups" className="p-6">
            <div className="mb-6">
              {formData.fieldGroups.length === 0 ? (
                <div className="py-12 text-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">
                    No field groups defined yet. Add some below.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Parameters</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.fieldGroups.map((group, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {group.name}
                          </TableCell>
                          <TableCell>{group.displayName || "-"}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {group.parameters.length > 0
                              ? group.parameters.join(", ")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => editFieldGroup(index)}
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteFieldGroup(index)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {editingFieldGroupIndex >= 0
                    ? "Edit Field Group"
                    : "Add Field Group"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fieldGroupName">Name*</Label>
                    <Input
                      id="fieldGroupName"
                      name="name"
                      value={currentFieldGroup.name}
                      onChange={handleFieldGroupChange}
                      placeholder="e.g. basic-settings, advanced"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fieldGroupDisplayName">Display Name</Label>
                    <Input
                      id="fieldGroupDisplayName"
                      name="displayName"
                      value={currentFieldGroup.displayName || ""}
                      onChange={handleFieldGroupChange}
                      placeholder="e.g. Basic Settings, Advanced"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Parameters</Label>

                  {formData.parameters.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No parameters available. Add parameters first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 p-2 border rounded-md">
                      {formData.parameters.map((param, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`param-${index}`}
                            checked={currentFieldGroup.parameters.includes(
                              param.name
                            )}
                            onCheckedChange={() =>
                              handleFieldGroupParameterToggle(param.name)
                            }
                          />
                          <Label
                            htmlFor={`param-${index}`}
                            className="cursor-pointer"
                          >
                            {param.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={addFieldGroup}
                    disabled={
                      !currentFieldGroup.name ||
                      formData.parameters.length === 0
                    }
                  >
                    {editingFieldGroupIndex >= 0 ? (
                      "Update Field Group"
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Field Group
                      </>
                    )}
                  </Button>

                  {editingFieldGroupIndex >= 0 && (
                    <Button variant="outline" onClick={cancelFieldGroupEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
};

export default ComponentEditor;
