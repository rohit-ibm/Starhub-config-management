import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import DiscoveryManagement from './DiscoveryManagement';
import BackupManagement from './BackupManagement';
import ViewCompareBackup from './ViewCompareBackup';
import DownloadBackup from './DownloadBackup';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header>
        <h1>Config Management</h1>
      </header>
      <nav>
        <ul>
          <li><Link to="discovery-management">Discovery Management</Link></li>
          <li><Link to="backup-management">Backup Management</Link></li>
          <li><Link to="view-compare-backup">View/Compare Backup</Link></li>
          <li><Link to="download-backup">Download Backup</Link></li>
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="discovery-management" element={<DiscoveryManagement />} />
          <Route path="backup-management" element={<BackupManagement />} />
          <Route path="view-compare-backup" element={<ViewCompareBackup />} />
          <Route path="download-backup" element={<DownloadBackup />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
