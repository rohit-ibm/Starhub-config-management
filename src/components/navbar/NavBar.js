import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import imageUrl from '../../Assets/IBM_LOGO.svg';
import './NavBar.css';
import { useAdmin } from '../../hooks/useAdmin';

const NavBar = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { isAdmin, isLoading, userName } = useAdmin();

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('userGroups');
        sessionStorage.removeItem('isAdmin');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userName');
        navigate('/login');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

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

    return (
        <div className='header'>
            <div className='logos-container'>
                <Link to="/"><img src={imageUrl} alt='IBM' /></Link>
            </div>
            <nav className='nav-links'>
                <Link to="/discovery-management" className='nav-item'>Discovery</Link>
                <Link to="/backup-management" className='nav-item'>Schedule</Link>
                <Link to="/list-device" className='nav-item'>Backup</Link>
                {isAdmin && (
                    <Link to="/user-profile-administrator" className='nav-item'>
                        User Profile Administrator
                    </Link>
                )}
                {/* <Link to="/user-profile-administrator" className='nav-item'>User Profile Administrator</Link> */}
            </nav>
            <div className="settings-container" ref={dropdownRef}>
                <button className="settings-button" onClick={toggleDropdown}>
                    <SettingsIcon />
                </button>
                {isDropdownOpen && (
                    <div className="dropdown">
                        <ul>
                            <li>Discovery Management</li>
                            <li>Schedule Management</li>
                            <li>Backup Management</li>
                            <li>User Profile Administrator</li>
                        </ul>
                    </div>
                )}
            </div>
            <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
    );
}

export default NavBar;