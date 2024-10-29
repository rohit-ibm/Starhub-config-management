import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import './NavBar.css';
import { useAdmin } from '../../hooks/useAdmin';
import PersonIcon from '@mui/icons-material/Person';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import imageUrl from '../../Assets/IBM_LOGO.svg';
import { Search, Schedule, Backup, Security } from '@mui/icons-material';

const NavBar = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isAdmin, isLoading, userName, hasRoleAccess } = useAdmin();

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('userGroups');
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userName');
        navigate('/login');
    };

    const toggleSettingsDropdown = () => {
        setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
    }

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    useEffect(() => {
        // Get the username from local storage
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername); // Set the username from local storage
        } else {
            setUsername(''); // Default to empty if not found
        }
    }, []);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (isLoading) {
        return (
            <div className='header'>
                <div className='logos-container'>
                    <img src={imageUrl} alt='IBM' />
                </div>
            </div>
        );
    }

    const hasDiscoveryAccess = isAdmin || hasRoleAccess('discovery');
    const hasScheduleAccess = isAdmin || hasRoleAccess('schedule');
    const hasBackupAccess = isAdmin || hasRoleAccess('backup');


    return (
        <div className='header'>
            <div className='logos-container'>
                <Link to="/"><img src={imageUrl} alt='IBM' /></Link>
            </div>
            <nav className='nav-links'>
                {hasDiscoveryAccess && (
                    <Link to="/discovery-management" className='nav-item'>
                        Discovery
                    </Link>
                )}
                {hasScheduleAccess && (
                    <Link to="/backup-management" className='nav-item'>
                        Schedule
                    </Link>
                )}
                {hasBackupAccess && (
                    <Link to="/list-device" className='nav-item'>
                        Backup
                    </Link>
                )}
                {isAdmin && (
                    <Link to="/user-profile-administrator" className='nav-item'>
                        User Profile Administrator
                    </Link>
                )}
            </nav>
            <div className="settings-profile-container">
                <div>
                    <button className="settings-button" onClick={toggleSettingsDropdown}>
                        <SettingsIcon size={34} />
                    </button>

                    {isSettingsDropdownOpen && (
                        <div className="dropdown settings-dropdown">
                            <ul>
                                <li>Discovery Management</li>
                                <li>Schedule Management</li>
                                <li>Backup Management</li>
                                <li>User Profile Administrator</li>
                            </ul>
                        </div>
                    )}
                </div>
                <div>
                    <button className="profile-button" onClick={toggleProfileDropdown}>
                        <PersonIcon size={34} />
                        {username && <span className="username">{username}</span>} {/* Display the username if it exists */}
                        <ArrowDropDownIcon size={34} /> {/* Down arrow icon */}
                    </button>

                    {isProfileDropdownOpen && (
                        <div className="dropdown profile-dropdown">
                            <ul>
                                <li onClick={handleLogout}>Logout</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
            
export default NavBar;