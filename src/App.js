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
import NavBar from './components/navbar/NavBar';



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
          <Route path="/dashboard/*" element={<ProtectedRoute element={<><NavBar/><Dashboard /></>}/>}/>
          <Route path="/discovery-management" element={<ProtectedRoute element={<><NavBar/><DiscoveryManagement /></>}/>}/>
          <Route path="/backup-management" element={<ProtectedRoute element={<><NavBar/><BackupManagement /></>}/>}/>
          <Route path="/list-device" element={<ProtectedRoute element={<><NavBar/><ListDevice /></>}/>}/>
          <Route path="/list-device/compare-backup/:hostname"element={<ProtectedRoute element={<><NavBar/><CompareBackup /></>}/>}/>
          <Route path="/view-file/:hostname/:filename" element={<ProtectedRoute element={<><NavBar/><ViewFile /></>}/>} />
          <Route path="/compare-files/:hostname" element={<ProtectedRoute element={<><NavBar/><CompareFiles /></>}/>}/>
          <Route path="user-profile-administrator" element={<ProtectedRoute element={<><NavBar/><UserProfileAdministrator /></>}/>}/>
          <Route path="/create-user" element={<ProtectedRoute element={<><NavBar/><CreateUser /></>}/>}/>
          <Route path="/" element={<Navigate to="/dashboard/discovery-management" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
