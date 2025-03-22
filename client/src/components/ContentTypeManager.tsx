import { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, Edit, Trash2, Copy, Download } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ContentTypeEditor from './ContentTypeEditor';
import { ContentType, ContentTypeManagerProps, ApiRequest } from '../types';

const ContentTypeManager: React.FC<ContentTypeManagerProps> = ({ makeApiRequest }) => {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [contentTypeMode, setContentTypeMode] = useState<'core' | 'development'>('core');
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editingContentType, setEditingContentType] = useState<ContentType | null>(null);
  const [jsonExport, setJsonExport] = useState<ContentType | null>(null);
  // Using Sonner toast directly

  // Fetch content types when mode changes
  useEffect(() => {
    fetchContentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTypeMode]);

  // Fetch content types from API
  const fetchContentTypes = async () => {
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: 'contentTypes',
        operation: 'get',
        contentTypeMode,
        brxHost: '',
        authToken: ''
      };
      
      const result = await makeApiRequest(params);
      
      if (result.success && result.data) {
        setContentTypes(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch content types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get content type details for editing
  const getContentTypeDetails = async (id: string) => {
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: 'contentTypes',
        operation: 'getById',
        contentTypeMode,
        resourceId: id,
        brxHost: '',
        authToken: ''
      };
      
      const result = await makeApiRequest(params);
      
      if (result.success && result.data) {
        // Include resource version for PUT operations
        const contentType: ContentType = {
          ...result.data,
          resourceVersion: result.resourceVersion
        };
        
        setEditingContentType(contentType);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('Failed to fetch content type details:', error);
      toast.error("Failed to load content type details");
    } finally {
      setLoading(false);
    }
  };

  // Delete a content type
  const deleteContentType = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete content type ${id}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const params: ApiRequest = {
        section: 'contentTypes',
        operation: 'delete',
        contentTypeMode,
        resourceId: id,
        brxHost: '',
        authToken: ''
      };
      
      const result = await makeApiRequest(params);
      
      if (result.success) {
        toast.success(`Content type ${id} deleted successfully`);
        fetchContentTypes();
      }
    } catch (error) {
      console.error('Failed to delete content type:', error);
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
      const operation = contentType.resourceVersion ? 'update' : 'create';
      const resourceId = contentType.id || contentType.name;
      
      const params: ApiRequest = {
        section: 'contentTypes',
        operation,
        contentTypeMode,
        resourceId,
        resourceData: contentType,
        brxHost: '',
        authToken: ''
      };
      
      const result = await makeApiRequest(params);
      
      if (result.success) {
        toast.success(`Content type ${operation === 'create' ? 'created' : 'updated'} successfully`);
        setShowEditor(false);
        fetchContentTypes();
      }
    } catch (error) {
      console.error('Failed to save content type:', error);
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
    
    navigator.clipboard.writeText(JSON.stringify(jsonExport, null, 2))
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  // Download JSON file
  const downloadJson = () => {
    if (!jsonExport) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${jsonExport.name || 'content-type'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="container mx-auto p-6">
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
                onValueChange={(value) => value && setContentTypeMode(value as 'core' | 'development')}
                className="border rounded-md"
              >
                <ToggleGroupItem value="core">Core</ToggleGroupItem>
                <ToggleGroupItem value="development">Development</ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={createContentType} disabled={loading}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Content Type
              </Button>
              <Button variant="outline" onClick={fetchContentTypes} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
          
          <Card>
            {loading ? (
              <div className="flex justify-center items-center py-12 text-muted-foreground italic">
                Loading content types...
              </div>
            ) : contentTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground">No content types found.</p>
                <Button onClick={createContentType}>
                  Create your first content type
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
                    {contentTypes.map((contentType) => (
                      <TableRow key={contentType.id || contentType.name}>
                        <TableCell className="font-medium">{contentType.id || contentType.name}</TableCell>
                        <TableCell>{contentType.displayName || '-'}</TableCell>
                        <TableCell className="max-w-md truncate">{contentType.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => getContentTypeDetails(contentType.id || contentType.name)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteContentType(contentType.id || contentType.name)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button 
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
            <Dialog open={!!jsonExport} onOpenChange={(open) => !open && setJsonExport(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="text-lg font-medium">JSON Export: {jsonExport.id || jsonExport.name}</h3>
                  <div className="flex space-x-2">
                    <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </Button>
                    <Button variant="secondary" size="sm" onClick={downloadJson}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-grow p-4 bg-muted rounded-md my-4">
                  <pre className="text-xs">{JSON.stringify(jsonExport, null, 2)}</pre>
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
