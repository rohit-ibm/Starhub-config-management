// src/components/CreateUser.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateUser.css';

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleCreateUser = () => {
    axios.post('http://9.46.112.167:8001/create_user', {
      username,
      password,
      email
    })
    .then(response => {
      setMessage('User created successfully!');
      setIsError(false);
      setTimeout(() => {
        navigate('/'); // Redirect to the main page after creation
      }, 2000);
    })
    .catch(error => {
      setMessage('There was an error creating the user.');
      setIsError(true);
    });
  };

  return (
    <div className="create-user">
      <h2>Create User</h2>
      <div className="form-group">
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button onClick={handleCreateUser}>Create User</button>
      {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CreateUser;
