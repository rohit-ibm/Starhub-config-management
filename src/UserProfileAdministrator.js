import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './UserProfileAdministrator.css';
import CreateUserForm from './CreateUser';

const rolePermissions = {
  'Administrator': ['DoAll'],
  'DiscoveryManagement': ['viewOnly'],
  'Schedule Management': ['backupOnly', 'viewOnly'], 
  'Backup Management': ['compareBackup'], 
};



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
  const [selectedUserId, setSelectedUserId] = useState(null);
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
  const [userGroups, setUserGroups] = useState([]);
  const [originalUserGroups, setOriginalUserGroups] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [singleSelectedRole, setSingleSelectedRole] = useState('');

  
 


  // Fetch data on component mount
  useEffect(() => {

    // const fetchUsers = async () => {
    //   try {
    //     const response = await axios.get('http://9.46.112.167:8001/users');
    //     setUsers(response.data); // Adjust based on actual response structure
    //   } catch (error) {
    //     console.error('Error fetching users:', error);
    //   }
    // };

    // // Fetch groups
    // const fetchGroups = async () => {
    //   try {
    //     const response = await axios.get('http://9.46.112.167:8001/groups');
    //     setGroups(response.data); // Adjust based on actual response structure
    //   } catch (error) {
    //     console.error('Error fetching groups:', error);
    //   }
    // };

    // Call the fetch functions
    fetchUsers();
    //fetchGroups();
    fetchRoles();
    fetchPermissions();
  }, []);

  const handleSave = async () => {
    if (!selectedUserId) {
      setSaveMessage('Please select a user before saving changes.');
      setIsError(true);
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    try {
      const groupsToAdd = userGroups.filter(group => !originalUserGroups.includes(group));
      const groupsToRemove = originalUserGroups.filter(group => !userGroups.includes(group));

      if (groupsToAdd.length === 0 && groupsToRemove.length === 0) {
        setSaveMessage('No changes made.');
        setIsError(false);
        setTimeout(() => setSaveMessage(''), 3000);
        return;
      }

      const addPromises = groupsToAdd.map(async groupName => {
        const group = roles.find(role => role.group_name === groupName);
        if (group) {
          const payload = { user_id: selectedUserId, group_id: group.group_id };
          return axios.post('http://9.46.112.167:8001/add_user_to_group', payload);
        }
      });

      const removePromises = groupsToRemove.map(async groupName => {
        const group = roles.find(role => role.group_name === groupName);
        if (group) {
          const payload = { user_id: selectedUserId, group_id: group.group_id };
          return axios.delete('http://9.46.112.167:8001/remove_user_from_group', { data: payload });
        }
      });

      await Promise.all([...addPromises, ...removePromises]);

      // Refresh user groups data after the operations
      await fetchUserGroups(selectedUserId);

      setSaveMessage('User groups updated successfully!');
      setIsError(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user groups:', error);
      setSaveMessage('Error updating user groups. Please try again.');
      setIsError(true);
      setTimeout(() => setSaveMessage(''), 3000);
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

  const fetchUserGroups = async (userId) => {
    try {
      const response = await axios.get(`http://9.46.112.167:8001/get_user_groups_and_tasks/${userId}`);
      
      if (response.status === 200 && response.data) {
        const userGroupNames = response.data.map(group => group.group_name);
        setUserGroups(userGroupNames);
        setOriginalUserGroups(userGroupNames);
  
        // Extract all unique permissions (tasks) for the user
        const userTasks = response.data.flatMap(group => group.tasks);
        setUserPermissions([...new Set(userTasks)]);
      } else {
        throw new Error('Unexpected response format or empty response.');
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setMessage('Error fetching user groups. Please try again.');
      setIsError(true);
    }
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

  const handleCheckboxChange = (userId) => {
    if (selectedUserIds === userId) {
      // If the user is already selected, unselect them
      setSelectedUserIds(null);
      setUserGroups([]);
      setOriginalUserGroups([]);
      setUserPermissions([]);
      setSingleSelectedRole(''); // Clear single role selection
    } else {
      // If a different user is selected, select them and fetch their data
      setSelectedUserIds(userId);
      setSingleSelectedRole(''); // Clear single role selection
      fetchUserGroups(userId);
    }
  };



  // const handleUserSelection = (userId) => {
  //   setSelectedUserId(userId);
  //   fetchUserGroups(userId);
  // };

  const handleRoleChange = (groupName) => {
    if (!selectedUserIds) {
      // When no user is selected, allow only one role selection
      if (singleSelectedRole === groupName) {
        // If clicking the same role, unselect it
        setSingleSelectedRole('');
        setUserGroups([]);
        setUserPermissions([]);
      } else {
        // Select new role
        setSingleSelectedRole(groupName);
        setUserGroups([groupName]);
        setUserPermissions(rolePermissions[groupName] || []);
      }
    } else {
      // When user is selected, keep existing multiple selection functionality
      const updatedGroups = userGroups.includes(groupName)
        ? userGroups.filter(name => name !== groupName)
        : [...userGroups, groupName];
      
      setUserGroups(updatedGroups);
      
      // Update permissions based on all selected roles
      const allPermissions = updatedGroups.flatMap(role => rolePermissions[role] || []);
      setUserPermissions([...new Set(allPermissions)]);
    }
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
    setMessage(''); 
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
        setMessage(data.message);
        setUserId('');
        setNewPassword('');
        setTimeout(() => {
          setIsResetPasswordPopupOpen(false); 
      }, 3000);
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
      setTimeout(() => {
        setIsDeleteConfirmationOpen(false);
        setDeleteMessage(''); 
      }, 2000); 
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
                        <input type="checkbox"   id={`user-${user.user_id}`}  checked={selectedUserIds === user.user_id} onChange={() => handleCheckboxChange(user.user_id)}  />
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
                <input
                  type="checkbox"
                  id={`role-${role.group_id}`}
                  checked={selectedUserIds 
                    ? userGroups.includes(role.group_name)
                    : singleSelectedRole === role.group_name}
                  onChange={() => handleRoleChange(role.group_name)}
                />
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
    {selectedUserIds ? (
      // Display permissions based on selected user and their groups
      userPermissions.length > 0 ? (
        userPermissions.map(permission => (
          <div key={permission} className="permission-item">
            <label>{permission}</label>
          </div>
        ))
      ) : (
        <p>No permissions.</p>
      )
    ) : (
      // If no user is selected, display permissions based on selected roles
      userGroups.length > 0 ? (
        userPermissions.length > 0 ? (
          userPermissions.map(permission => (
            <div key={permission} className="permission-item">
              <label>{permission}</label>
            </div>
          ))
        ) : (
          <p>No permissions for the selected role(s).</p>
        )
      ) : (
        <p>Please select a user or a role to view permissions.</p>
      )
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


