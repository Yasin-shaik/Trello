import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center fixed top-0 w-full z-10">
            <Link to={"/"} className="text-2xl font-bold text-indigo-600 hover:text-indigo-800 transition duration-150">
                Trello by Scaler
            </Link>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-700 font-medium">Hello, {user.name}</span>
                    <button 
                        onClick={()=>{navigate("/"); logout();}} 
                        className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-150"
                    >
                        Logout
                    </button>
                </div>
        </header>
    );
};

export default Navbar;