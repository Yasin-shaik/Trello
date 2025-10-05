import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import BoardCard from '../Components/BoardCard'; 

const CreateBoardForm = ({ workspaceId, onCreate, onCancel }) => {
    const { API_URL, user } = useContext(AuthContext);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [visibility, setVisibility] = useState('workspace'); 
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        setError('');
        try {
            const token = user.token;
            const res = await axios.post(`${API_URL}/boards`, 
                { title, workspaceId, visibility },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onCreate(res.data);
            setTitle('');
            setVisibility('workspace');
            onCancel(); 
        } catch (err) {
            console.error("Board creation error:", err);
            setError(err.response?.data?.message || 'Failed to create board.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="p-3 bg-gray-700/50 rounded-md">
            <h3 className="text-sm font-semibold mb-2 text-white/80">New Board</h3>
            <form onSubmit={handleSubmit} className="space-y-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Platform Launch"
                    className="w-full p-1.5 text-sm border-gray-500 rounded-md bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500"
                    required
                />
                 <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full p-1.5 text-sm border-gray-500 rounded-md bg-gray-800 text-white"
                    required
                >
                    <option value="workspace">👥 Workspace</option>
                    <option value="private">🔒 Private</option>
                    <option value="public">🌎 Public</option>
                </select>
                <div className="flex justify-between space-x-2">
                    <button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="flex-1 bg-indigo-600 text-white py-1 rounded-md text-sm font-medium hover:bg-indigo-700 transition disabled:bg-gray-500"
                    >
                        {loading ? 'Creating...' : 'Add Board'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-500 text-white py-1 px-3 rounded-md text-sm font-medium hover:bg-gray-600 transition"
                    >
                        Close
                    </button>
                </div>
                {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
            </form>
        </div>
    );
};

const BoardList = () => {
    const { API_URL, user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const workspaceId = searchParams.get('workspaceId'); 
    const [boards, setBoards] = useState([]);
    const [workspaceName, setWorkspaceName] = useState("Loading...");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const urlParts = window.location.pathname.split('/');
    const selectedBoardId = urlParts[1] === 'board' ? urlParts[2] : null;
    const fetchData = async () => {
        if (!user || !workspaceId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const token = user.token;
            const boardsRes = await axios.get(`${API_URL}/boards`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const workspacesRes = await axios.get(`${API_URL}/workspaces`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const currentWorkspace = workspacesRes.data.find(ws => ws._id === workspaceId);
            if (currentWorkspace) {
                setWorkspaceName(currentWorkspace.name);
            }
            const workspaceBoards = boardsRes.data.filter(board => board.workspaceId._id === workspaceId);
            setBoards(workspaceBoards);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError('Failed to load boards and workspace details.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [workspaceId, user]);
    const handleNewBoard = (newBoard) => {
        setBoards(prev => [...prev, newBoard]);
    };
    if (!workspaceId) {
        return <div className="p-4 text-center">Please select a workspace to view its boards.</div>;
    }
    if (loading) {
        return (
            <div className="min-h-screen w-64 bg-gray-900 text-white flex flex-col p-4 shadow-2xl">
                <p className="text-sm text-center text-white/70 mt-4">Loading Boards...</p>
            </div>
        );
    }
    if (error) {
        return <div className="min-h-screen w-64 bg-gray-900 text-red-300 p-4">Error: {error}</div>;
    }
    return (
        <div className="min-w-64 max-h-178 bg-white text-gray-900 flex flex-col p-4 shadow-2xl overflow-y-auto">
            <div className="text-lg font-bold border-b border-gray-700 pb-4 mb-4">
                {workspaceName}
            </div>
            <div className="flex-grow space-y-1">
                <h3 className="text-xs font-semibold uppercase text-gray-900 mb-3">
                    ALL BOARDS ({boards.length})
                </h3>
                <div className="space-y-1.5">
                    {boards.map(board => (
                        <BoardCard 
                            key={board._id} 
                            board={board} 
                            isActive={board._id === selectedBoardId}
                        />
                    ))}
                </div>
            </div>
            <div className="mt-4 flex-shrink-0">
                {showForm ? (
                    <CreateBoardForm 
                        workspaceId={workspaceId} 
                        onCreate={handleNewBoard}
                        onCancel={() => setShowForm(false)}
                    />
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full text-left flex items-center p-2 rounded-lg text-sm font-semibold text-gray-400 hover:bg-gray-800 transition duration-150"
                    >
                        <span className="text-xl mr-2 text-indigo-400">
                            ➕
                        </span>
                        Create New Board
                    </button>
                )}
            </div>
        </div>
    );
};

export default BoardList;