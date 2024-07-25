import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { diffWords } from 'diff';
import axios from 'axios';
import './CompareBackup.css';

const CompareBackup = () => {
  const { hostname } = useParams(); // Get the device name from the URL params
  const [backupFiles, setBackupFiles] = useState([]);
  const [filteredBackupFiles, setFilteredBackupFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [diffResult, setDiffResult] = useState(null);
  const [viewedFileContent, setViewedFileContent] = useState('');
  const [viewedFileName, setViewedFileName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5; // Adjust the number of files per page as needed

  useEffect(() => {
    // Fetch data from the API
    const fetchBackupFiles = async () => {
      try {
        const response = await axios.get(`http://9.46.112.167:5000/config_files/list?hostname=${hostname}`);
        setBackupFiles(response.data);
        setFilteredBackupFiles(response.data);
      } catch (error) {
        console.error('Error fetching backup files:', error);
      }
    };

    fetchBackupFiles();
  }, [hostname]);

  const handleCheckboxChange = (filename) => {
    setSelectedFiles((prevSelectedFiles) => {
      if (prevSelectedFiles.includes(filename)) {
        return prevSelectedFiles.filter((file) => file !== filename);
      } else if (prevSelectedFiles.length < 2) {
        return [...prevSelectedFiles, filename];
      } else {
        alert('You can only select up to 2 files.');
        return prevSelectedFiles;
      }
    });
  };

  const handleDisplaySelected = () => {
    const fileFetchPromises = selectedFiles.map((filename) => {
      return axios.get(`http://9.46.112.167:5000/config_files/view?hostname=${hostname}&filename=${filename}`)
        .then((response) => ({ [filename]: response.data }))
        .catch((error) => {
          console.error('Error fetching file content:', error);
          return { [filename]: '' }; // Return empty content on error
        });
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

  const handleView = (filename) => {
    axios.get(`http://9.46.112.167:5000/config_files/view?hostname=${hostname}&filename=${filename}`)
      .then((response) => {
        setViewedFileName(filename);
        setViewedFileContent(response.data);
        setDiffResult(null); // Clear diff result when viewing a file
      })
      .catch((error) => console.error('Error fetching file content:', error));
  };

  const handleDownload = (filename) => {
    axios({
      url: `http://9.46.112.167:5000/config_files/view?hostname=${hostname}&filename=${filename}`,
      method: 'GET',
      responseType: 'blob', // Important for downloading files
    })
      .then((response) => {
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

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    const filteredFiles = backupFiles.filter(file =>
      file.filename.toLowerCase().includes(term) || file.hostname.toLowerCase().includes(term)
    );
    setFilteredBackupFiles(filteredFiles);
    setCurrentPage(1); // Reset to first page after search
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredBackupFiles.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(filteredBackupFiles.length / filesPerPage);

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
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by hostname or filename"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">Search</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>File Name</th>
            <th>Hostname</th>
            <th>Last Modified</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentFiles.map((file, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.filename)}
                  onChange={() => handleCheckboxChange(file.filename)}
                  disabled={
                    !selectedFiles.includes(file.filename) &&
                    selectedFiles.length >= 2
                  }
                />
              </td>
              <td>{file.filename}</td>
              <td>{file.hostname}</td>
              <td>{new Date(file.last_modified).toLocaleString()}</td>
              <td>
                <button onClick={() => handleView(file.filename)} className="view-button">View</button>
                <button onClick={() => handleDownload(file.filename)} className="download-button">Download</button>
              </td>
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
      <button onClick={handleDisplaySelected} className="compare-button">Display and compare selected config files</button>
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
          <h3>Viewing content of {viewedFileName}</h3>
          <pre>{viewedFileContent}</pre>
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
        className="page-link"
      >
        {'<'}
      </button>
      <span className="page-number">{currentPage}</span>
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className="page-link"
      >
        {'>'}
      </button>
    </div>
  );
};

export default CompareBackup;
