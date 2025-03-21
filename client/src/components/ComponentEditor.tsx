// src/components/ComponentEditor.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import './ComponentEditor.css';
import { 
  Component, 
  ComponentEditorProps, 
  Parameter, 
  ParameterConfig, 
  FieldGroup 
} from '../types';

const ComponentEditor: React.FC<ComponentEditorProps> = ({ component, onSave, onCancel, groupName }) => {
  // State for the component being edited
  const [formData, setFormData] = useState<Component>({
    id: '',
    extends: 'base/component',
    hidden: false,
    system: false,
    xtype: '',
    ctype: '',
    contentType: '',
    label: '',
    icon: '',
    parameters: [],
    fieldGroups: [],
    resourceVersion: null
  });
  
  // State for the current parameter being edited
  const [currentParameter, setCurrentParameter] = useState<Parameter>({
    name: '',
    valueType: 'string',
    required: false,
    hidden: false,
    overlay: false,
    defaultValue: '',
    displayName: '',
    system: false,
    config: null
  });

  // State for the current field group being edited
  const [currentFieldGroup, setCurrentFieldGroup] = useState<FieldGroup>({
    name: '',
    displayName: '',
    parameters: []
  });
  
  // Flags to track editing states
  const [editingParameterIndex, setEditingParameterIndex] = useState<number>(-1);
  const [editingFieldGroupIndex, setEditingFieldGroupIndex] = useState<number>(-1);
  const [configType, setConfigType] = useState<string>('');

  // Available parameter types
  const parameterTypes = [
    { value: 'string', label: 'String' },
    { value: 'calendar', label: 'Date/Time' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'integer', label: 'Integer' },
    { value: 'number', label: 'Number' }
  ];
  
  // Load component data if editing an existing one
  useEffect(() => {
    if (component) {
      // Copy the component data to our form
      const componentData: Component = { ...component, resourceVersion: component.resourceVersion || null };
      setFormData(componentData);
    } else {
      // Set default values for a new component
      setFormData({
        id: `${groupName}/`,
        extends: 'base/component',
        hidden: false,
        system: false,
        xtype: '',
        ctype: '',
        contentType: '',
        label: '',
        icon: '',
        parameters: [],
        fieldGroups: [],
        resourceVersion: null
      });
    }
  }, [component, groupName]);
  
  // Handle changes to the component form fields
  const handleComponentChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle changes to the current parameter being edited
  const handleParameterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setCurrentParameter(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle changes to parameter config type
  const handleConfigTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setConfigType(value);
    
    // Initialize config object based on selected type
    let configObj: ParameterConfig | null = null;
    
    if (value === 'contentpath') {
      configObj = {
        type: 'contentpath',
        pickerConfiguration: '',
        pickerInitialPath: '',
        pickerRememberLastVisited: true,
        pickerSelectableNodeTypes: [],
        relative: true
      };
    } else if (value === 'dropdown') {
      configObj = {
        type: 'dropdown',
        sourceId: '',
        value: []
      };
    } else if (value === 'imagesetpath') {
      configObj = {
        type: 'imagesetpath',
        pickerConfiguration: '',
        pickerInitialPath: '',
        pickerRememberLastVisited: true,
        pickerSelectableNodeTypes: [],
        previewVariant: '',
        enableUpload: true
      };
    }
    
    setCurrentParameter(prev => ({
      ...prev,
      config: configObj
    }));
  };

  // Handle changes to parameter config properties
  const handleConfigChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (!currentParameter.config) return;
    
    setCurrentParameter(prev => ({
      ...prev,
      config: prev.config ? {
        ...prev.config,
        [name]: type === 'checkbox' ? checked : value
      } : null
    }));
  };

  // Handle changes to dropdown values (comma-separated list)
  const handleDropdownValuesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(',').map(val => val.trim());
    
    if (!currentParameter.config) return;
    
    setCurrentParameter(prev => ({
      ...prev,
      config: prev.config ? {
        ...prev.config,
        value: values
      } : null
    }));
  };

  // Handle changes to selectable node types (comma-separated list)
  const handleNodeTypesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nodeTypes = e.target.value.split(',').map(type => type.trim());
    
    if (!currentParameter.config) return;
    
    setCurrentParameter(prev => ({
      ...prev,
      config: prev.config ? {
        ...prev.config,
        pickerSelectableNodeTypes: nodeTypes
      } : null
    }));
  };
  
  // Add or update a parameter
  const addParameter = () => {
    // Validate parameter form
    if (!currentParameter.name) {
      alert('Parameter name is required');
      return;
    }
    
    // Check if parameter name is unique
    if (formData.parameters.some(p => p.name === currentParameter.name) && editingParameterIndex === -1) {
      alert(`A parameter with name "${currentParameter.name}" already exists`);
      return;
    }
    
    if (editingParameterIndex >= 0) {
      // Update existing parameter
      const updatedParameters = [...formData.parameters];
      updatedParameters[editingParameterIndex] = { ...currentParameter };
      
      setFormData(prev => ({
        ...prev,
        parameters: updatedParameters
      }));
      
      setEditingParameterIndex(-1);
    } else {
      // Add new parameter
      setFormData(prev => ({
        ...prev,
        parameters: [...prev.parameters, { ...currentParameter }]
      }));
    }
    
    // Reset parameter form
    setCurrentParameter({
      name: '',
      valueType: 'string',
      required: false,
      hidden: false,
      overlay: false,
      defaultValue: '',
      displayName: '',
      system: false,
      config: null
    });
    setConfigType('');
  };
  
  // Edit an existing parameter
  const editParameter = (index: number) => {
    const parameter = formData.parameters[index];
    setCurrentParameter({ ...parameter });
    
    // Set config type if config exists
    if (parameter.config) {
      setConfigType(parameter.config.type || '');
    } else {
      setConfigType('');
    }
    
    setEditingParameterIndex(index);
  };
  
  // Delete a parameter
  const deleteParameter = (index: number) => {
    const updatedParameters = [...formData.parameters];
    updatedParameters.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      parameters: updatedParameters
    }));
  };
  
  // Cancel editing the current parameter
  const cancelParameterEdit = () => {
    setCurrentParameter({
      name: '',
      valueType: 'string',
      required: false,
      hidden: false,
      overlay: false,
      defaultValue: '',
      displayName: '',
      system: false,
      config: null
    });
    setConfigType('');
    setEditingParameterIndex(-1);
  };

  // Handle changes to the current field group being edited
  const handleFieldGroupChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentFieldGroup(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle changes to field group parameters checkboxes
  const handleFieldGroupParameterToggle = (paramName: string) => {
    setCurrentFieldGroup(prev => {
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
      alert('Field group name is required');
      return;
    }

    // Check if field group name is unique
    if (formData.fieldGroups.some(g => g.name === currentFieldGroup.name) && editingFieldGroupIndex === -1) {
      alert(`A field group with name "${currentFieldGroup.name}" already exists`);
      return;
    }

    if (editingFieldGroupIndex >= 0) {
      // Update existing field group
      const updatedFieldGroups = [...formData.fieldGroups];
      updatedFieldGroups[editingFieldGroupIndex] = { ...currentFieldGroup };
      
      setFormData(prev => ({
        ...prev,
        fieldGroups: updatedFieldGroups
      }));
      
      setEditingFieldGroupIndex(-1);
    } else {
      // Add new field group
      setFormData(prev => ({
        ...prev,
        fieldGroups: [...prev.fieldGroups, { ...currentFieldGroup }]
      }));
    }
    
    // Reset field group form
    setCurrentFieldGroup({
      name: '',
      displayName: '',
      parameters: []
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
    
    setFormData(prev => ({
      ...prev,
      fieldGroups: updatedFieldGroups
    }));
  };

  // Cancel editing the current field group
  const cancelFieldGroupEdit = () => {
    setCurrentFieldGroup({
      name: '',
      displayName: '',
      parameters: []
    });
    setEditingFieldGroupIndex(-1);
  };
  
  // Submit the form
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.id.includes('/')) {
      alert('Component ID must be in format "group/name"');
      return;
    }
    
    onSave(formData);
  };

  // Extract component name from ID for new components
  const handleComponentNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      id: `${groupName}/${name}`
    }));
  };
  
  return (
    <div className="component-editor">
      <div className="editor-header">
        <h2>{component ? 'Edit Component' : 'Create Component'}</h2>
        <div className="editor-actions">
          <button className="btn btn-primary" onClick={() => handleSubmit({ preventDefault: () => {} } as any)}>
            <FiSave /> Save
          </button>
          <button className="btn btn-outline" onClick={onCancel}>
            <FiX /> Cancel
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          {component ? (
            <div className="form-group">
              <label htmlFor="id">ID</label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleComponentChange}
                disabled={true}
              />
              <small>Format: group/name</small>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="componentName">Component Name*</label>
              <input
                type="text"
                id="componentName"
                name="componentName"
                onChange={handleComponentNameChange}
                placeholder="e.g. banner, video, carousel"
                required
              />
              <small>This will be part of the component ID: {groupName}/<em>name</em></small>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="extends">Extends</label>
            <input
              type="text"
              id="extends"
              name="extends"
              value={formData.extends}
              onChange={handleComponentChange}
              placeholder="e.g. base/component"
            />
            <small>Component definition this extends from</small>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="label">Label</label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleComponentChange}
                placeholder="e.g. Banner, Video"
              />
              <small>Display name in the UI</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="ctype">Component Type</label>
              <input
                type="text"
                id="ctype"
                name="ctype"
                value={formData.ctype}
                onChange={handleComponentChange}
                placeholder="e.g. Banner, Video"
              />
              <small>Frontend component type</small>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="xtype">XType</label>
              <input
                type="text"
                id="xtype"
                name="xtype"
                value={formData.xtype || ''}
                onChange={handleComponentChange}
                placeholder="e.g. hst.span"
              />
              <small>Frontend layout type</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="contentType">Content Type</label>
              <input
                type="text"
                id="contentType"
                name="contentType"
                value={formData.contentType || ''}
                onChange={handleComponentChange}
                placeholder="e.g. brxsaas:banner"
              />
              <small>Content type for component content</small>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="icon">Icon (Base64)</label>
            <textarea
              id="icon"
              name="icon"
              value={formData.icon || ''}
              onChange={handleComponentChange}
              placeholder="data:image/svg+xml;base64,..."
              rows={2}
            />
            <small>Base64 encoded icon for this component</small>
          </div>
          
          <div className="form-row checkbox-container">
            <div className="form-group checkbox-group">
              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    name="hidden"
                    checked={formData.hidden}
                    onChange={handleComponentChange}
                  />
                  Hidden
                </label>
                <small>Hide this component in the UI</small>
              </div>
            </div>
            
            <div className="form-group checkbox-group">
              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    name="system"
                    checked={formData.system}
                    onChange={handleComponentChange}
                  />
                  System
                </label>
                <small>Mark as protected system component</small>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Parameters</h3>
          
          <div className="parameters-list">
            {formData.parameters.length === 0 ? (
              <div className="empty-parameters">
                <p>No parameters defined yet. Add some below.</p>
              </div>
            ) : (
              <table className="parameters-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Display Name</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Config Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.parameters.map((parameter, index) => (
                    <tr key={index}>
                      <td>{parameter.name}</td>
                      <td>{parameter.displayName || '-'}</td>
                      <td>{parameter.valueType}</td>
                      <td>{parameter.required ? 'Yes' : 'No'}</td>
                      <td>{parameter.config?.type || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            type="button"
                            className="icon-btn edit"
                            onClick={() => editParameter(index)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            type="button"
                            className="icon-btn delete"
                            onClick={() => deleteParameter(index)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="parameter-form">
            <h4>{editingParameterIndex >= 0 ? 'Edit Parameter' : 'Add Parameter'}</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parameterName">Name*</label>
                <input
                  type="text"
                  id="parameterName"
                  name="name"
                  value={currentParameter.name}
                  onChange={handleParameterChange}
                  placeholder="e.g. url, document, title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="parameterDisplayName">Display Name</label>
                <input
                  type="text"
                  id="parameterDisplayName"
                  name="displayName"
                  value={currentParameter.displayName || ''}
                  onChange={handleParameterChange}
                  placeholder="e.g. URL, Document, Title"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parameterType">Type*</label>
                <select
                  id="parameterType"
                  name="valueType"
                  value={currentParameter.valueType}
                  onChange={handleParameterChange}
                >
                  {parameterTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="parameterDefaultValue">Default Value</label>
                <input
                  type="text"
                  id="parameterDefaultValue"
                  name="defaultValue"
                  value={currentParameter.defaultValue || ''}
                  onChange={handleParameterChange}
                  placeholder="Default value"
                />
              </div>
            </div>
            
            <div className="form-row checkbox-container">
              <div className="form-group checkbox-group">
                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      name="required"
                      checked={currentParameter.required}
                      onChange={handleParameterChange}
                    />
                    Required
                  </label>
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      name="hidden"
                      checked={currentParameter.hidden}
                      onChange={handleParameterChange}
                    />
                    Hidden
                  </label>
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      name="overlay"
                      checked={currentParameter.overlay}
                      onChange={handleParameterChange}
                    />
                    Overlay
                  </label>
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      name="system"
                      checked={currentParameter.system}
                      onChange={handleParameterChange}
                    />
                    System
                  </label>
                </div>
              </div>
            </div>
            
            <div className="config-section">
              <div className="form-group">
                <label htmlFor="configType">Config Type</label>
                <select
                  id="configType"
                  name="configType"
                  value={configType}
                  onChange={handleConfigTypeChange}
                >
                  <option value="">None</option>
                  <option value="contentpath">Content Path</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="imagesetpath">Image Set Path</option>
                </select>
              </div>
              
              {configType === 'contentpath' && currentParameter.config && (
                <div className="config-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pickerConfiguration">Picker Configuration</label>
                      <input
                        type="text"
                        id="pickerConfiguration"
                        name="pickerConfiguration"
                        value={currentParameter.config.pickerConfiguration || ''}
                        onChange={handleConfigChange}
                        placeholder="e.g. cms-pickers/documents-only"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="pickerInitialPath">Initial Path</label>
                      <input
                        type="text"
                        id="pickerInitialPath"
                        name="pickerInitialPath"
                        value={currentParameter.config.pickerInitialPath || ''}
                        onChange={handleConfigChange}
                        placeholder="e.g. banners"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pickerSelectableNodeTypes">Selectable Node Types</label>
                      <input
                        type="text"
                        id="pickerSelectableNodeTypes"
                        name="pickerSelectableNodeTypes"
                        value={currentParameter.config.pickerSelectableNodeTypes?.join(', ') || ''}
                        onChange={handleNodeTypesChange}
                        placeholder="e.g. banner, image, document"
                      />
                      <small>Comma-separated list of node types</small>
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <div className="checkbox-row">
                        <label>
                          <input
                            type="checkbox"
                            name="pickerRememberLastVisited"
                            checked={currentParameter.config.pickerRememberLastVisited || false}
                            onChange={handleConfigChange}
                          />
                          Remember Last Visited
                        </label>
                      </div>
                      
                      <div className="checkbox-row">
                        <label>
                          <input
                            type="checkbox"
                            name="relative"
                            checked={currentParameter.config.relative || false}
                            onChange={handleConfigChange}
                          />
                          Relative Path
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {configType === 'dropdown' && currentParameter.config && (
                <div className="config-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="sourceId">Source ID</label>
                      <input
                        type="text"
                        id="sourceId"
                        name="sourceId"
                        value={currentParameter.config.sourceId || ''}
                        onChange={handleConfigChange}
                        placeholder="Source ID for the dropdown"
                        required={configType === 'dropdown'}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="dropdownValues">Values</label>
                      <input
                        type="text"
                        id="dropdownValues"
                        name="dropdownValues"
                        value={currentParameter.config.value?.join(', ') || ''}
                        onChange={handleDropdownValuesChange}
                        placeholder="e.g. value1, value2, value3"
                      />
                      <small>Comma-separated list of values</small>
                    </div>
                  </div>
                </div>
              )}
              
              {configType === 'imagesetpath' && currentParameter.config && (
                <div className="config-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="pickerConfiguration">Picker Configuration</label>
                      <input
                        type="text"
                        id="pickerConfiguration"
                        name="pickerConfiguration"
                        value={currentParameter.config.pickerConfiguration || ''}
                        onChange={handleConfigChange}
                        placeholder="e.g. cms-pickers/images"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="pickerInitialPath">Initial Path</label>
                      <input
                        type="text"
                        id="pickerInitialPath"
                        name="pickerInitialPath"
                        value={currentParameter.config.pickerInitialPath || ''}
                        onChange={handleConfigChange}
                        placeholder="e.g. gallery"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="previewVariant">Preview Variant</label>
                      <input
                        type="text"
                        id="previewVariant"
                        name="previewVariant"
                        value={currentParameter.config.previewVariant || ''}
                        onChange={handleConfigChange}
                        placeholder="e.g. thumbnail"
                      />
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <div className="checkbox-row">
                        <label>
                          <input
                            type="checkbox"
                            name="pickerRememberLastVisited"
                            checked={currentParameter.config.pickerRememberLastVisited || false}
                            onChange={handleConfigChange}
                          />
                          Remember Last Visited
                        </label>
                      </div>
                      
                      <div className="checkbox-row">
                        <label>
                          <input
                            type="checkbox"
                            name="enableUpload"
                            checked={currentParameter.config.enableUpload || false}
                            onChange={handleConfigChange}
                          />
                          Enable Upload
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="parameter-actions">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={addParameter}
              >
                {editingParameterIndex >= 0 ? (
                  <>Update Parameter</>
                ) : (
                  <><FiPlus /> Add Parameter</>
                )}
              </button>
              
              {editingParameterIndex >= 0 && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={cancelParameterEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Field Groups</h3>
          
          <div className="field-groups-list">
            {formData.fieldGroups.length === 0 ? (
              <div className="empty-field-groups">
                <p>No field groups defined yet. Add some below.</p>
              </div>
            ) : (
              <table className="field-groups-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Display Name</th>
                    <th>Parameters</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.fieldGroups.map((group, index) => (
                    <tr key={index}>
                      <td>{group.name}</td>
                      <td>{group.displayName || '-'}</td>
                      <td className="parameters-cell">
                        {group.parameters.length > 0 ? 
                          group.parameters.join(', ') : 
                          '-'
                        }
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            type="button"
                            className="icon-btn edit"
                            onClick={() => editFieldGroup(index)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            type="button"
                            className="icon-btn delete"
                            onClick={() => deleteFieldGroup(index)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="field-group-form">
            <h4>{editingFieldGroupIndex >= 0 ? 'Edit Field Group' : 'Add Field Group'}</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fieldGroupName">Name*</label>
                <input
                  type="text"
                  id="fieldGroupName"
                  name="name"
                  value={currentFieldGroup.name}
                  onChange={handleFieldGroupChange}
                  placeholder="e.g. basic-settings, advanced"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fieldGroupDisplayName">Display Name</label>
                <input
                  type="text"
                  id="fieldGroupDisplayName"
                  name="displayName"
                  value={currentFieldGroup.displayName || ''}
                  onChange={handleFieldGroupChange}
                  placeholder="e.g. Basic Settings, Advanced"
                />
              </div>
            </div>
            
            <div className="field-group-parameters">
              <label>Parameters</label>
              
              {formData.parameters.length === 0 ? (
                <p className="no-parameters">
                  No parameters available. Add parameters first.
                </p>
              ) : (
                <div className="checkbox-grid">
                  {formData.parameters.map((param, index) => (
                    <label key={index} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={currentFieldGroup.parameters.includes(param.name)}
                        onChange={() => handleFieldGroupParameterToggle(param.name)}
                      />
                      {param.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="field-group-actions">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={addFieldGroup}
                disabled={formData.parameters.length === 0}
              >
                {editingFieldGroupIndex >= 0 ? (
                  <>Update Field Group</>
                ) : (
                  <><FiPlus /> Add Field Group</>
                )}
              </button>
              
              {editingFieldGroupIndex >= 0 && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={cancelFieldGroupEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ComponentEditor;
