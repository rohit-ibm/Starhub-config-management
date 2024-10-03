import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate,Switch } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateUser from './CreateUser';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/create-user" element={<CreateUser />} />
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard/discovery-management" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
