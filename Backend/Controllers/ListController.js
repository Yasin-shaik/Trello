const List = require('../Models/ListModel');
const Board = require('../Models/BoardModel');
const mongoose = require('mongoose');

const checkBoardMembership = async (boardId, userId) => {
    const board = await Board.findById(boardId);
    if (!board) return { board: null, isMember: false, message: 'Parent board not found.' };
    const isMember = board.members.some(memberId => memberId.equals(userId));
    return { board, isMember, message: isMember ? '' : 'Access denied. You are not a member of this board.' };
};

const createList = async (req, res) => {
    const { title, boardId, position } = req.body;
    const userId = req.user._id;
    if (!title || !boardId) {
        return res.status(400).json({ message: 'Title and boardId are required.' });
    }
    const { isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const list = await List.create({
            title,
            boardId,
            position: position || Date.now(),
        });
        res.status(201).json(list);
    } catch (error) {
        console.error('Error creating list:', error.message);
        res.status(500).json({ message: 'Server error creating list.' });
    }
};

const getListsByBoard = async (req, res) => {
    const boardId = req.params.boardId;
    const userId = req.user._id;
    const { isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const lists = await List.find({ boardId }).sort({ position: 1 });
        res.status(200).json(lists);
    } catch (error) {
        console.error('Error getting lists:', error.message);
        res.status(500).json({ message: 'Server error getting lists.' });
    }
};

const updateList = async (req, res) => {
    const listId = req.params.id;
    const userId = req.user._id;
    const { title } = req.body;
    try {
        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ message: 'List not found.' });
        const { isMember, message } = await checkBoardMembership(list.boardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        if (title !== undefined) list.title = title;
        const updatedList = await list.save();
        res.status(200).json(updatedList);
    } catch (error) {
        console.error('Error updating list:', error.message);
        res.status(500).json({ message: 'Server error updating list.' });
    }
};

const deleteList = async (req, res) => {
    const listId = req.params.id;
    const userId = req.user._id;
    try {
        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ message: 'List not found.' });
        const { isMember, message } = await checkBoardMembership(list.boardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        await list.deleteOne();
        res.status(204).json({ message: 'List deleted successfully.' });
    } catch (error) {
        console.error('Error deleting list:', error.message);
        res.status(500).json({ message: 'Server error deleting list.' });
    }
};

const reorderLists = async (req, res) => {
    const updates = req.body.updates; 
    const userId = req.user._id;
    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty array of updates provided.' });
    }
    try {
        const firstList = await List.findById(updates[0].id);
        if (!firstList) {
            return res.status(404).json({ message: 'First list ID in the update array not found.' });
        }
        const { isMember, message } = await checkBoardMembership(firstList.boardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const bulkOperations = updates.map(update => ({
            updateOne: {
                filter: { _id: update.id, boardId: firstList.boardId },
                update: { $set: { position: update.position } }
            }
        }));
        const result = await List.bulkWrite(bulkOperations);
        res.status(200).json({ 
            message: 'Lists reordered successfully.',
            modifiedCount: result.modifiedCount 
        });
    } catch (error) {
        console.error('Error reordering lists:', error.message);
        res.status(500).json({ message: 'Server error reordering lists.' });
    }
};

module.exports = {
    createList,
    getListsByBoard,
    updateList,
    deleteList,
    reorderLists
};
