// src/components/ChangeDetail.tsx
import React from 'react';
import { FiX } from 'react-icons/fi';
import './ChangeDetail.css';
import { ChangeDetailProps } from '../types';

const ChangeDetail: React.FC<ChangeDetailProps> = ({ change, onClose }) => {
  if (!change) return null;
  
  type ObjectType = Record<string, any>;

  const renderDiff = (prevData: ObjectType | null, newData: ObjectType | null) => {
    // Helper function to identify changes between objects
    if (!prevData || !newData) return null;
    
    const allKeys = [...new Set([...Object.keys(prevData), ...Object.keys(newData)])];
    
    return (
      <div className="diff-container">
        <table className="diff-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Previous Value</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map(key => {
              const prevValue = prevData[key];
              const newValue = newData[key];
              const hasChanged = JSON.stringify(prevValue) !== JSON.stringify(newValue);
              
              // Skip arrays and objects for simple display (could be enhanced for specific properties)
              if (Array.isArray(prevValue) || Array.isArray(newValue) || 
                  (typeof prevValue === 'object' && prevValue !== null) || 
                  (typeof newValue === 'object' && newValue !== null)) {
                return (
                  <tr key={key} className={hasChanged ? 'changed' : ''}>
                    <td className="field-name">{key}</td>
                    <td className="prev-value">
                      {prevValue ? `[Complex data - ${Array.isArray(prevValue) ? prevValue.length + ' items' : 'Object'}]` : '-'}
                    </td>
                    <td className="new-value">
                      {newValue ? `[Complex data - ${Array.isArray(newValue) ? newValue.length + ' items' : 'Object'}]` : '-'}
                    </td>
                  </tr>
                );
              }
              
              return (
                <tr key={key} className={hasChanged ? 'changed' : ''}>
                  <td className="field-name">{key}</td>
                  <td className="prev-value">{prevValue !== undefined ? String(prevValue) : '-'}</td>
                  <td className="new-value">{newValue !== undefined ? String(newValue) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  interface PropertyType {
    name: string;
    type?: string;
    valueType?: string;
    displayName?: string;
  }

  const renderPropertyChanges = (prevProperties: PropertyType[] | null | undefined, newProperties: PropertyType[] | null | undefined) => {
    if (!prevProperties || !newProperties) return null;
    
    // Identify added, modified, and removed properties
    const prevNames = new Set(prevProperties.map(p => p.name));
    const newNames = new Set(newProperties.map(p => p.name));
    
    const added = newProperties.filter(p => !prevNames.has(p.name));
    const removed = prevProperties.filter(p => !newNames.has(p.name));
    
    // Find modified properties
    const modified = newProperties.filter(p => {
      const prevProp = prevProperties.find(prev => prev.name === p.name);
      return prevProp && JSON.stringify(prevProp) !== JSON.stringify(p);
    });
    
    return (
      <div className="properties-changes">
        {added.length > 0 && (
          <div className="property-section added">
            <h4>Added Properties ({added.length})</h4>
            <ul>
              {added.map(prop => (
                <li key={prop.name}>
                  <strong>{prop.name}</strong> ({prop.type || prop.valueType})
                  {prop.displayName && <span className="display-name"> - {prop.displayName}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {modified.length > 0 && (
          <div className="property-section modified">
            <h4>Modified Properties ({modified.length})</h4>
            <ul>
              {modified.map(prop => {
                const prevProp = prevProperties.find(p => p.name === prop.name);
                if (!prevProp) return null;
                
                return (
                  <li key={prop.name}>
                    <strong>{prop.name}</strong>
                    <div className="property-diff">
                      {Object.keys(prop).filter(key => key !== 'name' && JSON.stringify(prop[key as keyof PropertyType]) !== JSON.stringify(prevProp[key as keyof PropertyType])).map(key => (
                        <div key={key} className="diff-item">
                          <span className="diff-key">{key}</span>: 
                          <span className="diff-old">{JSON.stringify(prevProp[key as keyof PropertyType])}</span> → 
                          <span className="diff-new">{JSON.stringify(prop[key as keyof PropertyType])}</span>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {removed.length > 0 && (
          <div className="property-section removed">
            <h4>Removed Properties ({removed.length})</h4>
            <ul>
              {removed.map(prop => (
                <li key={prop.name}>
                  <strong>{prop.name}</strong> ({prop.type || prop.valueType})
                  {prop.displayName && <span className="display-name"> - {prop.displayName}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="change-detail-overlay">
      <div className="change-detail">
        <div className="detail-header">
          <h3>
            <span className={`detail-type ${change.action.toLowerCase()}`}>{change.action}</span>
            {' '}{change.entityType}: <strong>{change.entityName}</strong>
          </h3>
          <span className="detail-time">{change.timestamp}</span>
          <button className="btn-close" onClick={onClose}>
            <FiX />
          </button>
        </div>
        
        <div className="detail-content">
          {change.action === 'CREATE' && (
            <>
              <h4>Created Entity Details</h4>
              {change.entityData && (
                <div className="data-display">
                  <pre>{JSON.stringify(change.entityData, null, 2)}</pre>
                </div>
              )}
            </>
          )}
          
          {change.action === 'UPDATE' && (
            <>
              <h4>Updated Entity Details</h4>
              {change.entityData && change.previousData && (
                <>
                  {change.entityType === 'Content Type' && change.previousData.properties && change.entityData.properties && (
                    <>
                      <h5>Property Changes</h5>
                      {renderPropertyChanges(change.previousData.properties, change.entityData.properties)}
                    </>
                  )}
                  
                  {change.entityType === 'Component' && change.previousData.parameters && change.entityData.parameters && (
                    <>
                      <h5>Parameter Changes</h5>
                      {renderPropertyChanges(change.previousData.parameters, change.entityData.parameters)}
                      
                      {change.previousData.fieldGroups && change.entityData.fieldGroups && (
                        <>
                          <h5>Field Group Changes</h5>
                          {renderPropertyChanges(change.previousData.fieldGroups, change.entityData.fieldGroups)}
                        </>
                      )}
                    </>
                  )}
                  
                  <h5>All Changes</h5>
                  {renderDiff(change.previousData, change.entityData)}
                </>
              )}
            </>
          )}
          
          {change.action === 'DELETE' && (
            <>
              <h4>Deleted Entity Details</h4>
              {change.previousData && (
                <div className="data-display">
                  <pre>{JSON.stringify(change.previousData, null, 2)}</pre>
                </div>
              )}
            </>
          )}
          
          {!change.entityData && !change.previousData && (
            <div className="no-details">
              <p>No detailed information available for this operation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeDetail;
