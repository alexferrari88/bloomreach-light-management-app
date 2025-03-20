// src/components/ComponentManager.js
import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiCopy, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ComponentEditor from './ComponentEditor';
import './ComponentManager.css';

const ComponentManager = ({ makeApiRequest }) => {
  const [componentGroups, setComponentGroups] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [currentGroup, setCurrentGroup] = useState('');
  const [channelId, setChannelId] = useState('');
  const [jsonExport, setJsonExport] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', hidden: false, system: false });

  // Fetch component groups when channel ID changes
  useEffect(() => {
    if (channelId) {
      fetchComponentGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Fetch components when group changes
  useEffect(() => {
    if (channelId && currentGroup) {
      fetchComponents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroup]);

  // Fetch component groups from API
  const fetchComponentGroups = async () => {
    setLoading(true);
    try {
      const result = await makeApiRequest({
        section: 'components',
        operation: 'getGroups',
        channelId
      });
      
      if (result.success) {
        setComponentGroups(result.data);
        
        // Set the first group as current if there's no current group
        if (result.data.length > 0 && !currentGroup) {
          setCurrentGroup(result.data[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch component groups:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch components for the current group
  const fetchComponents = async () => {
    setLoading(true);
    try {
      const result = await makeApiRequest({
        section: 'components',
        operation: 'getComponents',
        channelId,
        componentGroup: currentGroup
      });
      
      if (result.success) {
        setComponents(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch components:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get component details for editing
  const getComponentDetails = async (componentName) => {
    setLoading(true);
    try {
      const result = await makeApiRequest({
        section: 'components',
        operation: 'getComponent',
        channelId,
        componentGroup: currentGroup,
        resourceId: componentName
      });
      
      if (result.success) {
        // Include resource version for PUT operations
        const component = {
          ...result.data,
          resourceVersion: result.resourceVersion
        };
        
        setEditingComponent(component);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('Failed to fetch component details:', error);
      toast.error('Failed to load component details');
    } finally {
      setLoading(false);
    }
  };

  // Delete a component
  const deleteComponent = async (componentName) => {
    if (!window.confirm(`Are you sure you want to delete component ${componentName}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await makeApiRequest({
        section: 'components',
        operation: 'deleteComponent',
        channelId,
        componentGroup: currentGroup,
        resourceId: componentName
      });
      
      if (result.success) {
        toast.success(`Component ${componentName} deleted successfully`);
        fetchComponents();
      }
    } catch (error) {
      console.error('Failed to delete component:', error);
      toast.error('Failed to delete component');
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
  const handleSaveComponent = async (component) => {
    setLoading(true);
    
    try {
      const operation = component.resourceVersion ? 'updateComponent' : 'createComponent';
      const resourceId = component.name || component.id.split('/')[1];
      
      const result = await makeApiRequest({
        section: 'components',
        operation,
        channelId,
        componentGroup: currentGroup,
        resourceId,
        resourceData: component
      });
      
      if (result.success) {
        toast.success(`Component ${operation === 'createComponent' ? 'created' : 'updated'} successfully`);
        setShowEditor(false);
        fetchComponents();
      }
    } catch (error) {
      console.error('Failed to save component:', error);
      toast.error('Failed to save component');
    } finally {
      setLoading(false);
    }
  };

  // Create a new component group
  const createComponentGroup = async () => {
    if (!newGroup.name) {
      toast.error('Group name is required');
      return;
    }
    
    setLoading(true);
    try {
      const result = await makeApiRequest({
        section: 'components',
        operation: 'createGroup',
        channelId,
        componentGroup: newGroup.name,
        resourceData: {
          hidden: newGroup.hidden,
          system: newGroup.system
        }
      });
      
      if (result.success) {
        toast.success(`Component group ${newGroup.name} created successfully`);
        setShowGroupForm(false);
        setNewGroup({ name: '', hidden: false, system: false });
        fetchComponentGroups();
        setCurrentGroup(newGroup.name);
      }
    } catch (error) {
      console.error('Failed to create component group:', error);
      toast.error('Failed to create component group');
    } finally {
      setLoading(false);
    }
  };

  // Delete a component group
  const deleteComponentGroup = async (groupName) => {
    if (!window.confirm(`Are you sure you want to delete component group ${groupName}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await makeApiRequest({
        section: 'components',
        operation: 'deleteGroup',
        channelId,
        componentGroup: groupName
      });
      
      if (result.success) {
        toast.success(`Component group ${groupName} deleted successfully`);
        
        // If we deleted the current group, reset it
        if (currentGroup === groupName) {
          setCurrentGroup('');
          setComponents([]);
        }
        
        fetchComponentGroups();
      }
    } catch (error) {
      console.error('Failed to delete component group:', error);
      toast.error('Failed to delete component group');
    } finally {
      setLoading(false);
    }
  };

  // Export component to JSON
  const exportComponent = (component) => {
    setJsonExport(component);
  };

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonExport, null, 2))
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  // Download JSON file
  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${jsonExport.name || 'component'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Handle changes to the channel ID input
  const handleChannelIdChange = (e) => {
    setChannelId(e.target.value);
  };

  // Handle channel ID submission
  const handleChannelIdSubmit = (e) => {
    e.preventDefault();
    if (channelId) {
      fetchComponentGroups();
    }
  };

  // Handle changes to the new group form
  const handleNewGroupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewGroup(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="component-manager">
      {showEditor ? (
        <ComponentEditor 
          component={editingComponent} 
          onSave={handleSaveComponent}
          onCancel={() => setShowEditor(false)}
          groupName={currentGroup}
        />
      ) : (
        <>
          <div className="manager-header">
            <div className="manager-title">
              <h2>Components</h2>
              
              {!channelId ? (
                <form className="channel-form" onSubmit={handleChannelIdSubmit}>
                  <div className="form-group">
                    <label htmlFor="channelId">Channel ID</label>
                    <div className="input-with-button">
                      <input
                        type="text"
                        id="channelId"
                        value={channelId}
                        onChange={handleChannelIdChange}
                        placeholder="e.g. brxsaas or brxsaas-projectId"
                        required
                      />
                      <button type="submit" className="btn">Connect</button>
                    </div>
                    <small>Enter the channel ID to manage its components</small>
                  </div>
                </form>
              ) : (
                <div className="channel-info">
                  <span>Channel: {channelId}</span>
                  <button className="btn-link" onClick={() => setChannelId('')}>Change</button>
                </div>
              )}
            </div>
            
            {channelId && (
              <div className="manager-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowGroupForm(true)}
                  disabled={loading}
                >
                  <FiPlus /> New Group
                </button>
                {currentGroup && (
                  <button 
                    className="btn btn-primary"
                    onClick={createComponent}
                    disabled={loading}
                  >
                    <FiPlus /> New Component
                  </button>
                )}
                <button 
                  className="btn btn-outline"
                  onClick={currentGroup ? fetchComponents : fetchComponentGroups}
                  disabled={loading}
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            )}
          </div>
          
          {showGroupForm && (
            <div className="group-form">
              <h3>New Component Group</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="groupName">Name*</label>
                  <input
                    type="text"
                    id="groupName"
                    name="name"
                    value={newGroup.name}
                    onChange={handleNewGroupChange}
                    placeholder="e.g. content-components"
                    required
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        name="hidden"
                        checked={newGroup.hidden}
                        onChange={handleNewGroupChange}
                      />
                      Hidden
                    </label>
                  </div>
                  
                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        name="system"
                        checked={newGroup.system}
                        onChange={handleNewGroupChange}
                      />
                      System
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-primary"
                  onClick={createComponentGroup}
                  disabled={loading}
                >
                  Create Group
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowGroupForm(false);
                    setNewGroup({ name: '', hidden: false, system: false });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {channelId && (
            <div className="component-workspace">
              <div className="component-sidebar">
                <h3>Component Groups</h3>
                {componentGroups.length === 0 ? (
                  <div className="empty-state">
                    <p>No component groups found.</p>
                    <button 
                      className="btn btn-sm"
                      onClick={() => setShowGroupForm(true)}
                    >
                      Create your first group
                    </button>
                  </div>
                ) : (
                  <ul className="group-list">
                    {componentGroups.map((group) => (
                      <li 
                        key={group.name}
                        className={currentGroup === group.name ? 'active' : ''}
                      >
                        <div 
                          className="group-item"
                          onClick={() => setCurrentGroup(group.name)}
                        >
                          <span>{group.name}</span>
                          {(group.hidden || group.system) && (
                            <span className="group-badges">
                              {group.hidden && <span className="badge">Hidden</span>}
                              {group.system && <span className="badge system">System</span>}
                            </span>
                          )}
                        </div>
                        {!group.system && (
                          <button 
                            className="icon-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteComponentGroup(group.name);
                            }}
                            title="Delete Group"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="component-content">
                {!currentGroup ? (
                  <div className="empty-state">
                    <p>Select a component group from the sidebar or create a new one.</p>
                  </div>
                ) : loading ? (
                  <div className="loading">Loading components...</div>
                ) : components.length === 0 ? (
                  <div className="empty-state">
                    <p>No components found in group "{currentGroup}".</p>
                    <button className="btn btn-primary" onClick={createComponent}>
                      Create your first component
                    </button>
                  </div>
                ) : (
                  <div className="component-list">
                    <h3>Components in {currentGroup}</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Label</th>
                          <th>Type</th>
                          <th>Hidden</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {components.map((component) => {
                          const componentName = component.id.split('/')[1];
                          return (
                            <tr key={component.id}>
                              <td>{componentName}</td>
                              <td>{component.label || '-'}</td>
                              <td>{component.ctype || '-'}</td>
                              <td>{component.hidden ? 'Yes' : 'No'}</td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    className="icon-btn edit"
                                    onClick={() => getComponentDetails(componentName)}
                                    title="Edit"
                                  >
                                    <FiEdit2 />
                                  </button>
                                  {!component.system && (
                                    <button 
                                      className="icon-btn delete"
                                      onClick={() => deleteComponent(componentName)}
                                      title="Delete"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  )}
                                  <button 
                                    className="icon-btn export"
                                    onClick={() => exportComponent(component)}
                                    title="Export"
                                  >
                                    <FiCopy />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {jsonExport && (
            <div className="json-export">
              <div className="export-header">
                <h3>JSON Export: {jsonExport.id}</h3>
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

export default ComponentManager;
