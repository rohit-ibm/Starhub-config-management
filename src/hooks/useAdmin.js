import { useState, useEffect } from 'react';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAdminStatus = () => {
      try {
        const userGroups = JSON.parse(sessionStorage.getItem('userGroups') || '[]');
        const isAdminUser = userGroups.some(group => 
          group.group_name.toLowerCase() === 'administrator'
        );
        setIsAdmin(isAdminUser);
        
        // Get username from sessionStorage
        const storedUserName = sessionStorage.getItem('userName');
        setUserName(storedUserName || 'User'); // Fallback to 'User' if no username found
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setUserName('User');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading, userName };
};