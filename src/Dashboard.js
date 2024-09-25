import React from 'react';
import { Link, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import DiscoveryManagement from './DiscoveryManagement';
import BackupManagement from './BackupManagement';
import ListDevice from './ListDevice';
import CompareBackup from './CompareBackup';
// import UserProfileAdministrator from './UserProfileAdministrator'; // Comment this import
import CreateUser from './CreateUser';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className='header'>
        <img src='https://9.46.67.25/assets/branding/images/logo.svg' alt='IBM'/>
        <h1>Configuration Management</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <nav>
        <ul>
          <li><Link to="discovery-management">Discovery Management</Link></li>
          <li><Link to="backup-management">Schedule Management</Link></li>
          <li><Link to="list-device">Backup Management</Link></li>
          {/* <li><Link to="user-profile-administrator">User Profile Administrator</Link></li> */}
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="discovery-management" element={<DiscoveryManagement />} />
          <Route path="backup-management" element={<BackupManagement />} />
          <Route path="list-device" element={<ListDevice />} />
          <Route path="list-device/compare-backup/:hostname" element={<CompareBackup />} />
          {/* <Route path="user-profile-administrator" element={<UserProfileAdministrator />} /> */}
          <Route path="create-user" element={<CreateUser />} />
          {/* Default route inside Dashboard */}
          <Route path="/" element={<Navigate to="discovery-management" />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
