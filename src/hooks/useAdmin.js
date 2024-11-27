import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config.json';


const PAS_IP = config.PAS_IP;
const RBAC_PORT = config.RBAC_PORT;


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
              `http://${PAS_IP}:${RBAC_PORT}/get_user_groups_and_tasks/${storedUserId}`,
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
            // console.warn('Could not refresh user groups:', error);
            if (error.response?.status === 401) {
              clearSession();
            }
          }
        } else {
          clearSession();
        }
      } catch (error) {
        // console.error('Error checking admin status:', error);
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

  const hasRoleAccess = (feature) => {
    // console.log(`Checking access for ${feature}:`, userGroups);

    if (isAdmin) {
      // console.log('User is admin, granting access');
      return true;
    }

    const groupMapping = {
      'discovery': 'DiscoveryManagement',
      'schedule': 'Schedule Management',
      'backup': 'Backup Management'
    };

    const requiredGroup = groupMapping[feature];
    const hasAccess = userGroups.some(group => group.group_name === requiredGroup);

    // console.log(`Checking ${feature} access:`, {
    //   requiredGroup,
    //   hasAccess,
    //   groups: userGroups.map(g => g.group_name)
    // });

    return hasAccess;
  };

  return {
    isAdmin,
    isLoading,
    userName,
    userId,
    userGroups,
    hasRoleAccess,
    clearSession
  };
};
