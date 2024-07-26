import React from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import DiscoveryManagement from './DiscoveryManagement';
import BackupManagement from './BackupManagement';
import ListDevice from './ListDevice';
import CompareBackup from './CompareBackup';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Welcome to Config Management</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <nav>
        <ul>
          <li><Link to="discovery-management">Discovery Management</Link></li>
          <li><Link to="backup-management">Backup Management</Link></li>
          <li><Link to="list-device">View/Download & Compare Backup</Link></li>
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="discovery-management" element={<DiscoveryManagement />} />
          <Route path="backup-management" element={<BackupManagement />} />
          <Route path="list-device" element={<ListDevice />} />
          <Route path="list-device/compare-backup/:hostname" element={<CompareBackup />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
