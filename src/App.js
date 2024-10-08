import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate,Switch } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateUser from './CreateUser';
import DiscoveryManagement from './DiscoveryManagement';
import BackupManagement from './BackupManagement';
import ListDevice from './ListDevice';
import UserProfileAdministrator from './UserProfileAdministrator';
import CompareBackup from './CompareBackup';
import './App.css';



function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/discovery-management" element={<DiscoveryManagement />} />
          <Route path="/backup-management" element={<BackupManagement />} />
          <Route path="/list-device" element={<ListDevice />} />
          <Route path="/list-device/compare-backup/:hostname" element={<CompareBackup />} />
          <Route path="user-profile-administrator" element={<UserProfileAdministrator />} />
          <Route path="/create-user" element={<CreateUser />} />
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard/discovery-management" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
