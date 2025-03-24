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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  PlusCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ContentType, ContentTypeEditorProps, Property } from "../types";
import FilterInput from "./FilterInput";

const ContentTypeEditor: React.FC<ContentTypeEditorProps> = ({
  contentType,
  onSave,
  onCancel,
}) => {
  // State for the content type being edited
  const [formData, setFormData] = useState<ContentType>({
    name: "",
    displayName: "",
    description: "",
    properties: [],
    resourceVersion: undefined,
  });

  // State for the current property being edited
  const [currentProperty, setCurrentProperty] = useState<Property>({
    name: "",
    displayName: "",
    type: "String",
    multiple: false,
    required: false,
  });

  // Flag to track if we're editing an existing property
  const [editingPropertyIndex, setEditingPropertyIndex] = useState<number>(-1);

  // Add property filter state
  const [propertyFilter, setPropertyFilter] = useState<string>("");

  // Load content type data if editing an existing one
  useEffect(() => {
    if (contentType) {
      // Normalize the API response to use properties in our UI
      // The API uses 'fields' but our UI uses 'properties'
      const contentTypeProperties =
        contentType.fields || contentType.properties || [];

      // Log the content type structure for debugging
      console.log("Content type structure:", contentType);

      // Transform the content type data to match our form structure
      const transformedData: ContentType = {
        name: contentType.name || contentType.id || "",
        displayName: contentType.displayName || "",
        description: contentType.description || "",
        properties: contentTypeProperties,
        resourceVersion: contentType.resourceVersion || undefined,
      };

      setFormData(transformedData);
    }
  }, [contentType]);

  // Handle changes to the content type form fields
  const handleContentTypeChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes to the current property being edited
  const handlePropertyChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setCurrentProperty((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setCurrentProperty((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCurrentProperty((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Handle property filter change
  const handlePropertyFilterChange = (value: string) => {
    setPropertyFilter(value);
  };

  // Filter properties
  const filteredProperties = formData.properties.filter((property) => {
    if (!propertyFilter) return true;

    const searchTerm = propertyFilter.toLowerCase();
    return (
      property.name.toLowerCase().includes(searchTerm) ||
      (property.displayName || "").toLowerCase().includes(searchTerm) ||
      property.type.toLowerCase().includes(searchTerm)
    );
  });

  // Add a new property to the content type
  const addProperty = () => {
    // Validate property form
    if (!currentProperty.name || !currentProperty.type) {
      alert("Property name and type are required");
      return;
    }

    // Check if property name is unique
    if (
      formData.properties.some((p) => p.name === currentProperty.name) &&
      editingPropertyIndex === -1
    ) {
      alert(`A property with name "${currentProperty.name}" already exists`);
      return;
    }

    if (editingPropertyIndex >= 0) {
      // Update existing property
      const updatedProperties = [...formData.properties];
      updatedProperties[editingPropertyIndex] = { ...currentProperty };

      setFormData((prev) => ({
        ...prev,
        properties: updatedProperties,
      }));

      setEditingPropertyIndex(-1);
    } else {
      // Add new property
      setFormData((prev) => ({
        ...prev,
        properties: [...prev.properties, { ...currentProperty }],
      }));
    }

    // Reset property form
    setCurrentProperty({
      name: "",
      displayName: "",
      type: "String",
      multiple: false,
      required: false,
    });
  };

  // Edit an existing property
  const editProperty = (index: number) => {
    setCurrentProperty(formData.properties[index]);
    setEditingPropertyIndex(index);
    // Use setTimeout to ensure the UI updates first
    setTimeout(() => {
      // Get element by ID (more reliable than ref for components)
      const editorElement = document.getElementById("property-editor-section");
      if (editorElement) {
        // Scroll the element into view
        editorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);
  };

  // Delete a property
  const deleteProperty = (index: number) => {
    const updatedProperties = [...formData.properties];
    updatedProperties.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      properties: updatedProperties,
    }));
  };

  // Move a property up in the list
  const movePropertyUp = (index: number) => {
    if (index === 0) return;

    const updatedProperties = [...formData.properties];
    const temp = updatedProperties[index];
    updatedProperties[index] = updatedProperties[index - 1];
    updatedProperties[index - 1] = temp;

    setFormData((prev) => ({
      ...prev,
      properties: updatedProperties,
    }));
  };

  // Move a property down in the list
  const movePropertyDown = (index: number) => {
    if (index === formData.properties.length - 1) return;

    const updatedProperties = [...formData.properties];
    const temp = updatedProperties[index];
    updatedProperties[index] = updatedProperties[index + 1];
    updatedProperties[index + 1] = temp;

    setFormData((prev) => ({
      ...prev,
      properties: updatedProperties,
    }));
  };

  // Cancel editing the current property
  const cancelPropertyEdit = () => {
    setCurrentProperty({
      name: "",
      displayName: "",
      type: "String",
      multiple: false,
      required: false,
    });
    setEditingPropertyIndex(-1);
  };

  // Submit the form
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name) {
      alert("Content type name is required");
      return;
    }

    // Format the data for API
    const apiData: ContentType = {
      ...formData,
      id: formData.name,
      resourceVersion: formData.resourceVersion,
    };

    onSave(apiData);
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-card z-10">
        <h2 className="text-xl font-semibold">
          {contentType ? "Edit Content Type" : "Create Content Type"}
        </h2>
        <div className="flex space-x-3">
          <Button
            onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
            className="cursor-pointer"
            type="submit"
          >
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer"
            type="button"
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="divide-y">
        <div className="p-6">
          <h3 className="text-base font-semibold text-primary mb-4">
            Basic Information
          </h3>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleContentTypeChange}
                disabled={!!contentType} // Can't change name when editing
                required
                placeholder="e.g. banner, product, article"
              />
              <p className="text-xs text-muted-foreground">
                Technical name (lowercase, no spaces)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleContentTypeChange}
                placeholder="e.g. Banner, Product, Article"
              />
              <p className="text-xs text-muted-foreground">
                Human-readable name
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleContentTypeChange}
                placeholder="Describe the purpose of this content type"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-base font-semibold text-primary mb-4">
            Properties
          </h3>

          <div className="mb-6">
            {formData.properties.length === 0 ? (
              <div className="py-12 text-center bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  No fields defined yet. Add some below.
                </p>
              </div>
            ) : (
              <>
                {/* Add filter input for properties */}
                <div className="mb-4">
                  <FilterInput
                    placeholder="Filter fields..."
                    onFilterChange={handlePropertyFilterChange}
                  />
                </div>

                {filteredProperties.length === 0 ? (
                  <div className="py-8 text-center bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-2">
                      No fields match your filter.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPropertyFilter("")}
                    >
                      Clear filter
                    </Button>
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
                          <TableHead>Multiple</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProperties.map((property, index) => {
                          // Find original index in the unfiltered array
                          const originalIndex = formData.properties.findIndex(
                            (p) => p.name === property.name
                          );

                          return (
                            <TableRow
                              key={index}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => editProperty(index)}
                            >
                              <TableCell className="font-medium">
                                {property.name}
                              </TableCell>
                              <TableCell>
                                {property.displayName || "-"}
                              </TableCell>
                              <TableCell>{property.type}</TableCell>
                              <TableCell>
                                {property.required ? "Yes" : "No"}
                              </TableCell>
                              <TableCell>
                                {property.multiple ? "Yes" : "No"}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      movePropertyUp(originalIndex)
                                    }
                                    disabled={originalIndex === 0}
                                    title="Move Up"
                                    type="button"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      movePropertyDown(originalIndex)
                                    }
                                    disabled={
                                      originalIndex ===
                                      formData.properties.length - 1
                                    }
                                    title="Move Down"
                                    type="button"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => editProperty(originalIndex)}
                                    title="Edit"
                                    type="button"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      deleteProperty(originalIndex)
                                    }
                                    title="Delete"
                                    type="button"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>

          <div id="property-editor-section">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {editingPropertyIndex >= 0 ? "Edit Field" : "Add Field"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="grid gap-2">
                    <Label htmlFor="propertyName">Name*</Label>
                    <Input
                      id="propertyName"
                      name="name"
                      value={currentProperty.name}
                      onChange={handlePropertyChange}
                      placeholder="e.g. title, description, image"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="propertyDisplayName">Display Name</Label>
                    <Input
                      id="propertyDisplayName"
                      name="displayName"
                      value={currentProperty.displayName || ""}
                      onChange={handlePropertyChange}
                      placeholder="e.g. Title, Description, Image"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="grid gap-2">
                    <Label htmlFor="propertyType">Type*</Label>
                    <Select
                      value={currentProperty.type}
                      onValueChange={(value) =>
                        handleSelectChange("type", value)
                      }
                    >
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="String">String</SelectItem>
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="Html">Rich Text (HTML)</SelectItem>
                        <SelectItem value="Boolean">Boolean</SelectItem>
                        <SelectItem value="Long">Number (Integer)</SelectItem>
                        <SelectItem value="Double">Number (Decimal)</SelectItem>
                        <SelectItem value="Date">Date</SelectItem>
                        <SelectItem value="Link">Link</SelectItem>
                        <SelectItem value="Image">Image</SelectItem>
                        <SelectItem value="Reference">Reference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="required"
                        checked={currentProperty.required}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("required", checked as boolean)
                        }
                      />
                      <Label htmlFor="required" className="cursor-pointer">
                        Required
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="multiple"
                        checked={currentProperty.multiple}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange("multiple", checked as boolean)
                        }
                      />
                      <Label htmlFor="multiple" className="cursor-pointer">
                        Multiple Values
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    onClick={addProperty}
                    disabled={!currentProperty.name || !currentProperty.type}
                  >
                    {editingPropertyIndex >= 0 ? (
                      "Update Property"
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Property
                      </>
                    )}
                  </Button>

                  {editingPropertyIndex >= 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelPropertyEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContentTypeEditor;
