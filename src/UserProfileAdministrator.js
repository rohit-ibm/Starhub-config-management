// src/components/UserProfileAdministrator.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './UserProfileAdministrator.css';

const UserProfileAdministrator = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const roles = ['Administrator', 'DiscoveryManagement', 'BackupManagement', 'ViewDownloadCompareBackup'];
  const permissions = ['DoAll', 'viewOnly', 'BackupOnly', 'CompareBackup'];

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = () => {
    axios.get('http://9.46.112.167:8001/users')
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the users!', error);
      });
  };

  const handleSearch = () => {
    const filteredUsers = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setUsers(filteredUsers);
  };

  const handleCheckboxChange = (userId) => {
    setSelectedUserIds(prevSelectedUserIds =>
      prevSelectedUserIds.includes(userId)
        ? prevSelectedUserIds.filter(id => id !== userId)
        : [...prevSelectedUserIds, userId]
    );
  };

  const handleDeleteUsers = () => {
    selectedUserIds.forEach(userId => {
      axios.delete(`http://9.46.112.167:8001/delete_user/${userId}`)
        .then(response => {
          setMessage(`User ${userId} deleted successfully.`);
          setIsError(false);
          fetchUsers(); // Refresh the user list
        })
        .catch(error => {
          setMessage(`There was an error deleting user ${userId}!`);
          setIsError(true);
          console.error(`There was an error deleting user ${userId}!`, error);
        });
    });
    setSelectedUserIds([]);
  };

  const handleResetPassword = () => {
    selectedUserIds.forEach(userId => {
      axios.get(`http://9.46.112.167:8001/get_user_by_username/${userId}`)
        .then(response => {
          const userId = response.data.id;
          axios.delete(`http://9.46.112.167:8001/delete_user/${userId}`)
            .then(response => {
              setMessage(`Password for user ${userId} reset successfully.`);
              setIsError(false);
            })
            .catch(error => {
              setMessage(`There was an error resetting password for user ${userId}!`);
              setIsError(true);
              console.error(`There was an error resetting password for user ${userId}!`, error);
            });
        })
        .catch(error => {
          setMessage(`There was an error fetching user ${userId}!`);
          setIsError(true);
          console.error(`There was an error fetching user ${userId}!`, error);
        });
    });
    setSelectedUserIds([]);
  };

  const usersPerPage = 30;
  const totalPages = Math.ceil(users.length / usersPerPage);
  const displayedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  return (
    <div className="user-profile-administrator">
      <h2>User Profile Administrator</h2>
      <div className="top-buttons">
        <Link to="/create-user" className="button">Create User</Link>
        <button onClick={handleDeleteUsers} className="button">Delete User</button>
        <button onClick={handleResetPassword} className="button">Reset Password</button>
      </div>
      {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      <div className="columns">
        <div className="column">
          <h3>Users</h3>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
          <ul>
            {displayedUsers.map(user => (
              <li key={user.id}>
                <input
                  type="checkbox"
                  id={`user-${user.id}`}
                  onChange={() => handleCheckboxChange(user.id)}
                />
                <label htmlFor={`user-${user.id}`}>{user.username}</label>
              </li>
            ))}
          </ul>
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={currentPage === index + 1 ? 'active' : ''}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="column">
          <h3>Roles</h3>
          <div className="roles">
            {roles.map(role => (
              <div key={role} className="role-item">
                <input type="checkbox" id={`role-${role}`} />
                <label htmlFor={`role-${role}`}>{role}</label>
              </div>
            ))}
          </div>
        </div>
        <div className="column">
          <h3>Permissions</h3>
          {permissions.map(permission => (
            <div key={permission}>
              <label>{permission}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfileAdministrator;
