import React, { useState, useEffect } from 'react';
import { diffWords } from 'diff';
import './CompareBackup.css';

const CompareBackup = () => {
  const [backupFiles, setBackupFiles] = useState([
    { fileName: 'config1.txt', date: '2024-06-01', time: '10:00 AM' },
    { fileName: 'config2.txt', date: '2024-06-02', time: '11:00 AM' },
    { fileName: 'config3.txt', date: '2024-06-03', time: '12:00 PM' },
  ]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [diffResult, setDiffResult] = useState(null);
  const [viewedFileContent, setViewedFileContent] = useState('');
  const [viewedFileName, setViewedFileName] = useState('');

  useEffect(() => {
    // Fetch data from an API if needed
    // Example:
    // fetch('/api/backup-files')
    //   .then(response => response.json())
    //   .then(data => setBackupFiles(data))
    //   .catch(error => console.error('Error fetching backup files:', error));
  }, []);

  const handleCheckboxChange = (fileName) => {
    setSelectedFiles((prevSelectedFiles) => {
      if (prevSelectedFiles.includes(fileName)) {
        return prevSelectedFiles.filter((file) => file !== fileName);
      } else if (prevSelectedFiles.length < 2) {
        return [...prevSelectedFiles, fileName];
      } else {
        alert('You can only select up to 2 files.');
        return prevSelectedFiles;
      }
    });
  };

  const handleDisplaySelected = () => {
    const fileFetchPromises = selectedFiles.map((fileName) => {
      return fetch(`${process.env.PUBLIC_URL}/${fileName}`)
        .then((response) => response.text())
        .then((data) => ({ [fileName]: data }))
        .catch((error) => console.error('Error fetching file content:', error));
    });

    Promise.all(fileFetchPromises).then((fileDataArray) => {
      const newFileContents = fileDataArray.reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {});
      setFileContents(newFileContents);
      setViewedFileContent('');
      setViewedFileName('');

      if (selectedFiles.length === 2) {
        const [file1, file2] = selectedFiles;
        const diff = diffWords(newFileContents[file1], newFileContents[file2]);
        setDiffResult(diff);
      }
    });
  };

  const handleView = (fileName) => {
    fetch(`${process.env.PUBLIC_URL}/${fileName}`)
      .then((response) => response.text())
      .then((data) => {
        setViewedFileName(fileName);
        setViewedFileContent(data);
        setDiffResult(null); // Clear diff result when viewing a file
      })
      .catch((error) => console.error('Error fetching file content:', error));
  };

  const handleDownload = (fileName) => {
    const link = document.createElement('a');
    link.href = `${process.env.PUBLIC_URL}/${fileName}`;
    link.download = fileName;
    link.click();
  };

  const renderDiff = (diff) => {
    const diff1 = [];
    const diff2 = [];

    diff.forEach((part) => {
      if (part.added) {
        diff2.push(
          <span
            style={{
              backgroundColor: 'lightgreen',
            }}
          >
            {part.value}
          </span>
        );
      } else if (part.removed) {
        diff1.push(
          <span
            style={{
              backgroundColor: 'salmon',
              textDecoration: 'line-through',
            }}
          >
            {part.value}
          </span>
        );
      } else {
        diff1.push(<span>{part.value}</span>);
        diff2.push(<span>{part.value}</span>);
      }
    });

    return [diff1, diff2];
  };

  return (
    <div className="compare-backup">
      <h2>Compare Backup Files</h2>
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>File Name</th>
            <th>Date</th>
            <th>Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {backupFiles.map((file, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.fileName)}
                  onChange={() => handleCheckboxChange(file.fileName)}
                  disabled={
                    !selectedFiles.includes(file.fileName) &&
                    selectedFiles.length >= 2
                  }
                />
              </td>
              <td>{file.fileName}</td>
              <td>{file.date}</td>
              <td>{file.time}</td>
              <td>
                <button onClick={() => handleView(file.fileName)}>View</button>
                <button onClick={() => handleDownload(file.fileName)}>Download</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleDisplaySelected}>Display and compare selected config files</button>
      {diffResult && (
        <div className="file-contents">
          <h3>Selected File Contents</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                {selectedFiles.map((fileName, index) => (
                  <th key={index}>{fileName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {renderDiff(diffResult).map((diffColumn, index) => (
                  <td key={index}>
                    <pre>{diffColumn}</pre>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {viewedFileContent && !diffResult && (
        <div className="viewed-file-content">
          <h3>Viewing Content of {viewedFileName}</h3>
          <pre>{viewedFileContent}</pre>
        </div>
      )}
    </div>
  );
};

export default CompareBackup;
