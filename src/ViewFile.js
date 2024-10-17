import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ViewFile = () => {
  const { hostname, filename } = useParams();
  const [fileContent, setFileContent] = useState('');

  useEffect(() => {
    axios.get(`http://9.46.66.96:9000/config_files/view?hostname=${hostname}&filename=${filename}`)
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
