import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from './config.json';

const PAS_IP = config.PAS_IP;
const BACKEND_PORT = config.BACKEND_PORT;

const ViewFile = () => {
  const { hostname, filename } = useParams();
  const [fileContent, setFileContent] = useState('');

  useEffect(() => {
    axios.get(`http://${PAS_IP}:${BACKEND_PORT}/config_files/view?hostname=${hostname}&filename=${filename}`)
      .then((response) => setFileContent(response.data))
      .catch((error) => console.error('Error fetching file content:', error));
  }, [hostname, filename]);

  return (
    <div className="view-file">
      <h3>Viewing content of {filename}</h3>
      <pre>{fileContent}</pre>
    </div>
  );
};

export default ViewFile;
