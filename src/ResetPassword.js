import React, { useState } from 'react';
import config from './config.json';

const PAS_IP = config.PAS_IP;
const RBAC_PORT = config.RBAC_PORT;

const ResetPassword = ({ users }) => {
    const [userId, setUserId] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            user_id: parseInt(userId),
            new_password: newPassword
        };

        try {
            const response = await fetch(`http://${PAS_IP}:${RBAC_PORT}/reset_password`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setMessage('Password reset successfully');
                setUserId('');
                setNewPassword('');
            } else {
                const errorData = await response.json();
                setMessage(`Error: ${errorData.message}`);
            }
        } catch (error) {
            setMessage('Error resetting password');
        }
    };

    return (
        <div>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="user">Select User:</label>
                    <select
                        id="user"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        required
                    >
                        <option value="">--Select User--</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="newPassword">New Password:</label>
                    <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Reset Password</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
};

export default ResetPassword;
