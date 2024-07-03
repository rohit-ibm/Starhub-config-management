import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ListDevice.css';

const ListDevice = () => {
    const [backupDevices, setBackupDevices] = useState([
      { name: 'Device1', ip: '192.168.1.1', group: 'Group4', status: 'Success' },
      { name: 'Device2', ip: '192.168.1.2', group: 'Group3', status: 'Failed' },
      { name: 'Device3', ip: '192.168.1.3', group: 'Group1', status: 'Success' },
      { name: 'Device4', ip: '192.168.1.4', group: 'Group3', status: 'Pending' },
      { name: 'Device5', ip: '192.168.1.1', group: 'Group4', status: 'Success' },
      { name: 'Device6', ip: '192.168.1.2', group: 'Group3', status: 'Failed' },
      { name: 'Device7', ip: '192.168.1.3', group: 'Group1', status: 'Success' },
      { name: 'Device9', ip: '192.168.1.4', group: 'Group3', status: 'Pending' },
    ]);

    const handleDownloadAll = (deviceName) => {
      // Example files for each device
      const files = [
        { device: 'Device1', file: 'config1.txt' },
        { device: 'Device1', file: 'config2.txt' },
        { device: 'Device1', file: 'config3.txt' },
        { device: 'Device2', file: 'config4.txt' },
        { device: 'Device3', file: 'config5.txt' },
        // Add more files for each device as needed
      ];
  
      // Filter files for the selected device
      const deviceFiles = files.filter(file => file.device === deviceName);
  
      // Trigger download for each file
      deviceFiles.forEach(file => {
          const link = document.createElement('a');
          link.href = `/${file.file}`;
          link.download = file.file;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      };

    const [selectedDevices, setSelectedDevices] = useState([]);
  
    useEffect(() => {
      // Fetch data from an API if needed
      // Example:
      // fetch('/api/backup-devices')
      //   .then(response => response.json())
      //   .then(data => setBackupDevices(data))
      //   .catch(error => console.error('Error fetching backup devices:', error));
    }, []);

    /* const handleCheckboxChange = (deviceName) => {
      setSelectedDevices(prevSelected =>
        prevSelected.includes(deviceName)
          ? prevSelected.filter(name => name !== deviceName)
          : [...prevSelected, deviceName]
      );
    };
  
    const handleCompare = () => {
      // Logic for comparing two selected backups
      console.log('Selected devices for comparing two config files:', selectedDevices);
    }; */
  
    return (
      <div className="list-device">
        <h2>Select a device</h2>
        <table>
          <thead>
            <tr>
              <th>Device Name</th>
              <th>IP Address</th>
              <th>Device Group</th>
              <th>Backup Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {backupDevices.map((device, index) => (
              <tr key={index}>
                {/* <td>
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(device.name)}
                  onChange={() => handleCheckboxChange(device.name)}
                />
                </td> */}
                <td>
                  <Link to={`/compare-backup/${device.name}`}>{device.name}</Link>
                </td>
                <td>{device.ip}</td>
                <td>{device.group}</td>
                <td>{device.status}</td>
                <td>
                <button onClick={() => handleDownloadAll(device.name)}>
                  Download All
                </button>
              </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

export default ListDevice;
