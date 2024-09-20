import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ListDevice.css';

const ListDevice = () => {
  const [allDevices, setAllDevices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [deviceGroupDetails, setDeviceGroupDetails] = useState({ devices: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const devicesPerPage = 10; // Adjust the number of devices per page as needed

  const handleDownloadAll = (hostname) => {
    axios({
      url: `http://9.46.112.167:5000/config_files/downloadall?hostname=${hostname}`,
      method: 'GET',
      responseType: 'blob', // Important for downloading files
    })
      .then((response) => {
        // Construct the filename based on the hostname
        const filename = `${hostname}_backups.zip`;
  
        // Create a link element, set its href to a URL representing the blob, and click it
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename); // Set the file name for download
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link); // Clean up the DOM
      })
      .catch((error) => {
        console.error('Error downloading file:', error);
      });
  };
  

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
  }, []);

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
      device.device_group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.backup_status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDeviceGroupDetails({ devices: filteredDevices });
    setCurrentPage(1); // Reset to the first page after a search
  };

  const indexOfLastDevice = currentPage * devicesPerPage;
  const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
  const currentDevices = deviceGroupDetails.devices.slice(indexOfFirstDevice, indexOfLastDevice);
  const totalPages = Math.ceil(deviceGroupDetails.devices.length / devicesPerPage);

  return (
    <div className="container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by hostname, IP address or device group"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">Search</button>
      </div>
      <div className="list-device">
        <h2>Device Backup Information</h2>
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
            {currentDevices.length > 0 ? (
              currentDevices.map((device, index) => (
                <tr key={index}>
                  <td>
                    <Link to={`compare-backup/${device.hostname}`}>{device.hostname}</Link>
                  </td>
                  <td>{device.ip_address}</td>
                  <td>{device.device_group}</td>
                  <td>{device.backup_status}</td>
                  <td><button onClick={() => handleDownloadAll(device.hostname)} className="download-button">Download All</button></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No devices found.</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          handleNextPage={handleNextPage}
          handlePrevPage={handlePrevPage}
          totalPages={totalPages}
        />
      </div>
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

export default ListDevice;
