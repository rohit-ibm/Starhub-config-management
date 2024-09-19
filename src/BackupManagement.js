import React, { useEffect, useState } from 'react';
import './BackupManagement.css';
import axios from 'axios';
import deviceGroupsData from './config-management.json'; // Import JSON data
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const App = () => {
  const [deviceGroups, setDeviceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [deviceGroupDetails, setDeviceGroupDetails] = useState(null);
  const [allDevices, setAllDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term
  const devicesPerPage = 10; // Adjust the number of devices per page as needed

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
        setDeviceGroups(staticDeviceGroups);
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
    setCurrentPage(1);

    let filteredDevices;
    if (groupName === 'Select All' || groupName === '') {
      filteredDevices = allDevices;
    } else {
      filteredDevices = allDevices.filter(device => device.device_group === groupName);
    }

    setDeviceGroupDetails({ devices: filteredDevices });
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === deviceGroupDetails?.devices.length) {
      // Deselect all devices
      setSelectedDevices([]);
    } else {
      // Select all devices
      const allDeviceHostnames = deviceGroupDetails?.devices.map(device => device.hostname) || [];
      setSelectedDevices(allDeviceHostnames);
    }
  };

  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prevPage => prevPage - 1);
  };

  const handleImmediateBackup = async () => {
    const baseUrl = 'http://9.46.112.167:5000/inventory_data/devices';
    const url = `${baseUrl}?${selectedDevices.map(device => `devices=${device}`).join('&')}`;

    try {
      const getResponse = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const postResponse = await axios.post('http://9.46.112.167:5000/post_backup', getResponse.data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('POST Response:', postResponse);

      alert('Immediate backup initiated');
    } catch (error) {
      console.error('Error initiating immediate backup:', error);
      alert('Failed to initiate immediate backup');
    }
  };

  const handleScheduleBackup = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleScheduleBackupSubmit = async () => {
    setShowDatePicker(false);

    try {
      const response = await axios.post('http://9.46.112.167:5000/inventory_data/schedule_backup', {
        date: selectedDate.toISOString(),
        devices: selectedDevices
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Schedule Backup Response:', response);

      alert('Backup scheduled');
    } catch (error) {
      console.error('Error scheduling backup:', error);
      alert('Failed to schedule backup');
    }
  };

  const handleSelectDevice = (event, deviceHostname) => {
    const newSelectedDevices = event.target.checked
      ? [...selectedDevices, deviceHostname]
      : selectedDevices.filter(hostname => hostname !== deviceHostname);
    setSelectedDevices(newSelectedDevices);
  };

  const handleSearch = () => {
    const filteredDevices = allDevices.filter(device => 
      device.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.backup_status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDeviceGroupDetails({ devices: filteredDevices });
  };

  const handleDeleteDevices = async () => {
    if (selectedDevices.length === 0) {
      alert('Please select devices to delete.');
      return;
    }

    try {
      const url = `http://9.46.112.167:5000/delete_devices?${selectedDevices.map(device => `devices=${device}`).join('&')}`;
      await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Update the state to remove deleted devices
      const remainingDevices = allDevices.filter(device => !selectedDevices.includes(device.hostname));
      setAllDevices(remainingDevices);
      setDeviceGroupDetails({ devices: remainingDevices });
      setSelectedDevices([]);

      alert('Selected devices deleted successfully.');
    } catch (error) {
      console.error('Error deleting devices:', error);
      alert('Failed to delete devices');
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
      <h1 className="header">Device Groups</h1>
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
      </div>
      <div className="button-container">
        <button onClick={handleImmediateBackup} className="immediate-button">Immediate Backup</button>
        <button onClick={handleScheduleBackup} className="schedule-button">Schedule Backup</button>
        <button onClick={handleDeleteDevices} className="delete-button">Delete Device</button> {/* New Delete Device Button */}
      </div>
      <div className="search-container">
        <button onClick={handleSelectAll} className="select-all-button">
          {selectedDevices.length === deviceGroupDetails?.devices.length ? 'Deselect All' : 'Select All'}
        </button>
        <input 
          type="text" 
          placeholder="Search by hostname, IP address or location" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">Search</button>
      </div>
      <div className="select-all-container">
        
      </div>

      {deviceGroupDetails && (
        <div>
          <h2 className="subHeader">Device Details</h2>
          <table className="table">
            <thead>
              <tr>
                <th className="tableHeader">Select</th>
                <th className="tableHeader">Device Group</th>
                <th className="tableHeader">Hostname</th>
                <th className="tableHeader">IP Address</th>
                <th className="tableHeader">Location</th>
                <th className="tableHeader">Backup Status</th>
              </tr>
            </thead>
            <tbody>
              {currentDevices.map(device => (
                <tr key={device.hostname}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.hostname)}
                      onChange={(e) => handleSelectDevice(e, device.hostname)}
                    />
                  </td>
                  <td>{device.device_group}</td>
                  <td>{device.hostname}</td>
                  <td>{device.ip_address}</td>
                  <td>{device.location}</td>
                  <td>{device.backup_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            {currentPage > 1 && (
              <button onClick={handlePrevPage} className="pagination-button">Previous</button>
            )}
            {currentPage < totalPages && (
              <button onClick={handleNextPage} className="pagination-button">Next</button>
            )}
          </div>
        </div>
      )}

      {showDatePicker && (
        <div className="date-picker-container">
          <h2>Select a date and time</h2>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            showTimeSelect
            dateFormat="Pp"
          />
          <button onClick={handleScheduleBackupSubmit} className="schedule-submit-button">Schedule Backup</button>
        </div>
      )}
    </div>
  );
};

export default App;
