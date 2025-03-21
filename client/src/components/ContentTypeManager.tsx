// src/components/ContentTypeManager.tsx
import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiCopy, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ContentTypeEditor from './ContentTypeEditor';
import './ContentTypeManager.css';
import { ContentType, ContentTypeManagerProps, ApiRequest } from '../types';

const ContentTypeManager: React.FC<ContentTypeManagerProps> = ({ makeApiRequest }) => {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [contentTypeMode, setContentTypeMode] = useState<'core' | 'development'>('core');
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editingContentType, setEditingContentType] = useState<ContentType | null>(null);
  const [jsonExport, setJsonExport] = useState<ContentType | null>(null);

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
      toast.error('Failed to load content type details');
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
      toast.error('Failed to delete content type');
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
      toast.error('Failed to save content type');
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
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
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
    <div className="content-type-manager">
      {showEditor ? (
        <ContentTypeEditor 
          contentType={editingContentType} 
          onSave={handleSaveContentType}
          onCancel={() => setShowEditor(false)}
          mode={contentTypeMode}
        />
      ) : (
        <>
          <div className="manager-header">
            <div className="manager-title">
              <h2>Content Types</h2>
              <div className="mode-toggle">
                <button 
                  className={`toggle-btn ${contentTypeMode === 'core' ? 'active' : ''}`}
                  onClick={() => setContentTypeMode('core')}
                >
                  Core
                </button>
                <button 
                  className={`toggle-btn ${contentTypeMode === 'development' ? 'active' : ''}`}
                  onClick={() => setContentTypeMode('development')}
                >
                  Development
                </button>
              </div>
            </div>
            
            <div className="manager-actions">
              <button 
                className="btn btn-primary"
                onClick={createContentType}
                disabled={loading}
              >
                <FiPlus /> New Content Type
              </button>
              <button 
                className="btn btn-outline"
                onClick={fetchContentTypes}
                disabled={loading}
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>
          
          <div className="content-type-list-container">
            {loading ? (
              <div className="loading">Loading content types...</div>
            ) : contentTypes.length === 0 ? (
              <div className="empty-state">
                <p>No content types found.</p>
                <button className="btn btn-primary" onClick={createContentType}>
                  Create your first content type
                </button>
              </div>
            ) : (
              <div className="content-type-list">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Display Name</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentTypes.map((contentType) => (
                      <tr key={contentType.id || contentType.name}>
                        <td>{contentType.id || contentType.name}</td>
                        <td>{contentType.displayName || '-'}</td>
                        <td className="description-cell">{contentType.description || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="icon-btn edit"
                              onClick={() => getContentTypeDetails(contentType.id || contentType.name)}
                              title="Edit"
                            >
                              <FiEdit2 />
                            </button>
                            <button 
                              className="icon-btn delete"
                              onClick={() => deleteContentType(contentType.id || contentType.name)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                            <button 
                              className="icon-btn export"
                              onClick={() => exportContentType(contentType)}
                              title="Export"
                            >
                              <FiCopy />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {jsonExport && (
            <div className="json-export">
              <div className="export-header">
                <h3>JSON Export: {jsonExport.id || jsonExport.name}</h3>
                <div className="export-actions">
                  <button className="btn btn-sm" onClick={copyToClipboard}>
                    <FiCopy /> Copy
                  </button>
                  <button className="btn btn-sm" onClick={downloadJson}>
                    <FiDownload /> Download
                  </button>
                  <button 
                    className="btn btn-sm btn-outline" 
                    onClick={() => setJsonExport(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <pre className="json-content">
                {JSON.stringify(jsonExport, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContentTypeManager;
