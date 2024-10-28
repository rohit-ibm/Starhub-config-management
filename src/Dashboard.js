import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Search, Schedule, Backup, Security } from '@mui/icons-material';
import { Card, CardActionArea, CardContent, Typography, Container, Box, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import TaskIcon from '@mui/icons-material/Task';
import { useAdmin } from './hooks/useAdmin';

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
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const { isAdmin, isLoading, userName } = useAdmin();

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // toggle dropdown visibility
  };

  // === Session Expiry Logic ===
  const SESSION_TIMEOUT = 1 * 60 * 1000; // 5 minutes

  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      clearTimeout(timeoutId); // Clear the existing timeout
      timeoutId = setTimeout(() => {
        setIsSessionExpired(true); // Set session expired to true after inactivity
      }, SESSION_TIMEOUT); // Set a new timeout
    };

    // Reset the timeout on activity (mouse movement, clicks, key presses)
    const activityListener = () => {
      resetTimeout();
    };

    // Add event listeners to detect user activity
    window.addEventListener('mousemove', activityListener);
    window.addEventListener('click', activityListener);
    window.addEventListener('keypress', activityListener);

    // Start the initial session timeout
    resetTimeout();

    // Cleanup event listeners and timeout on component unmount
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', activityListener);
      window.removeEventListener('click', activityListener);
      window.removeEventListener('keypress', activityListener);
    };
  }, []);

  // When the session expires, show a message and redirect to the login page
  useEffect(() => {
    if (isSessionExpired) {
      alert('Your session has expired due to inactivity. You will be redirected to the login page.');
      handleLogout();
    }
  }, [isSessionExpired]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="dashboard">
      <main>
        <div className='hello-heading p0'>
        <h3>Hello {userName}!</h3>
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
             {isAdmin && (
              <DashboardCard
                title="User Profile Administrator"
                description="Create and manage authentications"
                icon={<Security fontSize="large" />}
                link={() => navigate("/user-profile-administrator")}
              />
            )}
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
              <h4>Number of Devices</h4>
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

