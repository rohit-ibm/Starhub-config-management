import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateUser from './CreateUser';
import DiscoveryManagement from './DiscoveryManagement';
import BackupManagement from './BackupManagement';
import ListDevice from './ListDevice';
import UserProfileAdministrator from './UserProfileAdministrator';
import CompareBackup from './CompareBackup';
import ViewFile from './ViewFile';
import CompareFiles from './CompareFiles';
import './App.css';                                 


function App() {

  const isAuthenticated = () => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  };

  const ProtectedRoute = ({ element }) => {
    return isAuthenticated() ? element : <Navigate to="/login" />;
  };

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
          <Route path="/view-file/:hostname/:filename" element={<ViewFile />} />
          <Route path="/compare-files/:hostname" element={<CompareFiles />} />
          <Route path="user-profile-administrator" element={<UserProfileAdministrator />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/" element={<Navigate to="/dashboard/discovery-management" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
