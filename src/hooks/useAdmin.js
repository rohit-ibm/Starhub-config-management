// import { useState, useEffect } from 'react';

// export const useAdmin = () => {
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [userName, setUserName] = useState('');

//   useEffect(() => {
//     const checkAdminStatus = () => {
//       try {
//         const userGroups = JSON.parse(sessionStorage.getItem('userGroups') || '[]');
//         const isAdminUser = userGroups.some(group => 
//           group.group_name.toLowerCase() === 'administrator'
//         );
//         setIsAdmin(isAdminUser);
        
//         // Get username from sessionStorage
//         const storedUserName = sessionStorage.getItem('userName');
//         setUserName(storedUserName || 'User'); // Fallback to 'User' if no username found
//       } catch (error) {
//         console.error('Error checking admin status:', error);
//         setIsAdmin(false);
//         setUserName('User');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkAdminStatus();
//   }, []);

//   return { isAdmin, isLoading, userName };
// };

import { useState, useEffect } from 'react';
import axios from 'axios';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get stored user information
        const storedGroups = JSON.parse(sessionStorage.getItem('userGroups') || '[]');
        const storedUserName = sessionStorage.getItem('userName');
        const storedUserId = sessionStorage.getItem('userId');
        const storedIsAdmin = JSON.parse(sessionStorage.getItem('isAdmin') || 'false');
        const storedToken = localStorage.getItem('token');

        // Set initial values from sessionStorage
        setUserGroups(storedGroups);
        setUserName(storedUserName || 'User');
        setUserId(storedUserId);
        setIsAdmin(storedIsAdmin);

        // If we have a userId and token, verify the groups are still current
        if (storedUserId && storedToken) {
          try {
            // Parse token if it's stored as a JSON string
            const token = storedToken.startsWith('{') ? 
              JSON.parse(storedToken) : storedToken;

            const response = await axios.get(
              `http://9.46.112.167:8001/get_user_groups_and_tasks/${storedUserId}`,
              {
                headers: {
                  'accept': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );

            const freshGroups = response.data;
            const freshIsAdmin = freshGroups.some(group => 
              group.group_name.toLowerCase() === 'administrator'
            );

            // Update storage and state if groups have changed
            if (JSON.stringify(freshGroups) !== JSON.stringify(storedGroups)) {
              sessionStorage.setItem('userGroups', JSON.stringify(freshGroups));
              sessionStorage.setItem('isAdmin', JSON.stringify(freshIsAdmin));
              setUserGroups(freshGroups);
              setIsAdmin(freshIsAdmin);
            }
          } catch (error) {
            console.warn('Could not refresh user groups:', error);
            if (error.response?.status === 401) {
              // Token might be expired - clear session
              clearSession();
            } else {
              // Keep using stored values for other types of errors
              console.log('Using cached group data due to refresh error');
            }
          }
        } else if (!storedUserId || !storedToken) {
          // If we're missing critical session data, clear everything
          clearSession();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const clearSession = () => {
    // Reset to safe defaults on error
    setIsAdmin(false);
    setUserName('User');
    setUserGroups([]);
    setUserId(null);
    
    // Clear all session data
    sessionStorage.removeItem('userGroups');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
  };

  // Helper function to check if user has a specific group
  const hasGroup = (groupName) => {
    return userGroups.some(group => 
      group.group_name.toLowerCase() === groupName.toLowerCase()
    );
  };

  // Helper function to get all user groups
  const getUserGroups = () => {
    return userGroups;
  };

  // Helper to check if session is valid
  const isSessionValid = () => {
    return Boolean(
      sessionStorage.getItem('isAuthenticated') && 
      localStorage.getItem('token') &&
      sessionStorage.getItem('userId')
    );
  };

  return {
    isAdmin,
    isLoading,
    userName,
    userId,
    hasGroup,
    getUserGroups,
    isSessionValid,
    userGroups,
    clearSession
  };
};