import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RemoteCollector.css';
import config from './config.json';

const PAS_IP = config.PAS_IP;
const BACKEND_PORT = config.BACKEND_PORT;

const RemoteCollector = () => {
  const [collectors, setCollectors] = useState([]);
  const [filteredCollectors, setFilteredCollectors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [hostIP, setHostIP] = useState('');

  // Fetch collector details
  const fetchCollectors = () => {
    axios.get(`http://${PAS_IP}:${BACKEND_PORT}/collector_details`)
      .then(response => {
        setCollectors(response.data);
        setFilteredCollectors(response.data);
      })
      .catch(error => {
        console.error("Error fetching collector details:", error);
      });
  };

  // Initial data load
  useEffect(() => {
    fetchCollectors();
  }, []);

  const handleDiscover = () => {
    if (!hostIP) {
      alert("Please enter a valid Host IP address.");
      return;
    }

    const healthApiUrl = `http://${hostIP}/health`;

    // Check health status
    axios.get(healthApiUrl)
      .then(healthResponse => {
        if (healthResponse.status === 200) {
          // If health check is successful, proceed to POST request
          const postData = {
            vendor: selectedVendor || undefined,
            collector_ip: hostIP || undefined,
          };

          axios.post(`http://${PAS_IP}:${BACKEND_PORT}/collector_details`, postData)
            .then(postResponse => {
              if (postResponse.status === 200) {
                alert('Discover operation successful!');
                // Re-fetch collector details to update the table
                fetchCollectors();
              } else {
                alert('Discover operation failed. Please try again.');
              }
            })
            .catch(error => {
              console.error("Error posting collector details:", error);
              alert('An error occurred during the Discover operation.');
            });
        } else {
          alert("Collector is not healthy.");
        }
      })
      .catch(error => {
        console.error("Error checking health status:", error);
        alert("Collector is not healthy.");
      });
  };

  return (
    <div className="container">
      <h2 className="title">Remote Collector</h2>
      <div className="controls-container">
        <div className="input-group">
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="vendor-dropdown"
          >
            <option value="">Select Vendor</option>
            <option value="cisco">cisco</option>
            <option value="juniper">juniper</option>
            <option value="linux">linux</option>
          </select>
          <input
            type="text"
            placeholder="Host IP address"
            value={hostIP}
            onChange={(e) => setHostIP(e.target.value)}
            className="ip-input"
          />
          <button onClick={handleDiscover} className="discover-button">
            Discover
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="tableHeader">Hostname</th>
              <th className="tableHeader">Vendor</th>
              <th className="tableHeader">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredCollectors.map((collector, index) => (
              <tr key={index}>
                <td className="tableCell">{collector.hostname}</td>
                <td className="tableCell">{collector.vendor}</td>
                <td className="tableCell">
                  {collector.backup_collector_details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RemoteCollector;
