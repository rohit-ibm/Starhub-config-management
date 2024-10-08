import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './UserProfileAdministrator.css';

const UserProfileAdministrator = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]); // State to store roles
  const [permissions, setPermissions] = useState([]); // State to store permissions
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [userId, setUserId] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState(0);

  // State for popup and new password
  const [isResetPasswordPopupOpen, setIsResetPasswordPopupOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // State for delete confirmation
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  // Fetch data on component mount
  useEffect(() => {



    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://9.46.112.167:8001/users');
        setUsers(response.data); // Adjust based on actual response structure
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    // Fetch groups
    const fetchGroups = async () => {
      try {
        const response = await axios.get('http://9.46.112.167:8001/groups');
        setGroups(response.data); // Adjust based on actual response structure
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    // Call the fetch functions
    fetchUsers();
    fetchGroups();
    fetchRoles();
    fetchPermissions();
  }, []);

  const handleSave = async () => {
    try {
      const response = await axios.post('http://9.46.112.167:8001/add_user_to_group', {
        user_id: selectedUserIds,
        group_id: selectedGroupId,
      });
      setMessage('User added to group successfully!');
      // Optionally, reset the selected values
      setSelectedUserId(0);
      setSelectedGroupId(0);
    } catch (error) {
      console.error('Error adding user to group:', error);
      setMessage('Error adding user to group. Please try again.');
    }
  };

  // Fetch users from API
  const fetchUsers = () => {
    axios.get('http://9.46.112.167:8001/users')
      .then(response => {
        setUsers(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the Users!', error);
      });
  };



  // Fetch roles from API
  const fetchRoles = () => {
    axios.get('http://9.46.112.167:8001/groups')
      .then(response => {
        setRoles(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the Roles!', error);
      });
  };

  // Fetch permissions from API
  const fetchPermissions = () => {
    axios.get('http://9.46.112.167:8001/tasks')
      .then(response => {
        setPermissions(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the Permissions!', error);
      });
  };

  // Handle search functionality
  const handleSearch = () => {
    axios.get('http://9.46.112.167:8001/users')
      .then(response => {
        const filteredUsers = response.data.filter(user =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setUsers(filteredUsers);
      })
      .catch(error => {
        console.error('There was an error fetching the Users for search!', error);
      });
  };

  // Handle checkbox change for user selection
  const handleCheckboxChange = (userId) => {
    console.log("Selected User ID:", userId);
    setSelectedUserIds(userId); // Replace the current array with only the newly selected userId
  };

  // onChange handler for role selection for save
     const handleRoleChange = (groupId) => {
        setSelectedGroupId(groupId);
      };

  // Handle Reset Password - Opens Popup
  const handleResetPassword = () => {
    if (selectedUserIds.length === 0) {
      setMessage("Please select a user to reset the password.");
      setIsError(true);
      return;
    }
    setIsResetPasswordPopupOpen(true);
  };

  // Handle Save for Roles - Assigns selected roles to users
  const handleSaveRoles = () => {
    if (selectedUserIds.length === 0) {
      setMessage("No users selected for assigning roles.");
      setIsError(true);
      return;
    }

    // You would collect the selected roles and send a request to assign them here
    setMessage("Roles assigned successfully.");
    setIsError(false);
  };

  // Handle closing reset password popup
  const handleCloseResetPasswordPopup = () => {
    setIsResetPasswordPopupOpen(false);
    setNewPassword(''); // Clear the password input
  };


  // Handle submitting new password for the selected user
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      user_id: parseInt(selectedUserIds),  // Make sure userId is a valid integer
      new_password: newPassword     // Ensure newPassword contains the correct value
    };

    try {
      const response = await fetch('http://9.46.112.167:8001/reset_password', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',  // Using capitalized 'Accept' for consistency
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json(); // Parse the JSON response
        setMessage('Password reset successfully: ' + data.message); // Assuming your API sends a success message
        setUserId('');
        setNewPassword('');
      } else {
        const errorData = await response.json(); // Handle error response
        setMessage(`Error: ${errorData.message}`); // Display specific error message from the server
      }
    } catch (error) {
      setMessage('Error resetting password: ' + error.message); // More detailed error logging
    }
  };

  // Handle Delete Users - Opens Confirmation Popup
  const handleDeleteUsers = () => {
    if (selectedUserIds.length === 0) {
      setMessage("Please select a user to delete.");
      setIsError(true);
      return;
    }
    setIsDeleteConfirmationOpen(true); // Open delete confirmation popup
  };

  // Handle confirming user deletion
  const handleConfirmDelete = () => {
    const userId = selectedUserIds;

    axios.delete(`http://9.46.112.167:8001/delete_user/${userId}`)
      .then(() => {
        setMessage('User deleted successfully.');
        setIsError(false);
        fetchUsers(); // Refresh the user list
        setIsDeleteConfirmationOpen(false); // Close confirmation popup
      })
      .catch(error => {
        setMessage('Error deleting user.');
        setIsError(true);
        console.error('Error deleting user:', error);
      });
  };

  // Handle closing delete confirmation popup
  const handleCloseDeletePopup = () => {
    setIsDeleteConfirmationOpen(false);
  };

  // Pagination logic
  const usersPerPage = 8;
  const totalPages = Math.ceil(users.length / usersPerPage);
  const displayedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  return (
    <div className="user-profile-administrator">
      <h2>User Profile Administrator</h2>
      <div className="top-buttons">
        <Link to="/create-user" className="button">Create User</Link>
        <button onClick={handleResetPassword} className="button">Reset Password</button>
        <button onClick={handleDeleteUsers} className="button">Delete User</button>
        <button onClick={handleSave} className="button">Save</button>
      </div>
      {/* {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )} */}
      <div className="columns">
        {/* Users Section */}
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
            {displayedUsers.map(user => {               
                return (
                  <li key={user.user_id}>
                        <input type="checkbox"   id={`user-${user.user_id}`}  onChange={() => handleCheckboxChange(user.user_id)}  />
                        <label htmlFor={`user-${user.user_id}`}>{user.username}</label>
                    </li>
                );
            })}
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

        {/* Roles Section */}
        <div className="column alignment-left">
          <h3>Roles</h3>
          <div className="roles">
            {roles.length > 0 ? (
              roles.map(role => (
                <div key={role.group_id} className="role-item">
                  <input type="checkbox" id={`role-${role.group_id}`}  onChange={() => handleRoleChange(role.group_id)}/>
                  <label htmlFor={`role-${role.group_id}`}>{role.group_name}</label>
                </div>
              ))
            ) : (
              <p>Loading Roles...</p>
            )}
          </div>
        </div>

        {/* Permissions Section */}
        <div className="column alignment-left">
          <h3>Permissions</h3>
          <div className="permissions">
            {permissions.length > 0 ? (
              permissions.map(permission => (
                <div key={permission.task_id} className="permission-item">
                  <label htmlFor={`permission-${permission.task_id}`}>{permission.task_name}</label>
                </div>
              ))
            ) : (
              <p>Loading Permissions...</p>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Popup */}
      {isResetPasswordPopupOpen && (
        <div className="popup">
          <div className="popup-content">
            {/* <h3>Reset Password</h3>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="popup-buttons">
              <button onClick={handleSubmitNewPassword}>Submit</button>
              <button onClick={handleCloseResetPasswordPopup}>Cancel</button>
            </div> */}

            <div>
              <h2>Reset Password</h2>
              <form onSubmit={handleSubmit}>


                <div>
                  <label htmlFor="newPassword">New Password:</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="popup-buttons">
                  <button type="submit">Reset Password</button>
                  <button onClick={handleCloseResetPasswordPopup}>Cancel</button>
                </div>

              </form>



              {message && <p>{message}</p>}
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {isDeleteConfirmationOpen && (
        <div className="popup">
          <div className="popup-content">
            <h3>Are you sure you want to delete this user?</h3>
            <div className="popup-buttons">
              <button onClick={handleConfirmDelete}>Yes</button>
              <button onClick={handleCloseDeletePopup}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileAdministrator;


