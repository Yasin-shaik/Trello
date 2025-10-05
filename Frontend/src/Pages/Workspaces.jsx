import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import WorkspaceCard from '../Components/WorkspaceCard';

const CreateWorkspaceForm = ({ onCreate }) => {
    const { API_URL, user } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [type, setType] = useState('private'); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        setError('');
        try {
            const token = user.token;
            const res = await axios.post(`${API_URL}/workspaces`, 
                { name, type },
                { 
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            onCreate(res.data.workspace); 
            setName('');
            setType('private');
            setShowForm(false);
        } catch (err) {
            console.error("Workspace creation error:", err);
            setError(err.response?.data?.message || 'Failed to create workspace.');
        } finally {
            setLoading(false);
        }
    };
    const handleClose = () => {
        setName('');
        setType('private');
        setError(null);
        setShowForm(false);
    }
    return (
        <div className="mb-8 text-center">
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 transform hover:scale-[1.02]"
                >
                    + Create New Workspace
                </button>
            ) : (
                <div className="inline-block p-4 bg-white border border-indigo-200 rounded-lg shadow-xl max-w-sm w-full">
                    <h3 className="text-xl font-bold mb-3 text-indigo-600">New Workspace</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter workspace name"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                                Visibility
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="private">🔒 Private (Only members can see)</option>
                                <option value="public">🌎 Public (Anyone with link can join)</option>
                            </select>
                        </div>
                        <div className="flex justify-between space-x-2 pt-2">
                            <button
                                type="submit"
                                disabled={loading || !name.trim()}
                                className="flex-1 bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition disabled:bg-gray-400"
                            >
                                {loading ? 'Saving...' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-semibold hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </form>
                </div>
            )}
        </div>
    );
};

const Workspaces = () => {
    const { API_URL, user } = useContext(AuthContext);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchWorkspaces = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = user.token;
            const res = await axios.get(`${API_URL}/workspaces`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(res);
            setWorkspaces(res.data);

        } catch (err) {
            console.error("Error fetching workspaces:", err);
            setError(err.response?.data?.message || 'Failed to load workspaces.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchWorkspaces();
    }, [user]);
    const handleNewWorkspace = (newWorkspace) => {
        setWorkspaces(prev => [...prev, newWorkspace]);
    };
    if (loading) {
        return (
            <div className="text-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-3 text-indigo-600">Loading workspaces...</p>
            </div>
        );
    }
    if (error) {
        return <div className="text-center p-12 text-red-600 bg-red-50 border border-red-300 rounded-lg">Error: {error}</div>;
    }
    return (
        <div className="p-4 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Workspaces</h1>
            <CreateWorkspaceForm onCreate={handleNewWorkspace} />
            <div className="space-y-10">
                {workspaces.length > 0 ? (
                    workspaces.map(workspace => (
                      <div key={workspace._id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                          <WorkspaceCard workspace={workspace} /> 
                          <hr className="my-6 border-gray-200" /> 
                      </div>
                  ))
                ) : (
                    <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <p className="text-gray-500 text-lg">You are not a member of any workspaces yet.</p>
                        <p className="text-gray-500 text-sm mt-1">Use the "Create New Workspace" button above to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Workspaces;