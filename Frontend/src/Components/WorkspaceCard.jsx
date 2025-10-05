import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App'; 

const WorkspaceCard = ({ workspace }) => {
    const { API_URL, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const isPrivate = workspace.type === 'private';
    const icon = isPrivate ? '🔒' : '🌎';
    const bgColor = isPrivate ? 'bg-indigo-50' : 'bg-green-50';
    const borderColor = isPrivate ? 'border-indigo-300' : 'border-green-300';
    const textColor = isPrivate ? 'text-indigo-800' : 'text-green-800';
    const handleWorkspaceClick = async () => {
        setLoading(true);
        try {
            const token = user.token;
            const boardsRes = await axios.get(`${API_URL}/boards`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const workspaceBoards = boardsRes.data.filter(
                board => board.workspaceId?._id === workspace._id
            );
            if (workspaceBoards.length > 0) {
                const firstBoardId = workspaceBoards[0]._id;
                navigate(`/board/${firstBoardId}?workspaceId=${workspace._id}`); // <-- FINAL TARGET URL
            } else {
                navigate(`/boards?workspaceId=${workspace._id}`);
            }
        } catch (err) {
            console.error("Navigation error:", err);
            navigate(`/workspaces?workspaceId=${workspace._id}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={loading ? null : handleWorkspaceClick}
            className={`block ${bgColor} ${borderColor} p-6 rounded-xl shadow-md hover:shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-0.5 border-2 cursor-pointer h-full ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
            {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
            )} 
            <div className="flex items-start justify-between mb-4">
                <h3 className={`text-2xl font-extrabold truncate ${textColor}`}>
                    {workspace.name}
                </h3>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isPrivate ? 'bg-indigo-200' : 'bg-green-200'} whitespace-nowrap`}>
                    {icon} {workspace.type.toUpperCase()}
                </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                Created: {new Date(workspace.createdAt).toLocaleDateString()}
            </p>
            <div className="flex items-center space-x-6 text-gray-600">
                <div className="flex items-center space-x-1">
                    <span className="text-xl">👥</span>
                    <span className="font-semibold text-lg">{workspace.members.length}</span>
                    <span className="text-sm">Members</span>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-300">
                <span className="text-sm font-medium text-indigo-600 hover:underline">
                    {loading ? 'Loading Boards...' : 'View Boards →'}
                </span>
            </div>
        </div>
    );
};

export default WorkspaceCard;
