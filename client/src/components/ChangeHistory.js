// src/components/ChangeHistory.js
// This component displays the history of changes made during a session
import React from 'react';
import { FiDownload, FiTrash2 } from 'react-icons/fi';
import './ChangeHistory.css';

const ChangeHistory = ({ changes, onClear, onExport }) => {
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
          <div key={index} className="history-item">
            <div className="change-time">{change.timestamp}</div>
            <div className="change-details">
              <div className={`change-type ${change.action.toLowerCase()}`}>
                {change.action}
              </div>
              <div className="change-entity">
                {change.entityType}: <strong>{change.entityName}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeHistory;
