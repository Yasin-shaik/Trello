const Card = require('../Models/CardModel');
const Board = require('../Models/BoardModel');
const User = require('../Models/UserModel');
const List = require('../Models/ListModel');
const Comment = require('../Models/CommentModel'); 
const mongoose = require('mongoose');

const checkBoardMembershipByCardId = async (cardId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        return { isMember: false, message: 'Invalid card ID format.' };
    }
    try {
        const card = await Card.findById(cardId).select('listId');
        if (!card) return { isMember: false, message: 'Card not found.' };
        const list = await List.findById(card.listId).select('boardId');
        if (!list) return { isMember: false, message: 'Parent list not found.' };
        const board = await Board.findById(list.boardId).select('members');
        if (!board) return { isMember: false, message: 'Parent board not found.' };
        const isMember = board.members.some(memberId => memberId.equals(userId));
        return { isMember, message: isMember ? 'Membership verified.' : 'Access denied. Must be a board member.' };
    } catch (error) {
        console.error("Error checking board membership:", error.message);
        return { isMember: false, message: 'Server error during membership check.' };
    }
};

const checkCardAccess = async (req, res, next) => {
    const cardId = req.params.cardId || req.params.id; 
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        return res.status(400).json({ message: 'Invalid card ID format.' });
    }
    try {
        const card = await Card.findById(cardId).select('listId');
        if (!card) return res.status(404).json({ message: 'Card not found.' });
        const list = await List.findById(card.listId).select('boardId');
        if (!list) return res.status(404).json({ message: 'Parent list not found for this card.' });
        const board = await Board.findById(list.boardId).select('members');
        if (!board) return res.status(404).json({ message: 'Parent board not found.' });
        const isMember = board.members.some(memberId => memberId.equals(userId));
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied. You must be a member of the board to perform this action.' });
        }
        req.card = card;
        req.boardId = board._id;
        next();
    } catch (error) {
        console.error('Error in card access middleware:', error.message);
        return res.status(500).json({ message: 'Server error during authorization check.' });
    }
};

const createCard = async (req, res) => {
    const userId = req.user._id;
    const { title, listId, position } = req.body;
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
            position: position || Date.now(),
            assignees: [userId]
        });
        res.status(201).json(newCard);
    } catch (error) {
        console.error('Error creating card:', error.message);
        res.status(500).json({ message: 'Server error creating card.' });
    }
};

const getCardsByList = async (req, res) => {
    const listId = req.query.listId;
    const userId = req.user._id;
    if (!listId) {
        return res.status(400).json({ message: 'listId query parameter is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        return res.status(400).json({ message: 'Invalid list ID format.' });
    }
    try {
        const list = await List.findById(listId).select('boardId');
        if (!list) return res.status(404).json({ message: 'List not found.' });
        const board = await Board.findById(list.boardId).select('members');
        const isMember = board.members.some(memberId => memberId.equals(userId));
        if (!isMember) {
            return res.status(403).json({ message: 'Access denied. You must be a board member to view these cards.' });
        }
        const cards = await Card.find({ listId }).sort({ position: 1 });
        res.status(200).json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error.message);
        res.status(500).json({ message: 'Server error fetching cards.' });
    }
};

const getCard = async (req, res) => {
    const cardId = req.params.id;
    const userId = req.user._id;
    const { isMember, message } = await checkBoardMembershipByCardId(cardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const card = await Card.findById(cardId).populate('assignees', 'name avatar');
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
    const cardId = req.params.id;
    const userId = req.user._id;
    const { isMember, message } = await checkBoardMembershipByCardId(cardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    const { title, description, dueDate } = req.body;
    try {
        const updatedCard = await Card.findByIdAndUpdate(
            cardId,
            { title, description, dueDate },
            { new: true, runValidators: true }
        );
        if (!updatedCard) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error updating card:', error.message);
        res.status(500).json({ message: 'Server error updating card.' });
    }
};

const deleteCard = async (req, res) => {
    const cardId = req.params.id;
    const userId = req.user._id;
    const { isMember, message } = await checkBoardMembershipByCardId(cardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const result = await Card.findByIdAndDelete(cardId);
        if (!result) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        await Comment.deleteMany({ cardId });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting card:', error.message);
        res.status(500).json({ message: 'Server error deleting card.' });
    }
};

const moveCard = async (req, res) => {
    const { cardId, newListId, newPosition } = req.body;
    const userId = req.user._id;
    if (!cardId || (!newListId && newPosition === undefined)) {
        return res.status(400).json({ message: 'Card ID and either a new List ID or a new position are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(cardId) || (newListId && !mongoose.Types.ObjectId.isValid(newListId))) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }
    try {
        const { isMember, message } = await checkBoardMembershipByCardId(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const updateFields = {};
        if (newListId) updateFields.listId = newListId;
        if (newPosition !== undefined) updateFields.position = newPosition;
        const updatedCard = await Card.findByIdAndUpdate(cardId, updateFields, { new: true });
        if (!updatedCard) {
            return res.status(404).json({ message: 'Card not found.' });
        }
        res.status(200).json(updatedCard);
    } catch (error) {
        console.error('Error moving card:', error.message);
        res.status(500).json({ message: 'Server error moving card.' });
    }
};

const toggleAssignee = async (req, res) => {
    const { cardId, assigneeId } = req.body;
    const userId = req.user._id;
    if (!cardId || !assigneeId) {
        return res.status(400).json({ message: 'Card ID and Assignee ID are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(cardId) || !mongoose.Types.ObjectId.isValid(assigneeId)) {
        return res.status(400).json({ message: 'Invalid ID format.' });
    }
    try {
        const { isMember, message } = await checkBoardMembershipByCardId(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const card = await Card.findById(cardId);
        if (!card) {
            return res.status(404).json({ message: 'Card not found.' });
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
        return res.status(400).json({ message: 'Card ID and label are required.' });
    }
    try {
        const { isMember, message } = await checkBoardMembershipByCardId(cardId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const card = await Card.findById(cardId);
        if (!card) {
            return res.status(404).json({ message: 'Card not found.' });
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

const getComments = async (req, res) => {
    const cardId = req.params.cardId;
    try {
        const comments = await Comment.find({ cardId }).populate('authorId', 'name avatar').sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ message: 'Server error fetching comments.' });
    }
};

const addComment = async (req, res) => {
    const cardId = req.params.cardId;
    const { text } = req.body;
    const authorId = req.user._id;
    if (!text) {
        return res.status(400).json({ message: 'Comment text cannot be empty.' });
    }
    try {
        const comment = await Comment.create({
            text,
            authorId,
            cardId,
        });
        const newComment = await comment.populate('authorId', 'name avatar');
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error.message);
        res.status(500).json({ message: 'Server error adding comment.' });
    }
};

const deleteComment = async (req, res) => {
    const commentId = req.params.commentId;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID format.' });
    }
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        if (!comment.authorId.equals(userId)) {
             return res.status(403).json({ message: 'Access denied. Only the comment author can delete it.' });
        }
        await Comment.deleteOne({ _id: commentId });
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
    moveCard,
    toggleAssignee,
    toggleLabel,
    deleteCard,
    checkCardAccess,
    getComments,
    addComment,
    deleteComment
};
