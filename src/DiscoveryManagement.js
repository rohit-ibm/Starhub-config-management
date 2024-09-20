import React, { useEffect, useState } from 'react';
import './DiscoveryManagement.css';
import axios from 'axios';
import deviceGroupsData from './config-management.json'; // Import JSON data

const App = () => {
  const [deviceGroups, setDeviceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [deviceGroupDetails, setDeviceGroupDetails] = useState(null);
  const [allDevices, setAllDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const devicesPerPage = 10; 

  const staticDeviceGroups = [
    {
      "name": "cisco",
      "parentId": "11",
      "id": "13",
      "devices": []
    },
    {
      "name": "cisco ios",
      "parentId": "11",
      "id": "14",
      "devices": []
    },
    {
      "name": "cisco ios-xr",
      "parentId": "11",
      "id": "15",
      "devices": []
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate fetching device groups from an API by using static data
        setDeviceGroups(staticDeviceGroups);

        // Fetch all devices initially
        const response = await axios.get('http://9.46.112.167:5000/inventory_data', {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        const allDevices = response.data;
        setAllDevices(allDevices);
        setDeviceGroupDetails({ devices: allDevices });
      } catch (error) {
        setError('Failed to fetch device groups or devices');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeviceGroupChange = (event) => {
    const groupName = event.target.value;
    setSelectedGroup(groupName);
    setCurrentPage(1); // Reset to first page

    let filteredDevices;
    if (groupName === 'Select All' || groupName === '') {
      filteredDevices = allDevices;
    } else {
      filteredDevices = allDevices.filter(device => device.device_group === groupName);
    }

    setDeviceGroupDetails({ devices: filteredDevices });
  };

  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prevPage => prevPage - 1);
  };

  const handleSearch = () => {
    const filteredDevices = allDevices.filter(device => 
    device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDeviceGroupDetails({ devices: filteredDevices });
  };

  const handleDiscoverDevice = async () => {
    try {
      // Simulate fetching devices from an API
      const response = await axios.get('http://9.46.112.167:5000/update_device_groups', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      const allDevices = response.data;
      console.log(allDevices);
      window.location.reload();
    } catch (error) {
      setError('Failed to discover devices');
    }
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const indexOfLastDevice = currentPage * devicesPerPage;
  const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
  const currentDevices = deviceGroupDetails?.devices.slice(indexOfFirstDevice, indexOfLastDevice);
  const totalPages = Math.ceil((deviceGroupDetails?.devices.length || 0) / devicesPerPage);

  return (
    <div className="container">
      {/* <h1 className="header">Device Groups</h1> */}
      <div className="device-group-controls">
        <label htmlFor="device-group" className="label">Select Device Group:</label>
        <select id="device-group" onChange={handleDeviceGroupChange} className="select">
          <option value="">Select a group</option>
          <option value="Select All">Select All</option>
          {deviceGroups.map(group => (
            <option key={group.id} value={group.name}>
              {group.name}
            </option>
          ))}
        </select>
        <button onClick={handleDiscoverDevice} className="discover-button">Discover All</button>
      </div>
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search by hostname, IP address or location" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">Search</button>
      </div>

      {deviceGroupDetails && (
        <div>
          <h2 className="subHeader">Device Details</h2>
          <table className="table">
            <thead>
              <tr>
                <th className="tableHeader">Device Id</th>
                <th className="tableHeader">Hostname</th>
                <th className="tableHeader">IP Address</th>
                <th className="tableHeader">Location</th>
                <th className="tableHeader">Device Type</th>
                <th className="tableHeader">Backup Status</th>  
                <th className="tableHeader">Last Backup Time </th>             
              </tr>
            </thead>
            <tbody>
              {currentDevices.map((device, index) => (
                <tr key={index}>
                  <td className="tableCell">{device.id}</td>
                  <td className="tableCell">{device.hostname}</td>
                  <td className="tableCell">{device.ip_address}</td>
                  <td className="tableCell">{device.location}</td>
                  <td className="tableCell">{device.device_type}</td>
                  <td className="tableCell">{device.backup_status}</td>   
                  <td className="tableCell">{device.last_backup_time}</td>              
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
};

const Pagination = ({ currentPage, handleNextPage, handlePrevPage, totalPages }) => {
  return (
    <div className="pagination">
      <button 
        onClick={handlePrevPage} 
        disabled={currentPage === 1} 
        className="page-link">
        {'<'}
      </button>
      <span className="page-info">
        Page <span className="current-page">{currentPage}</span> of {totalPages}
      </span>
      <button 
        onClick={handleNextPage} 
        disabled={currentPage === totalPages} 
        className="page-link">
        {'>'}
      </button>
    </div>
  );
};

export default App;