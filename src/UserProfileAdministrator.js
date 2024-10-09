import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './UserProfileAdministrator.css';
import CreateUserForm from './CreateUser';

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

  const [isCreateUserPopupOpen, setIsCreateUserPopupOpen] = useState(false);
  const [createUserMessage, setCreateUSerMessage] = useState(''); 

  // State for popup and new password
  const [isResetPasswordPopupOpen, setIsResetPasswordPopupOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // State for delete confirmation
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  //state for save
  const [saveMessage, setSaveMessage] = useState(''); 




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
      setSaveMessage('User added to group successfully!');
      // Optionally, reset the selected values
      setSelectedUserId(0);
      setSelectedGroupId(0);
      setTimeout(() => {
        setSaveMessage(''); // Reset save message after a delay
      }, 2000);
    } catch (error) {
      console.error('Error adding user to group:', error);
      setSaveMessage('Error adding user to group. Please try again.');
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
        setMessage(data.message); // Assuming your API sends a success message
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
      setDeleteMessage("Please select a user to delete.");
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
        setDeleteMessage('User deleted successfully.');
        setIsError(false);
        fetchUsers(); // Refresh the user list
        //setIsDeleteConfirmationOpen(false); // Close confirmation popup
         // Delay closing the popup to show the message
      setTimeout(() => {
        setIsDeleteConfirmationOpen(false);
        setDeleteMessage(''); // Reset delete message after closing
      }, 2000); // Adjust the delay as necessary (2000 ms = 2 seconds)
    })
      
      .catch(error => {
        setDeleteMessage('Error deleting user.');
        setIsError(true);
        console.error('Error deleting user:', error);
      });
  };

  // Handle closing delete confirmation popup
  const handleCloseDeletePopup = () => {
    setIsDeleteConfirmationOpen(false);
  };

  // Handle Reset Password - Opens Popup
  const handlePasswordReset = () => {
    if (!selectedUserIds) {
      alert('Please select the user to reset password.');
      return;
    }
    setIsResetPasswordPopupOpen(true);
  };

  // Function to open create user popup
const handleCreateUserOpen = () => {
  setIsCreateUserPopupOpen(true);
};

// Function to close create user popup
const handleCreateUserClose = () => {
  setIsCreateUserPopupOpen(false);
};

// Function to handle user creation
const handleCreateUser = async (username, password, email) => {
  try {
      const response = await axios.post('http://9.46.112.167:8001/create_user', {
          username,
          password,
          email,
      });
      setCreateUSerMessage('User created successfully!');
      setIsError(false);
      fetchUsers();
      setTimeout(() => {
          setIsCreateUserPopupOpen(false); // Close popup after successful creation
      }, 3000);
  } catch (error) {
    setCreateUSerMessage('There was an error creating the user.');
      setIsError(true);
  }
};


  // Pagination logic
  const usersPerPage = 8;
  const totalPages = Math.ceil(users.length / usersPerPage);
  const displayedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  return (
    <div className="user-profile-administrator">
      <h2>User Profile Administrator</h2>
      <div className="top-buttons">
      <button onClick={handleCreateUserOpen} className="button">Create User</button>
        {/* <Link to="/create-user" className="button">Create User</Link> */}
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
              {isResetPasswordPopupOpen && (
                <div className="popup">
                  <div className="popup-content">
                    <h2>Reset Password</h2>
                    <form onSubmit={handleSubmit}>
                      <div className="input-group">
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
                        <button type="submit" className="btn-confirm">Reset Password</button>
                        <button type="button" className="btn-cancel" onClick={handleCloseResetPasswordPopup}>Cancel</button>
                      </div>
                    </form>

                    {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
                  </div>
                </div>
              )}


            {isCreateUserPopupOpen && (
                <div className="popup">
                    <div className="popup-content">
                        <h2>Create User</h2>
                        <CreateUserForm onCreateUser={handleCreateUser} onClose={handleCreateUserClose} />
                        {createUserMessage && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{createUserMessage}</p>}
                    </div>
                </div>
            )}


      {/* Delete Confirmation Popup */}
      {isDeleteConfirmationOpen && (
  <div className="popup">
    <div className="popup-content">
      <h2>Confirm Deletion</h2>
      <p>Are you sure you want to delete the selected user(s)?</p>
      <div className="popup-buttons">
        <button onClick={handleConfirmDelete} className="btn-confirm">Yes</button>
        <button onClick={handleCloseDeletePopup} className="btn-cancel">No</button>
      </div>
      {deleteMessage && <p className={`message ${deleteMessage.includes('Error') ? 'error' : 'success'}`}>{deleteMessage}</p>} 
    </div>
  </div>
)}
 {saveMessage && <p className={`message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>{saveMessage}</p>}
    </div>
  );
};

export default UserProfileAdministrator;


