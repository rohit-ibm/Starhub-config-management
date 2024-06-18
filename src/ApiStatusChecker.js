import React, { useEffect } from 'react';
import axios from 'axios';

const ApiStatusChecker = () => {
  useEffect(() => {
    const fetchApiStatus = async () => {
      try {
        const response = await axios.get('https://9.42.110.15:25283/api/status');
        console.log('Status code:', response.status);
      } catch (error) {
        console.error('Error fetching API status:', error);
      }
    };

    fetchApiStatus();
  }, []);

  return (
    <div>
      <h2>API Status Checker</h2>
      {/* You can add any additional UI elements here if needed */}
    </div>
  );
};

export default ApiStatusChecker;
