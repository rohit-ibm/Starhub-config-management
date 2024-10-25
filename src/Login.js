import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import imageURL from '../src/Assets/IBM_LOGO.svg';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');  
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  // Helper function to safely decode and examine token
  const decodeToken = (token) => {
    console.log('Raw token:', token); // Debug log

    try {
      // Try parsing as JSON first
      const jsonToken = JSON.parse(token);
      console.log('Token parsed as JSON:', jsonToken);
      return { 
        userId: jsonToken.user_id || jsonToken.id || jsonToken.userId,
        type: 'json'
      };
    } catch (e) {
      // If JSON parsing fails, try JWT decoding
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token decoded as JWT:', payload);
          return { 
            userId: payload.user_id || payload.sub || payload.id,
            type: 'jwt'
          };
        }
      } catch (jwtError) {
        console.log('JWT decoding failed:', jwtError);
      }
    }

    // If all parsing fails, return the token as is
    console.log('Using token as raw value');
    return { userId: token, type: 'raw' };
  };

  const fetchUserGroups = async (userId) => {
    try {
      console.log('Fetching user groups for userId:', userId);
      const response = await axios.get(`http://9.46.112.167:8001/get_user_groups_and_tasks/${userId}`, {
        headers: {
          'accept': 'application/json'
        }
      });
      console.log('User groups response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  };

  const setupUserSession = async (loginResponse, isTokenLogin = false) => {
    if (loginResponse.status === 200 && loginResponse.data) {
      const token = loginResponse.data;
      console.log('Login successful, received token:', token);
      
      localStorage.setItem('token', token);
      sessionStorage.setItem('userName', username);

      let userId;
      if (!isTokenLogin) {
        // For local login
        console.log('Processing local login token');
        const decodedToken = decodeToken(token);
        console.log('Decoded token result:', decodedToken);
        
        if (!decodedToken.userId) {
          console.error('Could not extract userId from token');
          setError('Error processing login information');
          setOpen(false);
          return;
        }
        userId = decodedToken.userId;
      } else {
        // For admin token login
        console.log('Processing admin token login');
        userId = '24';
      }

      console.log('Using userId:', userId);

      try {
        const userGroups = await fetchUserGroups(userId);
        console.log('Fetched user groups:', userGroups);
        
        const isAdmin = userGroups.some(group => 
          group.group_name.toLowerCase() === 'administrator'
        );
        console.log('Is admin user:', isAdmin);

        // Store all user information
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userGroups', JSON.stringify(userGroups));
        sessionStorage.setItem('isAdmin', JSON.stringify(isAdmin));
        sessionStorage.setItem('userId', userId);

        navigate('/dashboard');
      } catch (error) {
        console.error('Error in session setup:', error);
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
        `http://9.46.112.167:5000/get_token?username=${username}&password=${password}`,
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
      console.error('Login error:', error);
    }
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setOpen(true);
    setError('');

    try {
      const response = await axios.post(
        'http://9.46.112.167:8001/login',
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
      console.error('Login error:', error);
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
        <form onSubmit={username === "admin" ? handleTokenLogin : handleLocalLogin}>
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