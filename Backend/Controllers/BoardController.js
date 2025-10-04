const Board = require('../Models/BoardModel');
const Workspace = require('../Models/WorkSpaceModel');
const User = require('../Models/UserModel');
const mongoose = require('mongoose');

const isMember = (board, userId) => {
    return board.members.some(memberId => memberId.equals(userId));
};

const createBoard = async (req, res) => {
    const { title, visibility, workspaceId } = req.body;
    const userId = req.user._id;
    if (!title || !workspaceId) {
        return res.status(400).json({ message: 'Title and workspaceId are required.' });
    }
    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found.' });
        }
        const isWorkspaceMember = workspace.members.some(memberId => memberId.equals(userId));
        if (!isWorkspaceMember) {
            return res.status(403).json({ 
                message: 'You must be a member of the parent workspace to create a board.' 
            });
        }
        const board = await Board.create({
            title,
            visibility,
            workspaceId,
            owner: userId,  
            members: [userId],
        });
        res.status(201).json(board);
    } catch (error) {
        console.error('Error creating board:', error.message);
        res.status(500).json({ message: 'Server error creating board.' });
    }
};

const listBoards = async (req, res) => {
    const userId = req.user._id;
    try {
        const boards = await Board.find({
            members: userId
        })
        .populate('workspaceId', 'name')
        .select('-members');
        res.status(200).json(boards);
    } catch (error) {
        console.error('Error listing boards:', error.message);
        res.status(500).json({ message: 'Server error listing boards.' });
    }
};

const getBoard = async (req, res) => {
    const userId = req.user._id;
    const boardId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    try {
        const board = await Board.findById(boardId)
                                 .populate('members', 'name email avatar')
                                 .populate('workspaceId', 'name');
        if (!board) {
            return res.status(404).json({ message: 'Board not found.' });
        }
        if (!isMember(board, userId)) {
            return res.status(403).json({ message: 'Access denied. You are not a member of this board.' });
        }
        res.status(200).json(board);
    } catch (error) {
        console.error('Error fetching board:', error.message);
        res.status(500).json({ message: 'Server error fetching board.' });
    }
};

const updateBoard = async (req, res) => {
    const userId = req.user._id;
    const boardId = req.params.id;
    const { title, visibility, background } = req.body; 
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    try {
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found.' });
        }
        if (!board.owner || !board.owner.equals(userId)) {
            return res.status(403).json({ 
                message: 'Access denied. Only the board owner can update the board.' 
            });
        }
        if (title !== undefined) board.title = title;
        if (visibility !== undefined) board.visibility = visibility;
        if (background !== undefined) board.background = background;
        const updatedBoard = await board.save();
        res.status(200).json(updatedBoard);
    } catch (error) {
        console.error('Error updating board:', error.message);
        res.status(500).json({ message: 'Server error updating board.' });
    }
};

const deleteBoard = async (req, res) => {
    const userId = req.user._id;
    const boardId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    try {
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(204).json({});
        }
        if (!board.owner.equals(userId)) {
            return res.status(403).json({ message: 'Access denied. Only the board owner can delete the board.' });
        }
        await Board.deleteOne({ _id: boardId });
        res.status(204).json({message: 'Deleted Successfully.'});
    } catch (error) {
        console.error('Error deleting board:', error.message);
        res.status(500).json({ message: 'Server error deleting board.' });
    }
};

const inviteMember = async (req, res) => {
    const { boardId, invitedEmail } = req.body;
    const inviterId = req.user._id;
    if (!boardId || !invitedEmail) {
        return res.status(400).json({ message: 'boardId and invitedEmail are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    try {
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found.' });
        }
        if (!isMember(board, inviterId)) {
            return res.status(403).json({ message: 'Access denied. You must be a member of the board to invite others.' });
        }
        const invitedUser = await User.findOne({ email: invitedEmail });
        if (!invitedUser) {
            return res.status(404).json({ message: 'User with that email not found.' });
        }
        const invitedUserId = invitedUser._id;
        if (isMember(board, invitedUserId)) {
            return res.status(400).json({ message: `${invitedEmail} is already a member of this board.` });
        }
        board.members.push(invitedUserId);
        const updatedBoard = await board.save();
        res.status(200).json({
            message: `${invitedEmail} invited successfully.`,
            board: updatedBoard
        });
    } catch (error) {
        console.error('Error inviting member:', error.message);
        res.status(500).json({ message: 'Server error inviting member.' });
    }
};

module.exports = {
    createBoard,
    listBoards,
    getBoard,
    updateBoard,
    deleteBoard,
    inviteMember,
};
