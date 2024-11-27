import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { diffWords } from 'diff';
import config from './config.json';

const PAS_IP = config.PAS_IP;
const BACKEND_PORT = config.BACKEND_PORT;

const CompareFiles = () => {
  const { hostname } = useParams();
  const location = useLocation();
  const { selectedFiles } = location.state; // Passed from navigation state
  const [fileContents, setFileContents] = useState({});
  const [diffResult, setDiffResult] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      const fileFetchPromises = selectedFiles.map((filename) => {
        return axios.get(`http://${PAS_IP}:${BACKEND_PORT}/config_files/view?hostname=${hostname}&filename=${filename}`)
          .then((response) => ({ [filename]: response.data }))
          .catch((error) => {
            console.error('Error fetching file content:', error);
            return { [filename]: '' };
          });
      });

      Promise.all(fileFetchPromises).then((fileDataArray) => {
        const newFileContents = fileDataArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setFileContents(newFileContents);

        if (selectedFiles.length === 2) {
          const [file1, file2] = selectedFiles;
          const diff = diffWords(newFileContents[file1], newFileContents[file2]);
          setDiffResult(diff);
        }
      });
    };

    fetchFiles();
  }, [hostname, selectedFiles]);

  const renderDiff = (diff) => {
    const diff1 = [];
    const diff2 = [];

    diff.forEach((part) => {
      if (part.added) {
        diff2.push(<span style={{ backgroundColor: 'lightgreen' }}>{part.value}</span>);
      } else if (part.removed) {
        diff1.push(<span style={{ backgroundColor: 'salmon', textDecoration: 'line-through' }}>{part.value}</span>);
      } else {
        diff1.push(<span>{part.value}</span>);
        diff2.push(<span>{part.value}</span>);
      }
    });

    return [diff1, diff2];
  };

  return (
    <div className="compare-files">
      <h3>Comparing Files</h3>
      {diffResult && (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>{selectedFiles.map((file, index) => <th key={index}>{file}</th>)}</tr>
          </thead>
          <tbody>
            <tr>{renderDiff(diffResult).map((diffCol, index) => <td key={index}><pre>{diffCol}</pre></td>)}</tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CompareFiles;
