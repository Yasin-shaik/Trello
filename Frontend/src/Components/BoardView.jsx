import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext, SocketContext } from "../App";
import ListColumn from "./ListColumn";
import BoardHeader from "./BoardHeader";

const NewListForm = ({ boardId, lists, onListCreate, onCancel }) => {
  const { API_URL, user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const lastList = lists.length > 0 ? lists[lists.length - 1] : null;
    const newPosition = lastList ? lastList.position + 1000 : 1000;

    try {
      const token = user.token;
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.post(
        `${API_URL}/lists`,
        {
          title,
          boardId,
          position: newPosition,
        },
        { headers }
      );

      onListCreate(res.data);
      setTitle("");
      onCancel();
    } catch (err) {
      console.error("List creation error:", err);
      setError(err.response?.data?.message || "Failed to create column.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-shrink-0 w-78 bg-gray-200 rounded-lg p-3 shadow-md">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter list title..."
          className="w-full p-2 text-sm border border-gray-400 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          autoFocus
          required
        />
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150"
          >
            {loading ? "Adding..." : "Add List"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 p-1 rounded-md"
          >
            ✖️
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </form>
    </div>
  );
};

const BoardView = () => {
  const { boardId } = useParams();
  const { API_URL, user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewListForm, setShowNewListForm] = useState(false);

  const handleCardCreate = (newCard) => {
    const updatedCards = [...allCards, newCard].sort(
      (a, b) => a.position - b.position
    );
    setAllCards(updatedCards);
  };

  const fetchBoardData = async () => {
    if (!user || !boardId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = user.token;
      const headers = { Authorization: `Bearer ${token}` };

      const boardRes = await axios.get(`${API_URL}/boards/${boardId}`, {
        headers,
      });
      setBoard(boardRes.data);

      const listsRes = await axios.get(`${API_URL}/lists/${boardId}`, {
        headers,
      });
      const sortedLists = listsRes.data.sort((a, b) => a.position - b.position);
      setLists(sortedLists);

      const listIds = sortedLists.map((list) => list._id);
      let combinedCards = [];

      if (listIds.length > 0) {
        const cardPromises = listIds.map((id) =>
          axios.get(`${API_URL}/cards`, { headers, params: { listId: id } })
        );

        const cardsResponses = await Promise.all(cardPromises);

        combinedCards = cardsResponses.flatMap((res) => res.data);
      }

      const sortedCards = combinedCards.sort((a, b) => a.position - b.position);

      setAllCards(sortedCards);
      setFilteredCards(sortedCards);

      socket.emit("joinBoard", boardId);
    } catch (err) {
      console.error("Board data fetch error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load board data. Check membership."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [boardId, user, API_URL]);

  const handleListCreate = (newList) => {
    setLists((prevLists) =>
      [...prevLists, newList].sort((a, b) => a.position - b.position)
    );
  };

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    if (!lowerCaseSearchTerm) {
      setFilteredCards(allCards);
      return;
    }

    const results = allCards.filter((card) => {
      const matchesTitle = card.title
        .toLowerCase()
        .includes(lowerCaseSearchTerm);

      const matchesDescription = card.description
        ? card.description.toLowerCase().includes(lowerCaseSearchTerm)
        : false;

      const matchesLabel = Array.isArray(card.labels)
        ? card.labels.some((label) =>
            label.toLowerCase().includes(lowerCaseSearchTerm)
          )
        : false;

      return matchesTitle || matchesDescription || matchesLabel;
    });

    setFilteredCards(results);
  }, [searchTerm, allCards]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center h-178 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-indigo-600">Loading board...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-white">
        <p className="text-red-600">
          Error: {error || "Board not found or access denied."}
        </p>
      </div>
    );
  }

  const groupCardsByList = (cards) => {
    return cards.reduce((acc, card) => {
      const listId = card.listId?._id || card.listId;
      if (listId) {
        if (!acc[listId]) {
          acc[listId] = [];
        }
        acc[listId].push(card);
      }
      return acc;
    }, {});
  };
  const groupedCards = groupCardsByList(filteredCards);

  return (
    <div className="flex flex-col flex-grow h-178 bg-gray-50 pt-4">
      <div className="flex-shrink-0 sticky max-w-310 top-16 mx-4 bg-white z-50 shadow-md border-b border-gray-200">
        <BoardHeader board={board} onSearch={setSearchTerm} />
      </div>
      <div className="flex flex-grow overflow-x-auto p-4 custom-scrollbar">
        {lists.map((list) => (
          <ListColumn
            key={list._id}
            list={list}
            cards={groupedCards[list._id] || []}
            onCardCreate={handleCardCreate}
          />
        ))}

        {showNewListForm ? (
          <NewListForm
            boardId={boardId}
            lists={lists}
            onListCreate={handleListCreate}
            onCancel={() => setShowNewListForm(false)}
          />
        ) : (
          <div
            onClick={() => setShowNewListForm(true)}
            className="flex-shrink-0 w-80 bg-gray-200 rounded-lg p-3 mr-4 text-gray-600 flex items-center justify-start cursor-pointer hover:bg-gray-300 transition shadow-sm font-semibold"
          >
            + Add a List
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardView;
