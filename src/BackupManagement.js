import React from 'react';

const BackupManagement = () => {
  const handleImmediateBackup = () => {
    const token = localStorage.getItem('token');
    // Logic for immediate backup with token
    alert('Immediate backup initiated');
  };

  const handleScheduleBackup = () => {
    const token = localStorage.getItem('token');
    // Logic for scheduling a backup with token
    alert('Backup scheduled');
  };

  return (
    <div>
      <h2>Backup Management</h2>
      <button onClick={handleImmediateBackup}>Immediate Backup</button>
      <button onClick={handleScheduleBackup}>Schedule Backup</button>
    </div>
  );
};

export default BackupManagement;
