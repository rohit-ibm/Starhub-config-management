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
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import TaskIcon from '@mui/icons-material/Task';
import imageURL from '../src/Assets/IBM_LOGO.svg';


const DashboardCard = ({ title, description, icon, link }) => (
  <Card className="dashboard-card">
    <CardActionArea onClick={link}>
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
  </Card>
);


const Dashboard = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // toggle dropdown visibility
  };

  return (
    <div className="dashboard">
      <header className='header'>
        <img src={imageURL} alt='IBM' />
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
        <div className='hello-heading p0'>
        <h3>Hello admin!</h3>
        </div>
      <Container maxWidth="lg" disableGutters> 
          <div className="dashboard-cards-container">
            <DashboardCard
              title="Discovery Management"
              description="Create, debug, and run workflows with Workflow Editor"
              icon={<Search fontSize="large" />}
              link={() => navigate("/discovery-management")}
            />
            <DashboardCard
              title="Schedule Management"
              description="Organize and monitor executions"
              icon={<Schedule fontSize="large" />}
              link={() => navigate("/backup-management")}
            />
            <DashboardCard
              title="Backup Management"
              description="Schedule and manage jobs"
              icon={<Backup fontSize="large" />}
              link={() => navigate("/list-device")}
            />
            <DashboardCard
              title="User Profile Administrator"
              description="Create and manage authentications"
              icon={<Security fontSize="large" />}
              link={() => navigate("/user-profile-administrator")}             
            />
          </div>
           {/* Stats Container */}
<div className="stats-container">
  <div className="stat-card">
    <PeopleIcon className="stat-icon" fontSize="large" />
    <h4>Total Users</h4>
    <p>124</p>
  </div>
  <div className="stat-card">
    <DevicesIcon className="stat-icon" fontSize="large" />
    <h4>Active Devices</h4>
    <p>87</p>
  </div>
  <div className="stat-card">
    <TaskIcon className="stat-icon" fontSize="large" />
    <h4>Pending Tasks</h4>
    <p>16</p>
  </div>
</div>
        </Container>        
      </main>
    </div>
  );
};

export default Dashboard;
