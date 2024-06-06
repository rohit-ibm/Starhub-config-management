import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DiscoveryManagement = () => {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('https://sevone-api.example.com/devices', {
          headers: {
            
            Authorization: `Bearer ${token}`,
          },
        });
        setDevices(response.data.devices);
      } catch (error) {
        setError('Failed to fetch devices');
      }
    };

    fetchDevices();
  }, []);

  return (
    <div>
      <h2>Discovery Management</h2>
      {error && <p className="error">{error}</p>}
      <ul>
        {devices.map((device) => (
          <li key={device.id}>{device.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default DiscoveryManagement;
