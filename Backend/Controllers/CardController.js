const Card = require('../Models/CardModel');
const List = require('../Models/ListModel');
const Board = require('../Models/BoardModel');
const User = require('../Models/UserModel');
const mongoose = require('mongoose');

const checkBoardMembership = async (listId, userId) => {
    const list = await List.findById(listId);
    if (!list) return { board: null, isMember: false, message: 'Parent list not found.' };
    const board = await Board.findById(list.boardId);
    if (!board) return { board: null, isMember: false, message: 'Parent board not found.' };
    const isMember = board.members.some(memberId => memberId.equals(userId));
    return { board, isMember, message: isMember ? '' : 'Access denied. You are not a member of this board.' };
};

const createCard = async (req, res) => {
    const { title, listId, position } = req.body;
    const userId = req.user._id;
    if (!title || !listId) {
        return res.status(400).json({ message: 'Title and listId are required.' });
    }
    const { isMember, message } = await checkBoardMembership(listId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const card = await Card.create({
            title,
            listId,
            position: position || Date.now(),
        });
        res.status(201).json(card);

    } catch (error) {
        console.error('Error creating card:', error.message);
        res.status(500).json({ message: 'Server error creating card.' });
    }
};

const getCard = async (req, res) => {
    const cardId = req.params.id;
    const userId = req.user._id;
    try {
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const { isMember, message } = await checkBoardMembership(card.listId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const populatedCard = await Card.findById(cardId).populate('assignees', 'name avatar');
        res.status(200).json(populatedCard);
    } catch (error) {
        console.error('Error getting card:', error.message);
        res.status(500).json({ message: 'Server error getting card.' });
    }
};

const getCardsByList = async (req, res) => {
    const { listId } = req.query;
    const userId = req.user._id;
    if (!listId) {
        return res.status(400).json({ message: 'A listId query parameter is required.' });
    }
    const { isMember, message } = await checkBoardMembership(listId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const cards = await Card.find({ listId })
                                .sort({ position: 1 })
                                .populate('assignees', 'name avatar');
        res.status(200).json(cards);
    } catch (error) {
        console.error('Error getting cards by list:', error.message);
        res.status(500).json({ message: 'Server error getting cards.' });
    }
};

const updateCard = async (req, res) => {
    const cardId = req.params.id;
    const userId = req.user._id;
    const { title, description, dueDate } = req.body;
    try {
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const { isMember, message } = await checkBoardMembership(card.listId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        if (title !== undefined) card.title = title;
        if (description !== undefined) card.description = description;
        if (dueDate !== undefined) card.dueDate = dueDate;
        const updatedCard = await card.save();
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error updating card:', error.message);
        res.status(500).json({ message: 'Server error updating card.' });
    }
};

const deleteCard = async (req, res) => {
    const cardId = req.params.id;
    const userId = req.user._id;
    try {
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const { isMember, message } = await checkBoardMembership(card.listId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        await card.deleteOne();
        res.status(204).json({ message: 'Card deleted successfully.' });
    } catch (error) {
        console.error('Error deleting card:', error.message);
        res.status(500).json({ message: 'Server error deleting card.' });
    }
};

const moveCard = async (req, res) => {
    const { cardId, newListId, newPosition } = req.body;
    const userId = req.user._id;
    if (!cardId || !newListId || newPosition === undefined) {
        return res.status(400).json({ message: 'cardId, newListId, and newPosition are required.' });
    }
    try {
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const { isMember, message } = await checkBoardMembership(card.listId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        card.listId = newListId;
        card.position = newPosition;
        const movedCard = await card.save();
        res.status(200).json(movedCard);
    } catch (error) {
        console.error('Error moving card:', error.message);
        res.status(500).json({ message: 'Server error moving card.' });
    }
};

const toggleAssignee = async (req, res) => {
    const { cardId, assigneeId } = req.body;
    const userId = req.user._id;
    if (!cardId || !assigneeId) {
        return res.status(400).json({ message: 'cardId and assigneeId are required.' });
    }
    try {
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const { isMember, message } = await checkBoardMembership(card.listId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const assigneeObjectId = new mongoose.Types.ObjectId(assigneeId);
        const index = card.assignees.findIndex(id => id.equals(assigneeObjectId));
        if (index > -1) {
            card.assignees.splice(index, 1);
        } else {
            card.assignees.push(assigneeObjectId);
        }
        const updatedCard = await card.save();
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error toggling assignee:', error.message);
        res.status(500).json({ message: 'Server error toggling assignee.' });
    }
};

const toggleLabel = async (req, res) => {
    const { cardId, label } = req.body;
    const userId = req.user._id;
    if (!cardId || !label) {
        return res.status(400).json({ message: 'cardId and label are required.' });
    }
    try {
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const { isMember, message } = await checkBoardMembership(card.listId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const index = card.labels.indexOf(label);
        if (index > -1) {
            card.labels.splice(index, 1);
        } else {
            card.labels.push(label);
        }
        const updatedCard = await card.save();
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error toggling label:', error.message);
        res.status(500).json({ message: 'Server error toggling label.' });
    }
};

module.exports = {
    createCard,
    getCard,
    getCardsByList,
    updateCard,
    deleteCard,
    moveCard,
    toggleAssignee,
    toggleLabel
};
