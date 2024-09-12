// src/components/UserProfileAdministrator.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserProfileAdministrator.css';

const UserProfileAdministrator = () => {
  const [users, setUsers] = useState([]);
  const roles = ['Administrator', 'DiscoveryManagement', 'BackupManagement', 'ViewDownloadCompareBackup'];
  const permissions = ['DoAll', 'viewOnly', 'BackupOnly', 'CompareBackup'];

  useEffect(() => {
    axios.get('http://9.46.112.167:8001/users')
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the users!', error);
      });
  }, []);

  return (
    <div className="user-profile-administrator">
      <h2>User Profile Administrator</h2>
      <div className="columns">
        <div className="column">
          <h3>Users</h3>
          <ul>
            {users.map(user => (
              <li key={user.id}>
                <input type="checkbox" id={`user-${user.id}`} />
                <label htmlFor={`user-${user.id}`}>{user.username}</label>
              </li>
            ))}
          </ul>
        </div>
        <div className="column">
          <h3>Roles</h3>
          <ul>
            {roles.map(role => (
              <li key={role}>
                <input type="checkbox" id={`role-${role}`} />
                <label htmlFor={`role-${role}`}>{role}</label>
              </li>
            ))}
          </ul>
        </div>
        <div className="column">
          <h3>Permissions</h3>
          <ul>
            {permissions.map(permission => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfileAdministrator;
