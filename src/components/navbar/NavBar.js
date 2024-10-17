import React, { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import '../navbar/NavBar.css'
import { useNavigate } from 'react-router-dom';
import imageUrl from '../../Assets/IBM_LOGO.svg'
import { Search, Schedule, Backup, Security } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const NavBar = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    return (
        <>
            <div className='header'>
                <div className='logos-container'>
                    <Link to={"/"}><img src={imageUrl} alt='IBM' /></Link>
                    <div className='logo-group'>
                        <Link to={"/discovery-management"} className='dm-logo'>
                            <Search />
                        </Link>
                        <Link to={"/backup-management"} className='bm-logo'>
                            <Schedule />
                        </Link>
                        <Link to={"/list-device"} className='ld-logo'>
                            <Backup />
                        </Link>
                        <Link to={"/user-profile-administrator"} className='upa-logo'>
                            <Security />
                        </Link>
                    </div>
                </div>
                <div className="settings-container">
                    <button className="settings-button" onClick={toggleDropdown}>
                        <SettingsIcon size={34} />
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
        </>
    )
}

export default NavBar