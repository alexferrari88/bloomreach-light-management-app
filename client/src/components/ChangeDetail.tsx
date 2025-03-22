import { ChangeDetailProps } from '../types';

const ChangeDetail: React.FC<ChangeDetailProps> = ({ change }) => {
  if (!change) return null;
  
  type ObjectType = Record<string, any>;

  const renderDiff = (prevData: ObjectType | null, newData: ObjectType | null) => {
    // Helper function to identify changes between objects
    if (!prevData || !newData) return null;
    
    const allKeys = [...new Set([...Object.keys(prevData), ...Object.keys(newData)])];
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 bg-muted border-b-2 border-border">Field</th>
              <th className="text-left p-2 bg-muted border-b-2 border-border">Previous Value</th>
              <th className="text-left p-2 bg-muted border-b-2 border-border">New Value</th>
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
                  <tr key={key} className={hasChanged ? 'bg-amber-50' : ''}>
                    <td className="p-2 border-b border-border font-medium w-1/5">{key}</td>
                    <td className="p-2 border-b border-border text-red-700 line-through opacity-80 w-2/5">
                      {prevValue ? `[Complex data - ${Array.isArray(prevValue) ? prevValue.length + ' items' : 'Object'}]` : '-'}
                    </td>
                    <td className="p-2 border-b border-border text-green-700 w-2/5">
                      {newValue ? `[Complex data - ${Array.isArray(newValue) ? newValue.length + ' items' : 'Object'}]` : '-'}
                    </td>
                  </tr>
                );
              }
              
              return (
                <tr key={key} className={hasChanged ? 'bg-amber-50' : ''}>
                  <td className="p-2 border-b border-border font-medium w-1/5">{key}</td>
                  <td className="p-2 border-b border-border text-red-700 line-through opacity-80 w-2/5">
                    {prevValue !== undefined ? String(prevValue) : '-'}
                  </td>
                  <td className="p-2 border-b border-border text-green-700 w-2/5">
                    {newValue !== undefined ? String(newValue) : '-'}
                  </td>
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
      <div className="space-y-4">
        {added.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-700 flex items-center">
              Added Properties ({added.length})
            </h4>
            <ul className="space-y-1">
              {added.map(prop => (
                <li key={prop.name} className="p-2 rounded bg-green-50 text-sm">
                  <strong>{prop.name}</strong> ({prop.type || prop.valueType})
                  {prop.displayName && <span className="italic ml-1"> - {prop.displayName}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {modified.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-700 flex items-center">
              Modified Properties ({modified.length})
            </h4>
            <ul className="space-y-1">
              {modified.map(prop => {
                const prevProp = prevProperties.find(p => p.name === p.name);
                if (!prevProp) return null;
                
                return (
                  <li key={prop.name} className="p-2 rounded bg-blue-50 text-sm">
                    <strong>{prop.name}</strong>
                    <div className="mt-1 pl-4 text-xs space-y-1">
                      {Object.keys(prop).filter(key => key !== 'name' && JSON.stringify(prop[key as keyof PropertyType]) !== JSON.stringify(prevProp[key as keyof PropertyType])).map(key => (
                        <div key={key} className="flex flex-wrap items-center gap-1">
                          <span className="font-medium">{key}:</span>
                          <span className="text-red-700 line-through opacity-80">{JSON.stringify(prevProp[key as keyof PropertyType])}</span>
                          <span className="text-green-700">{JSON.stringify(prop[key as keyof PropertyType])}</span>
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
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-700 flex items-center">
              Removed Properties ({removed.length})
            </h4>
            <ul className="space-y-1">
              {removed.map(prop => (
                <li key={prop.name} className="p-2 rounded bg-red-50 text-sm">
                  <strong>{prop.name}</strong> ({prop.type || prop.valueType})
                  {prop.displayName && <span className="italic ml-1"> - {prop.displayName}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {change.action === 'CREATE' && (
        <>
          <h4 className="text-base font-medium text-primary">Created Entity Details</h4>
          {change.entityData && (
            <div className="p-4 bg-muted rounded overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(change.entityData, null, 2)}</pre>
            </div>
          )}
        </>
      )}
      
      {change.action === 'UPDATE' && (
        <>
          <h4 className="text-base font-medium text-primary">Updated Entity Details</h4>
          {change.entityData && change.previousData && (
            <>
              {change.entityType === 'Content Type' && change.previousData.properties && change.entityData.properties && (
                <>
                  <h5 className="text-sm font-medium text-muted-foreground mt-4">Property Changes</h5>
                  {renderPropertyChanges(change.previousData.properties, change.entityData.properties)}
                </>
              )}
              
              {change.entityType === 'Component' && change.previousData.parameters && change.entityData.parameters && (
                <>
                  <h5 className="text-sm font-medium text-muted-foreground mt-4">Parameter Changes</h5>
                  {renderPropertyChanges(change.previousData.parameters, change.entityData.parameters)}
                  
                  {change.previousData.fieldGroups && change.entityData.fieldGroups && (
                    <>
                      <h5 className="text-sm font-medium text-muted-foreground mt-4">Field Group Changes</h5>
                      {renderPropertyChanges(change.previousData.fieldGroups, change.entityData.fieldGroups)}
                    </>
                  )}
                </>
              )}
              
              <h5 className="text-sm font-medium text-muted-foreground mt-4">All Changes</h5>
              {renderDiff(change.previousData, change.entityData)}
            </>
          )}
        </>
      )}
      
      {change.action === 'DELETE' && (
        <>
          <h4 className="text-base font-medium text-primary">Deleted Entity Details</h4>
          {change.previousData && (
            <div className="p-4 bg-muted rounded overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(change.previousData, null, 2)}</pre>
            </div>
          )}
        </>
      )}
      
      {!change.entityData && !change.previousData && (
        <div className="py-8 text-center text-muted-foreground italic">
          <p>No detailed information available for this operation.</p>
        </div>
      )}
    </div>
  );
};

export default ChangeDetail;
