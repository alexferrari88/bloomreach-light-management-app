// client/src/components/ContentTypeManager.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Copy,
  Download,
  Edit,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApi } from "../contexts/ApiContext";
import { copyJsonToClipboard, exportToJson } from "../lib/exportUtils";
import { ApiRequest, ContentType } from "../types";
import ContentTypeEditor from "./ContentTypeEditor";
import FilterInput from "./FilterInput";

const ContentTypeManager: React.FC = () => {
  const { queueOperation, executeOperation } = useApi();

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [contentTypeMode, setContentTypeMode] = useState<
    "core" | "development"
  >("core");
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editingContentType, setEditingContentType] =
    useState<ContentType | null>(null);
  const [jsonExport, setJsonExport] = useState<ContentType | null>(null);
  const [filter, setFilter] = useState<string>("");

  // Fetch content types when mode changes
  useEffect(() => {
    fetchContentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTypeMode]);

  // Filter content types based on search term
  const filteredContentTypes = contentTypes.filter((contentType) => {
    if (!filter) return true;

    const searchTerm = filter.toLowerCase();
    return (
      (contentType.id || contentType.name).toLowerCase().includes(searchTerm) ||
      (contentType.displayName || "").toLowerCase().includes(searchTerm) ||
      (contentType.description || "").toLowerCase().includes(searchTerm)
    );
  });

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Fetch content types from API
  const fetchContentTypes = async () => {
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "contentTypes",
        operation: "get",
        contentTypeMode,
        brxHost: "",
        authToken: "",
      };

      const result = await executeOperation(params);

      if (result.success && result.data) {
        // Map the API response structure to our expected format
        // The API returns 'fields' but our UI works with 'properties'
        const mappedContentTypes = result.data.map((ct: any) => {
          // Always normalize to have properties for UI consistency
          return {
            ...ct,
            properties: ct.fields || ct.properties || [],
          };
        });

        console.log("Mapped content types:", mappedContentTypes);
        setContentTypes(mappedContentTypes);
      }
    } catch (error) {
      console.error("Failed to fetch content types:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get content type details for editing
  const getContentTypeDetails = async (id: string) => {
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "contentTypes",
        operation: "getById",
        contentTypeMode,
        resourceId: id,
        brxHost: "",
        authToken: "",
      };

      const result = await executeOperation(params);

      if (result.success && result.data) {
        // Include resource version for PUT operations
        const contentType: ContentType = {
          ...result.data,
          resourceVersion: result.resourceVersion,
        };

        setEditingContentType(contentType);
        setShowEditor(true);
      }
    } catch (error) {
      console.error("Failed to fetch content type details:", error);
      toast.error("Failed to load content type details");
    } finally {
      setLoading(false);
    }
  };

  // Delete a content type
  const deleteContentType = async (id: string) => {
    if (
      !window.confirm(`Are you sure you want to delete content type ${id}?`)
    ) {
      return;
    }

    setLoading(true);
    try {
      const params: ApiRequest = {
        section: "contentTypes",
        operation: "delete",
        contentTypeMode,
        resourceId: id,
        brxHost: "",
        authToken: "",
      };

      // Use queue operation instead of makeApiRequest
      const result = await queueOperation(
        params,
        "DELETE",
        "Content Type",
        id,
        `Delete content type ${id}`
      );

      if (result.success) {
        toast.success(
          `Content type ${id} ${
            result.queued ? "queued for deletion" : "deleted successfully"
          }`
        );
        if (!result.queued) {
          fetchContentTypes();
        }
      }
    } catch (error) {
      console.error("Failed to delete content type:", error);
      toast.error("Failed to delete content type");
    } finally {
      setLoading(false);
    }
  };

  // Open editor for creating a new content type
  const createContentType = () => {
    setEditingContentType(null);
    setShowEditor(true);
  };

  // Handle saving content type (create or update)
  const handleSaveContentType = async (contentType: ContentType) => {
    setLoading(true);

    try {
      const operation = contentType.resourceVersion ? "update" : "create";
      const resourceId = contentType.id || contentType.name;
      const action = operation === "create" ? "CREATE" : "UPDATE";
      const actionDescription = `${
        action === "CREATE" ? "Create" : "Update"
      } content type ${resourceId}`;

      // Check if we need to map properties to fields for the API
      // This is determined by examining what structure the API expects
      const contentTypeData = { ...contentType };

      // If the original content types from the API used 'fields' instead of 'properties',
      // we need to transform it back to match the API's expectations
      if (contentTypes.length > 0 && contentTypes[0].fields) {
        contentTypeData.fields = contentTypeData.properties;
        delete contentTypeData.properties;
      }

      const params: ApiRequest = {
        section: "contentTypes",
        operation,
        contentTypeMode,
        resourceId,
        resourceData: contentTypeData,
        brxHost: "",
        authToken: "",
      };

      // Use queue operation instead of makeApiRequest
      const result = await queueOperation(
        params,
        action,
        "Content Type",
        resourceId,
        actionDescription,
        contentType.resourceVersion ? contentType : null
      );

      if (result.success) {
        toast.success(
          `Content type ${resourceId} ${result.queued ? "queued for" : ""} ${
            operation === "create" ? "created" : "updated"
          } successfully`
        );
        setShowEditor(false);

        if (!result.queued) {
          fetchContentTypes();
        }
      }
    } catch (error) {
      console.error("Failed to save content type:", error);
      toast.error("Failed to save content type");
    } finally {
      setLoading(false);
    }
  };

  // Export content type to JSON
  const exportContentType = (contentType: ContentType) => {
    setJsonExport(contentType);
  };

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    if (!jsonExport) return;
    copyJsonToClipboard(jsonExport);
  };

  // Download JSON file
  const downloadJson = () => {
    if (!jsonExport) return;
    const fileName = jsonExport.name || "content-type";
    exportToJson(jsonExport, fileName);
  };

  return (
    <div className="container mx-auto">
      {showEditor ? (
        <ContentTypeEditor
          contentType={editingContentType}
          onSave={handleSaveContentType}
          onCancel={() => setShowEditor(false)}
          mode={contentTypeMode}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Content Types</h2>
              <ToggleGroup
                type="single"
                value={contentTypeMode}
                onValueChange={(value) =>
                  value && setContentTypeMode(value as "core" | "development")
                }
                className="border rounded-md"
              >
                <ToggleGroupItem
                  value="core"
                  className="px-4 min-w-[100px] cursor-pointer"
                >
                  Core
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="development"
                  className="px-4 min-w-[100px] cursor-pointer"
                >
                  Development
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={createContentType}
                disabled={loading}
                className="cursor-pointer"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> New Content Type
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={fetchContentTypes}
                disabled={loading}
                className="cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          {/* Add filter input */}
          <div className="mb-4">
            <FilterInput
              placeholder="Filter content types..."
              onFilterChange={handleFilterChange}
            />
          </div>

          <Card>
            {loading ? (
              <div className="flex justify-center items-center py-12 text-muted-foreground italic">
                Loading content types...
              </div>
            ) : contentTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground">No content types found.</p>
                <Button type="button" onClick={createContentType}>
                  Create your first content type
                </Button>
              </div>
            ) : filteredContentTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground">
                  No content types match your filter.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFilter("")}
                >
                  Clear filter
                </Button>
              </div>
            ) : (
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContentTypes.map((contentType) => (
                      <TableRow
                        key={contentType.id || contentType.name}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          getContentTypeDetails(
                            contentType.id || contentType.name
                          )
                        }
                      >
                        <TableCell className="font-medium">
                          {contentType.id || contentType.name}
                        </TableCell>
                        <TableCell>{contentType.displayName || "-"}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {contentType.description || "-"}
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
                                getContentTypeDetails(
                                  contentType.id || contentType.name
                                )
                              }
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                deleteContentType(
                                  contentType.id || contentType.name
                                )
                              }
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => exportContentType(contentType)}
                              title="Export"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>

          {jsonExport && (
            <Dialog
              open={!!jsonExport}
              onOpenChange={(open) => !open && setJsonExport(null)}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="text-lg font-medium">
                    JSON Export: {jsonExport.id || jsonExport.name}
                  </h3>
                  <div className="flex space-x-2">
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
                </div>
                <div className="overflow-y-auto flex-grow p-4 bg-muted rounded-md my-4">
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

export default ContentTypeManager;
