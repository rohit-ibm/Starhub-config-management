// import React, { useState, useEffect, useRef } from 'react';
// import SettingsIcon from '@mui/icons-material/Settings';
// import { useNavigate } from 'react-router-dom';
// import './Navbar.css';

// const Navbar = () => {
//   const navigate = useNavigate();
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

//   const handleClickOutside = (event) => {
//     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//       setIsDropdownOpen(false);
//     }
//   };

//   useEffect(() => {
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     navigate('/login');
//   };

//   return (
//     <nav className="navbar-container">
//       <div className="navbar">
//         <div className="logo-container">
//           <img src='https://9.46.67.25/assets/branding/images/logo.svg' alt='IBM' />
//         </div>

//         <div className="right-section">
//           <div className="settings-container" ref={dropdownRef}>
//             <button className="settings-button" onClick={toggleDropdown}>
//               <SettingsIcon size={34} />
//             </button>

//             {isDropdownOpen && (
//               <div className="dropdown">
//                 <ul>
//                   <li>Discovery Management</li>
//                   <li>Schedule Management</li>
//                   <li>Backup Management</li>
//                   <li>User Profile Administrator</li>
//                 </ul>
//               </div>
//             )}
//           </div>
//           <button onClick={handleLogout} className="logout-button">Logout</button>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
