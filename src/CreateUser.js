// src/components/CreateUserForm.js
import React, { useState } from 'react';

const CreateUserForm = ({ onCreateUser, onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateUser(username, password, email);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="input-group">
                <label>Username:</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="popup-buttons">
                <button type="submit" className="btn-confirm">Create User</button>
                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
        </form>
    );
};

export default CreateUserForm;

