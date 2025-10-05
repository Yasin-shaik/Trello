import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App'; 
const NewCardForm = ({ listId, cards, onCardCreate, onCancel }) => {
    const { API_URL, user } = useContext(AuthContext);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        setError(null);
        const lastCard = cards.length > 0 ? cards[cards.length - 1] : null;
        const newPosition = lastCard ? lastCard.position + 1000 : 1000;
        try {
            const token = user.token;
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.post(`${API_URL}/cards`, 
                { 
                    title, 
                    listId,
                    position: newPosition
                },
                { headers }
            );
            onCardCreate(res.data); 
            setTitle("");
            onCancel();
        } catch (err) {
            console.error("Card creation error:", err);
            setError(err.response?.data?.message || 'Failed to create card.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-2">
            <form onSubmit={handleSubmit} className="space-y-2">
                <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for this card..."
                    rows="3"
                    className="w-full p-2 text-sm border border-gray-400 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-inner"
                    autoFocus
                    required
                />
                <div className="flex space-x-2">
                    <button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150"
                    >
                        {loading ? 'Adding...' : 'Add Card'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-600 hover:text-gray-800 p-1 rounded-md text-xl leading-none"
                    >
                        ✖️
                    </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </form>
        </div>
    );
};

export default function ListColumn({ list, cards, onCardCreate }) {
    const [showNewCardForm, setShowNewCardForm] = useState(false);
    const handleNewCard = (newCard) => {
        onCardCreate(newCard); 
    };
    return (
        <div className="flex-shrink-0 w-80 bg-gray-50 border border-gray-200 rounded-lg p-3 mr-4 shadow-md flex flex-col">
            <h3 className="text-gray-800 text-lg font-bold mb-3 truncate">
                {list.title} ({cards.length})
            </h3>
            <div className="flex-grow overflow-y-auto space-y-2 pr-1"> 
                {cards.map(card => (
                    <div key={card._id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-2 text-gray-800 text-sm cursor-pointer hover:shadow-md transition duration-150">
                        {card.title}
                        {card.labels && card.labels.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {card.labels.map((label, index) => (
                                    <span key={index} className="px-2 py-0.5 text-xs rounded bg-blue-500 text-white truncate">
                                        {label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {showNewCardForm && (
                    <NewCardForm
                        listId={list._id}
                        cards={cards}
                        onCardCreate={handleNewCard}
                        onCancel={() => setShowNewCardForm(false)}
                    />
                )}
            </div>
            {!showNewCardForm && (
                <button 
                    onClick={() => setShowNewCardForm(true)}
                    className="w-full text-left text-indigo-600 hover:text-indigo-800 cursor-pointer mt-2 p-1 text-sm font-medium transition duration-150 flex-shrink-0"
                >
                    + Add a card
                </button>
            )}
        </div>
    );
}
