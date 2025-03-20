// src/components/ContentTypeEditor.js
import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiSave, FiX } from 'react-icons/fi';
import './ContentTypeEditor.css';

const ContentTypeEditor = ({ contentType, onSave, onCancel, mode }) => {
  // State for the content type being edited
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    properties: [],
    resourceVersion: null
  });
  
  // State for the current property being edited
  const [currentProperty, setCurrentProperty] = useState({
    name: '',
    displayName: '',
    type: 'String',
    multiple: false,
    required: false
  });
  
  // Flag to track if we're editing an existing property
  const [editingPropertyIndex, setEditingPropertyIndex] = useState(-1);
  
  // Load content type data if editing an existing one
  useEffect(() => {
    if (contentType) {
      // Transform the content type data to match our form structure
      const transformedData = {
        name: contentType.name || contentType.id || '',
        displayName: contentType.displayName || '',
        description: contentType.description || '',
        properties: contentType.properties || [],
        resourceVersion: contentType.resourceVersion || null
      };
      
      setFormData(transformedData);
    }
  }, [contentType]);
  
  // Handle changes to the content type form fields
  const handleContentTypeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle changes to the current property being edited
  const handlePropertyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentProperty(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Add a new property to the content type
  const addProperty = () => {
    // Validate property form
    if (!currentProperty.name || !currentProperty.type) {
      alert('Property name and type are required');
      return;
    }
    
    // Check if property name is unique
    if (formData.properties.some(p => p.name === currentProperty.name) && editingPropertyIndex === -1) {
      alert(`A property with name "${currentProperty.name}" already exists`);
      return;
    }
    
    if (editingPropertyIndex >= 0) {
      // Update existing property
      const updatedProperties = [...formData.properties];
      updatedProperties[editingPropertyIndex] = { ...currentProperty };
      
      setFormData(prev => ({
        ...prev,
        properties: updatedProperties
      }));
      
      setEditingPropertyIndex(-1);
    } else {
      // Add new property
      setFormData(prev => ({
        ...prev,
        properties: [...prev.properties, { ...currentProperty }]
      }));
    }
    
    // Reset property form
    setCurrentProperty({
      name: '',
      displayName: '',
      type: 'String',
      multiple: false,
      required: false
    });
  };
  
  // Edit an existing property
  const editProperty = (index) => {
    setCurrentProperty(formData.properties[index]);
    setEditingPropertyIndex(index);
  };
  
  // Delete a property
  const deleteProperty = (index) => {
    const updatedProperties = [...formData.properties];
    updatedProperties.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      properties: updatedProperties
    }));
  };
  
  // Move a property up in the list
  const movePropertyUp = (index) => {
    if (index === 0) return;
    
    const updatedProperties = [...formData.properties];
    const temp = updatedProperties[index];
    updatedProperties[index] = updatedProperties[index - 1];
    updatedProperties[index - 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      properties: updatedProperties
    }));
  };
  
  // Move a property down in the list
  const movePropertyDown = (index) => {
    if (index === formData.properties.length - 1) return;
    
    const updatedProperties = [...formData.properties];
    const temp = updatedProperties[index];
    updatedProperties[index] = updatedProperties[index + 1];
    updatedProperties[index + 1] = temp;
    
    setFormData(prev => ({
      ...prev,
      properties: updatedProperties
    }));
  };
  
  // Cancel editing the current property
  const cancelPropertyEdit = () => {
    setCurrentProperty({
      name: '',
      displayName: '',
      type: 'String',
      multiple: false,
      required: false
    });
    setEditingPropertyIndex(-1);
  };
  
  // Submit the form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name) {
      alert('Content type name is required');
      return;
    }
    
    // Format the data for API
    const apiData = {
      ...formData,
      id: formData.name,
      resourceVersion: formData.resourceVersion
    };
    
    onSave(apiData);
  };
  
  return (
    <div className="content-type-editor">
      <div className="editor-header">
        <h2>{contentType ? 'Edit Content Type' : 'Create Content Type'}</h2>
        <div className="editor-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>
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
          
          <div className="form-group">
            <label htmlFor="name">Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleContentTypeChange}
              disabled={!!contentType} // Can't change name when editing
              required
              placeholder="e.g. banner, product, article"
            />
            <small>Technical name (lowercase, no spaces)</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleContentTypeChange}
              placeholder="e.g. Banner, Product, Article"
            />
            <small>Human-readable name</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleContentTypeChange}
              placeholder="Describe the purpose of this content type"
              rows="3"
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Properties</h3>
          
          <div className="properties-list">
            {formData.properties.length === 0 ? (
              <div className="empty-properties">
                <p>No properties defined yet. Add some below.</p>
              </div>
            ) : (
              <table className="properties-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Display Name</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Multiple</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.properties.map((property, index) => (
                    <tr key={index}>
                      <td>{property.name}</td>
                      <td>{property.displayName || '-'}</td>
                      <td>{property.type}</td>
                      <td>{property.required ? 'Yes' : 'No'}</td>
                      <td>{property.multiple ? 'Yes' : 'No'}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            type="button"
                            className="icon-btn"
                            onClick={() => movePropertyUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            <FiArrowUp />
                          </button>
                          <button 
                            type="button"
                            className="icon-btn"
                            onClick={() => movePropertyDown(index)}
                            disabled={index === formData.properties.length - 1}
                            title="Move Down"
                          >
                            <FiArrowDown />
                          </button>
                          <button 
                            type="button"
                            className="icon-btn edit"
                            onClick={() => editProperty(index)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            type="button"
                            className="icon-btn delete"
                            onClick={() => deleteProperty(index)}
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
          
          <div className="property-form">
            <h4>{editingPropertyIndex >= 0 ? 'Edit Property' : 'Add Property'}</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="propertyName">Name*</label>
                <input
                  type="text"
                  id="propertyName"
                  name="name"
                  value={currentProperty.name}
                  onChange={handlePropertyChange}
                  placeholder="e.g. title, description, image"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="propertyDisplayName">Display Name</label>
                <input
                  type="text"
                  id="propertyDisplayName"
                  name="displayName"
                  value={currentProperty.displayName}
                  onChange={handlePropertyChange}
                  placeholder="e.g. Title, Description, Image"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="propertyType">Type*</label>
                <select
                  id="propertyType"
                  name="type"
                  value={currentProperty.type}
                  onChange={handlePropertyChange}
                >
                  <option value="String">String</option>
                  <option value="Text">Text</option>
                  <option value="Html">Rich Text (HTML)</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Long">Number (Integer)</option>
                  <option value="Double">Number (Decimal)</option>
                  <option value="Date">Date</option>
                  <option value="Link">Link</option>
                  <option value="Image">Image</option>
                  <option value="Reference">Reference</option>
                </select>
              </div>
              
              <div className="form-group checkbox-group">
                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      name="required"
                      checked={currentProperty.required}
                      onChange={handlePropertyChange}
                    />
                    Required
                  </label>
                </div>
                
                <div className="checkbox-row">
                  <label>
                    <input
                      type="checkbox"
                      name="multiple"
                      checked={currentProperty.multiple}
                      onChange={handlePropertyChange}
                    />
                    Multiple Values
                  </label>
                </div>
              </div>
            </div>
            
            <div className="property-actions">
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={addProperty}
              >
                {editingPropertyIndex >= 0 ? (
                  <>Update Property</>
                ) : (
                  <><FiPlus /> Add Property</>
                )}
              </button>
              
              {editingPropertyIndex >= 0 && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={cancelPropertyEdit}
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

export default ContentTypeEditor;
