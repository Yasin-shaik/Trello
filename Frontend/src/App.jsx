import React, { useState, useEffect, createContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import Landing from './Pages/Landing';
import Navbar from './Components/Navbar';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Workspaces from './Pages/Workspaces';
import Boards from './Pages/Boards';

const API_URL = 'http://localhost:5000/api';
const SOCKET_SERVER_URL = 'http://localhost:5000';

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false,
});

export const AuthContext = createContext();
export const SocketContext = createContext(socket);

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const login = (userData) => {
    localStorage.setItem('userToken', userData.token);
    setUser(userData);
    socket.connect();
  };
  const logout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
    socket.disconnect();
  };
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        login({ ...res.data, token }); 
        setLoading(false);
      })
      .catch(() => {
        logout();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);
  const authContextValue = useMemo(() => ({ user, login, logout, API_URL }), [user]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-indigo-600">Loading User...</p>
      </div>
    );
  }
  return (
    <AuthContext.Provider value={authContextValue}>
      <SocketContext.Provider value={socket}>
        <Router>
          <div className="min-h-screen bg-gray-50 font-inter">
            {user && <Navbar/>}
            <main className={user ? "pt-16" : ""}>
              <Routes>
                <Route path="/" element={user ? <Navigate to="/workspaces" /> : <Landing/>} />
                <Route path="/login" element={user ? <Navigate to="/workspaces" /> : <Login/>} />
                <Route path="/register" element={user ? <Navigate to="/workspaces" /> : <Register/>} />
                <Route path="/workspaces" element={user ? <Workspaces/> : <Navigate to="/login" />} />
                <Route path='/boards' element={user ? <Boards/> : <Navigate to="/login"/>}></Route>
                <Route path="/board/:boardId" element={user ? <Boards /> : <Navigate to="/login" />} />


                // {/* <Route path="*" element={<Navigate to={user ? "/workspaces" : "/"} />} /> */}
              </Routes>
            </main>
          </div>
        </Router>
      </SocketContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
