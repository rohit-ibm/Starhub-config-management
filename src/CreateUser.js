// src/components/CreateUserForm.js
import React, { useState } from 'react';

const CreateUserForm = ({ onCreateUser, onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateUser(username, password, email); // Call the parent function to create user
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












// // src/components/CreateUser.js
// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import './CreateUser.css';
// import rbacImg from './RBAC.jpg';

// const CreateUser = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [email, setEmail] = useState('');
//   const [message, setMessage] = useState('');
//   const [isError, setIsError] = useState(false);
//   const navigate = useNavigate();

//   const handleCreateUser = () => {
//     axios.post('http://9.46.112.167:8001/create_user', {
//       username,
//       password,
//       email
//     })
//     .then(response => {
//       setMessage('User created successfully!');
//       setIsError(false);
//       setTimeout(() => {
//         navigate('/'); // Redirect to the main page after creation
//       }, 2000);
//     })
//     .catch(error => {
//       setMessage('There was an error creating the user.');
//       setIsError(true);
//     });
//   };

//   return (
//     <div className="create">
//       <div class='user-form'>
//         <div class="create-user"> 
//         <h2>Create User</h2>
//         <div className="form-group">
//           <label>Username:</label>
//           <input
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//           />
//         </div>
//         <div className="form-group">
//           <label>Password:</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//         </div>
//         <div className="form-group">
//           <label>Email:</label>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />
//         </div>
//         <button onClick={handleCreateUser}>Create User</button>
//         {message && (
//           <div className={`message ${isError ? 'error' : 'success'}`}>
//             {message}
//           </div>
//         )}
//         </div>
//       </div>
//       <div class="create-rbac-bg">
//       <img src={rbacImg} alt="Device Loader" />
//       </div>
//     </div>
//   );
// };

// export default CreateUser;
