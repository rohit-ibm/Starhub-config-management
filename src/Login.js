import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import imageURL from '../src/Assets/IBM_LOGO.svg';
import config from './config.json';

const PAS_IP = config.PAS_IP;
const RBAC_PORT = config.RBAC_PORT;
const BACKEND_PORT = config.BACKEND_PORT;


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);


  // Helper function to extract user ID from various token formats
  const extractUserId = (token) => {
    // console.log('Extracting user ID from token:', token);

    if (typeof token === 'object' && token !== null) {
      // Handle JSON object response
      return token.user_id || token.userId || token.id;
    }

    try {
      // Try parsing as JSON string
      const jsonToken = JSON.parse(token);
      return jsonToken.user_id || jsonToken.userId || jsonToken.id;
    } catch (e) {
      // If JSON parsing fails, try JWT decoding
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          return payload.user_id || payload.sub || payload.id;
        }
      } catch (jwtError) {
        // console.log('JWT decoding failed:', jwtError);
      }
    }

    // If all parsing fails, return null
    return null;
  };


  const fetchUserGroups = async (userId) => {
    try {
      // console.log('Fetching user groups for userId:', userId);
      const response = await axios.get(`http://${PAS_IP}:${RBAC_PORT}/get_user_groups_and_tasks/${userId}`, {
        headers: {
          'accept': 'application/json'
        }
      });

      const groups = response.data;
      // console.log('User groups response:', groups);

      // Process groups to determine roles
      const roles = {
        isDiscovery: groups.some(group =>
          group.group_name.toLowerCase() === 'discoverymanagement'
        ),
        isSchedule: groups.some(group =>
          group.group_name.toLowerCase() === 'schedule management'
        ),
        isBackup: groups.some(group =>
          group.group_name.toLowerCase() === 'backup management'
        )
      };

      return {
        groups,
        roles
      };
    } catch (error) {
      // console.error('Error fetching user groups:', error);
      return {
        groups: [],
        roles: {
          isDiscovery: false,
          isSchedule: false,
          isBackup: false
        }
      };
    }
  };


  const setupUserSession = async (loginResponse, isTokenLogin = false) => {
    if (loginResponse.status === 200 && loginResponse.data) {
      const token = loginResponse.data;
      // console.log('Login successful, received token:', token);

      localStorage.setItem('token', JSON.stringify(token));
      sessionStorage.setItem('userName', username);

      let userId;
      if (!isTokenLogin) {
        userId = extractUserId(token);
        if (!userId) {
          // console.error('Could not extract userId from token');
          setError('Error processing login information');
          setOpen(false);
          return;
        }
      } else {
        userId = '24'; // Admin token login
      }

      // console.log('Using userId:', userId);

      try {
        const { groups, roles } = await fetchUserGroups(userId);

        // Check for admin status as before
        const isAdmin = groups.some(group =>
          group.group_name.toLowerCase() === 'administrator'
        );

        // console.log('Is admin user:', isAdmin);
        // console.log('User roles:', roles);

        // Store all user information
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userGroups', JSON.stringify(groups));
        sessionStorage.setItem('isAdmin', JSON.stringify(isAdmin));
        sessionStorage.setItem('userId', userId);

        // Store role information
        sessionStorage.setItem('userRoles', JSON.stringify(roles));

        // If user has no roles and is not admin, show error
        if (!isAdmin && !roles.isDiscovery && !roles.isSchedule && !roles.isBackup) {
          setError('User does not have any assigned roles');
          setOpen(false);
          return;
        }

        navigate('/dashboard');
      } catch (error) {
        // console.error('Error in session setup:', error);
        setError('Error setting up user session');
        setOpen(false);
      }
    } else {
      setOpen(false);
      setError('Invalid username or password');
    }
  };

  const handleTokenLogin = async (e) => {
    e.preventDefault();
    setOpen(true);
    setError('');

    try {
      const response = await axios.get(
        `http://${PAS_IP}:${BACKEND_PORT}/get_token?username=${username}&password=${password}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );
      await setupUserSession(response, true);
    } catch (error) {
      setError('Failed to login');
      setOpen(false);
      // console.error('Login error:', error);
    }
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setOpen(true);
    setError('');

    try {
      const response = await axios.post(
        `http://${PAS_IP}:${RBAC_PORT}/login`,
        //'http://${PAS_IP}:${RBAC_PORT}/login',
        {
          username: username,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      await setupUserSession(response, false);
    } catch (error) {
      setError('Failed to login');
      setOpen(false);
      // console.error('Login error:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src={imageURL} alt='IBM' />
        <h1>Sign In</h1>
        <div>
          Login to your account
        </div>
        <form onSubmit={username == "admin" ? handleTokenLogin : handleLocalLogin}>
          <div className='username-container'>
            <div>Username *</div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className='password-container'>
            <div>Password *</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" onClick={handleOpen}>Login</button>
          <Backdrop
            sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
            open={open}
            onClick={handleClose}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;

