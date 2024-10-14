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
  const handleClose = () => {
    setOpen(false);
  };
  const handleOpen = () => {
    setOpen(true);
  };

  const handleTokenLogin = async (e) => {
    e.preventDefault();
    setOpen(true);  
    setError('');
    try {
      const response = await axios.get(`http://9.46.112.167:5000/get_token?username=${username}&password=${password}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.status === 200 && response.data) {
        localStorage.setItem('token', response.data);
        navigate('/dashboard');
        sessionStorage.setItem("isAuthenticated", true)
      } else {
        setOpen(false);
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('Failed to login');
      console.error('Login error:', error);
    }
  };
  
  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setOpen(true);  
    setError('');
    try {
      const response = await axios.post(`http://9.46.112.167:8001/login`, {
        username: username,
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setResponse(response);

      if (response.status === 200 && response.data) {
        localStorage.setItem('token', response.data);
        navigate('/dashboard');
        sessionStorage.setItem("isAuthenticated", true)
      } else {
        setOpen(false);
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('Failed to login');
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
        <form onSubmit={username === "admin"? handleTokenLogin : handleLocalLogin}>
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
