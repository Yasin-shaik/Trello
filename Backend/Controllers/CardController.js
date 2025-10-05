const Card = require('../Models/CardModel');
const Board = require('../Models/BoardModel');
const User = require('../Models/UserModel');
const List = require('../Models/ListModel');
const Comment = require('../Models/CommentModel');
const mongoose = require('mongoose');
const { getIo } = require('../socket');

const checkBoardMembership = async (boardId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(boardId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return { isMember: false, message: 'Invalid ID format provided.' };
    }
    try {
        const board = await Board.findById(boardId).select('members');
        if (!board) {
            return { isMember: false, message: 'Board not found.' };
        }
        const isMember = board.members.some(memberId => memberId.equals(userId));
        if (!isMember) {
            return { isMember: false, message: 'Authorization failed. User is not a member of this board.' };
        }
        return { isMember: true, message: 'Membership verified.' };
    } catch (error) {
        console.error('Error in checkBoardMembership:', error.message);
        return { isMember: false, message: 'Server error during membership verification.' };
    }
};

const checkCardAccess = async (cardId, userId) => {
    try {
        const card = await Card.findById(cardId).select('listId');
        if (!card) return { isMember: false, message: 'Card not found.' };
        const list = await List.findById(card.listId).select('boardId');
        if (!list) return { isMember: false, message: 'Parent list not found.' };
        const board = await Board.findById(list.boardId).select('members');
        if (!board) return { isMember: false, message: 'Parent board not found.' };
        const isMember = board.members.some(memberId => memberId.equals(userId));
        return { 
            isMember, 
            message: isMember ? 'Membership verified.' : 'Access denied. Must be a board member.',
            boardId: list.boardId
        };
    } catch (error) {
        console.error("Error checking card access:", error.message);
        return { isMember: false, message: 'Server error during membership check.' };
    }
};

