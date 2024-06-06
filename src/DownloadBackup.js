import React from 'react';

const DownloadBackup = () => {
  const handleDownload = () => {
    const token = localStorage.getItem('token');
    // Logic for downloading backup with token
    alert('Backup download initiated');
  };

  return (
    <div>
      <h2>Download Backup</h2>
      <button onClick={handleDownload}>Download Backup</button>
    </div>
  );
};

export default DownloadBackup;
