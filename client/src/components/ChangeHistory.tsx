// src/components/ChangeHistory.tsx
import React, { useState } from 'react';
import { FiDownload, FiTrash2, FiInfo } from 'react-icons/fi';
import './ChangeHistory.css';
import ChangeDetail from './ChangeDetail';
import { Change, ChangeHistoryProps } from '../types';

const ChangeHistory: React.FC<ChangeHistoryProps> = ({ changes, onClear, onExport }) => {
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);
  
  const handleChangeClick = (change: Change) => {
    setSelectedChange(change);
  };
  
  if (changes.length === 0) {
    return (
      <div className="change-history">
        <div className="history-header">
          <h3>Change History</h3>
          <div className="history-actions">
            <button className="btn btn-sm btn-outline" disabled>
              <FiDownload /> Export
            </button>
            <button className="btn btn-sm btn-outline" disabled>
              <FiTrash2 /> Clear
            </button>
          </div>
        </div>
        <div className="empty-history">
          <p>No changes recorded in this session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="change-history">
      <div className="history-header">
        <h3>Change History</h3>
        <div className="history-actions">
          <button className="btn btn-sm" onClick={onExport}>
            <FiDownload /> Export
          </button>
          <button className="btn btn-sm btn-outline" onClick={onClear}>
            <FiTrash2 /> Clear
          </button>
        </div>
      </div>
      <div className="history-list">
        {changes.map((change, index) => (
          <div 
            key={index} 
            className={`history-item ${change.entityData || change.previousData ? 'has-details' : ''}`}
            onClick={() => change.entityData || change.previousData ? handleChangeClick(change) : null}
          >
            <div className="change-time">{change.timestamp}</div>
            <div className="change-details">
              <div className={`change-type ${change.action.toLowerCase()}`}>
                {change.action}
              </div>
              <div className="change-entity">
                {change.entityType}: <strong>{change.entityName}</strong>
              </div>
              {(change.entityData || change.previousData) && (
                <div className="details-indicator">
                  <FiInfo size={14} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedChange && (
        <ChangeDetail 
          change={selectedChange} 
          onClose={() => setSelectedChange(null)} 
        />
      )}
    </div>
  );
};

export default ChangeHistory;
