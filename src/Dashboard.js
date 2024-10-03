import React, { useState } from 'react';
import { Link, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import DiscoveryManagement from './DiscoveryManagement';
import BackupManagement from './BackupManagement';
import ListDevice from './ListDevice';
import CompareBackup from './CompareBackup';
import UserProfileAdministrator from './UserProfileAdministrator'; // Comment this import
import CreateUser from './CreateUser';
import './Dashboard.css';
import { Search, Schedule, Backup, Security } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Typography, Container } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';


const DashboardCard = ({ title, description, icon, link }) => (
  <Card className="dashboard-card">
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <CardActionArea>
        <div className="card-icon-container">
          {icon}
        </div>
        <CardContent className="card-content">
          <div className="card-title">
            <Typography variant="h5">{title}</Typography>
          </div>
          <div className="card-description">
            <Typography variant="body2">{description}</Typography>
          </div>
        </CardContent>
      </CardActionArea>
    </Link>
  </Card>
);


const Dashboard = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // toggle dropdown visibility
  };

  return (
    <div className="dashboard">
      <header className='header'>
        <img src='https://9.46.67.25/assets/branding/images/logo.svg' alt='IBM' />
        <h1>Configuration Management</h1>
        <div className="settings-container">
          <button className="settings-button" onClick={toggleDropdown}>
            <SettingsIcon size={34} />
          </button>

          {isDropdownOpen && (
            <div className="dropdown">
              <ul>
                <li>Discovery Management</li>
                <li>Schedule Management</li>
                <li>Backup Management</li>
                <li>User Profile Administrator</li>
              </ul>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      <main>
      <Container maxWidth="lg" disableGutters>
          <div className="dashboard-cards-container">
            <DashboardCard
              title="Discovery Management"
              description="Create, debug, and run workflows with Workflow Editor"
              icon={<Search fontSize="large" />}
              link="discovery-management"
            />
            <DashboardCard
              title="Schedule Management"
              description="Organize and monitor executions"
              icon={<Schedule fontSize="large" />}
              link="backup-management"
            />
            <DashboardCard
              title="Backup Management"
              description="Schedule and manage jobs"
              icon={<Backup fontSize="large" />}
              link="list-device"
            />
            <DashboardCard
              title="User Profile Administrator"
              description="Create and manage authentications"
              icon={<Security fontSize="large" />}
              link="create-user"
            />
          </div>
        </Container>
        <Routes>
          <Route path="discovery-management" element={<DiscoveryManagement />} />
          <Route path="backup-management" element={<BackupManagement />} />
          <Route path="list-device" element={<ListDevice />} />
          <Route path="list-device/compare-backup/:hostname" element={<CompareBackup />} />
          {/* <Route path="user-profile-administrator" element={<UserProfileAdministrator />} /> */}
          <Route path="create-user" element={<UserProfileAdministrator />} />
          {/* Default route inside Dashboard */}
          <Route path="/" element={<Navigate to="discovery-management" />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
