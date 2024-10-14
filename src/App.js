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
          <Route path="/dashboard/*" element={<ProtectedRoute element={<Dashboard />}/>}/>
          <Route path="/discovery-management" element={<ProtectedRoute element={<DiscoveryManagement />}/>}/>
          <Route path="/backup-management" element={<ProtectedRoute element={<BackupManagement />}/>}/>
          <Route path="/list-device" element={<ProtectedRoute element={<ListDevice />}/>}/>
          <Route path="/list-device/compare-backup/:hostname"element={<ProtectedRoute element={<CompareBackup />}/>}/>
          <Route path="user-profile-administrator" element={<ProtectedRoute element={<UserProfileAdministrator />}/>}/>
          <Route path="/create-user" element={<ProtectedRoute element={<CreateUser />}/>}/>
          <Route path="/" element={<Navigate to="/dashboard/discovery-management" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
