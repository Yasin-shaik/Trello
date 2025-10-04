import React, { useState, useEffect, createContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const SOCKET_SERVER_URL = 'http://localhost:5000';

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false,
});

export const AuthContext = createContext();
export const SocketContext = createContext(socket);

const LoginPage = () => <div className="p-8 text-center text-xl text-gray-700">Login Page (Implement me)</div>;
const RegisterPage = () => <div className="p-8 text-center text-xl text-gray-700">Register Page (Implement me)</div>;
const Dashboard = () => <div className="p-8 text-center text-xl text-gray-700">Dashboard / Workspace List (Implement me)</div>;
const BoardView = ({ user }) => (
  <div className="p-8 text-center text-xl text-indigo-600">
    Welcome to the Board! User: {user?.name}
    <p className="text-sm text-gray-500">Socket Status: {socket.connected ? 'Connected' : 'Disconnected'}</p>
  </div>
);

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
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-indigo-600">Trello Clone</h1>
              {user ? (
                <button 
                  onClick={logout} 
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-150"
                >
                  Logout ({user.name})
                </button>
              ) : (
                <div className="space-x-4">
                  <a href="/login" className="text-indigo-600 hover:text-indigo-800">Login</a>
                  <a href="/register" className="text-indigo-600 hover:text-indigo-800">Register</a>
                </div>
              )}
            </header>
            <main className="p-4">
              <Routes>
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={user ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/board/:boardId" 
                  element={user ? <BoardView user={user} /> : <Navigate to="/login" />} 
                />
                <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