const createCard = async (req, res) => {
    const userId = req.user._id;
    const { title, description, listId, position, labels } = req.body;
    if (!title || !listId) {
        return res.status(400).json({ message: 'Title and listId are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        return res.status(400).json({ message: 'Invalid list ID format.' });
    }
    try {
        const list = await List.findById(listId).select('boardId');
        if (!list) return res.status(404).json({ message: 'List not found.' });
        const board = await Board.findById(list.boardId);
        const isMember = board.members.some(memberId => memberId.equals(userId));
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied. You must be a board member to create cards.' });
        }
        const newCard = await Card.create({
            title,
            listId,
            description,
            position: position || Date.now(),
            labels,
            assignees: [userId]
        });
        res.status(201).json(newCard);
    } catch (error) {
        console.error('Error creating card:', error.message);
        res.status(500).json({ message: 'Server error creating card.' });
    }
};

const getCardsByList = async (req, res) => {
    const userId = req.user._id;
    const listId = req.query.listId;
    if (!listId) {
        return res.status(400).json({ message: 'listId query parameter is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        return res.status(400).json({ message: 'Invalid list ID format.' });
    }
    try {
        const list = await List.findById(listId).select('boardId');
        if (!list) return res.status(404).json({ message: 'List not found.' });
        const { isMember, message } = await checkBoardMembership(list.boardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const cards = await Card.find({ listId })
            .populate('assignees', 'name avatar')
            .sort({ position: 1 });
        res.status(200).json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error.message);
        res.status(500).json({ message: 'Server error fetching cards.' });
    }
};

const getCard = async (req, res) => {
    const userId = req.user._id;
    const cardId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        return res.status(400).json({ message: 'Invalid card ID format.' });
    }
    try {
        const { isMember, message } = await checkCardAccess(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const card = await Card.findById(cardId)
            .populate('assignees', 'name avatar');
        if (!card) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        res.status(200).json(card);
    } catch (error) {
        console.error('Error fetching card:', error.message);
        res.status(500).json({ message: 'Server error fetching card.' });
    }
};

const updateCard = async (req, res) => {
    const userId = req.user._id;
    const cardId = req.params.id;
    const { title, description, dueDate } = req.body;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        return res.status(400).json({ message: 'Invalid card ID format.' });
    }
    try {
        const { isMember, message, boardId } = await checkCardAccess(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        card.title = title !== undefined ? title : card.title;
        card.description = description !== undefined ? description : card.description;
        card.dueDate = dueDate !== undefined ? dueDate : card.dueDate;
        const updatedCard = await card.save();
        const io = getIo();
        io.to(boardId.toString()).emit('card:update', updatedCard);
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error updating card:', error.message);
        res.status(500).json({ message: 'Server error updating card.' });
    }
};

const deleteCard = async (req, res) => {
    const userId = req.user._id;
    const cardId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        return res.status(400).json({ message: 'Invalid card ID format.' });
    }
    try {
        const { isMember, message } = await checkCardAccess(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        await Comment.deleteMany({ cardId });
        await Card.deleteOne({ _id: cardId });
        const io = getIo();
        io.to(card.listId.toString()).emit('card:delete', { cardId });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting card:', error.message);
        res.status(500).json({ message: 'Server error deleting card.' });
    }
};

const moveCard = async (req, res) => {
    const userId = req.user._id;
    const { cardId, newListId, newPosition } = req.body;
    if (!cardId || !newListId || newPosition === undefined) {
        return res.status(400).json({ message: 'cardId, newListId, and newPosition are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        return res.status(400).json({ message: 'Invalid card ID format.' });
    }
    try {
        const { isMember, message, boardId } = await checkCardAccess(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        card.listId = newListId;
        card.position = newPosition;
        const updatedCard = await card.save();
        const io = getIo();
        io.to(boardId.toString()).emit('card:move', {
            cardId: updatedCard._id,
            newListId: updatedCard.listId,
            newPosition: updatedCard.position
        });
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error moving card:', error.message);
        res.status(500).json({ message: 'Server error moving card.' });
    }
};

const toggleAssignee = async (req, res) => {
    const userId = req.user._id;
    const { cardId, assigneeId } = req.body;
    if (!cardId || !assigneeId) {
        return res.status(400).json({ message: 'cardId and assigneeId are required.' });
    }
    try {
        const { isMember, message, boardId } = await checkCardAccess(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const assigneeObjectId = new mongoose.Types.ObjectId(assigneeId);
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const isAssigned = card.assignees.some(id => id.equals(assigneeObjectId));
        if (isAssigned) {
            card.assignees = card.assignees.filter(id => !id.equals(assigneeObjectId));
        } else {
            card.assignees.push(assigneeObjectId);
        }
        const updatedCard = await card.save();
        await updatedCard.populate('assignees', 'name avatar');
        const io = getIo();
        io.to(boardId.toString()).emit('card:update', updatedCard);
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error toggling assignee:', error.message);
        res.status(500).json({ message: 'Server error toggling assignee.' });
    }
};

const toggleLabel = async (req, res) => {
    const userId = req.user._id;
    const { cardId, label } = req.body;
    if (!cardId || !label) {
        return res.status(400).json({ message: 'cardId and label are required.' });
    }
    try {
        const { isMember, message, boardId } = await checkCardAccess(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const isLabeled = card.labels.includes(label);
        if (isLabeled) {
            card.labels = card.labels.filter(l => l !== label);
        } else {
            card.labels.push(label);
        }
        const updatedCard = await card.save();
        const io = getIo();
        io.to(boardId.toString()).emit('card:update', updatedCard);
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error toggling label:', error.message);
        res.status(500).json({ message: 'Server error toggling label.' });
    }
};

const addComment = async (req, res) => {
    const userId = req.user._id;
    const cardId = req.params.cardId;
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: 'Comment text is required.' });
    }
    try {
        const newComment = await Comment.create({
            text,
            authorId: userId,
            cardId: cardId
        });
        const populatedComment = await Comment.findById(newComment._id)
            .populate('authorId', 'name avatar');
        const { boardId } = await checkCardAccess(cardId, userId);
        const io = getIo();
        io.to(boardId.toString()).emit('comment:new', populatedComment);
        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('Error adding comment:', error.message);
        res.status(500).json({ message: 'Server error adding comment.' });
    }
};

const getComments = async (req, res) => {
    const cardId = req.params.cardId;
    try {
        const comments = await Comment.find({ cardId })
            .populate('authorId', 'name avatar')
            .sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ message: 'Server error fetching comments.' });
    }
};

const deleteComment = async (req, res) => {
    const userId = req.user._id;
    const commentId = req.params.commentId;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID.' });
    }
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        if (!comment.authorId.equals(userId)) {
            return res.status(403).json({ message: 'Access denied. Only the author can delete this comment.' });
        }
        const { boardId } = await checkCardAccess(comment.cardId, userId);
        await Comment.deleteOne({ _id: commentId });
        const io = getIo();
        io.to(boardId.toString()).emit('comment:delete', { commentId });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting comment:', error.message);
        res.status(500).json({ message: 'Server error deleting comment.' });
    }
};

module.exports = {
    createCard,
    getCardsByList,
    getCard,
    updateCard,
    deleteCard,
    moveCard,
    toggleAssignee,
    toggleLabel,
    addComment,
    getComments,
    deleteComment,
    checkCardAccess
};
