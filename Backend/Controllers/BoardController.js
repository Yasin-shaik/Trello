const Board = require('../Models/BoardModel');
const Workspace = require('../Models/WorkSpaceModel');
const User = require('../Models/UserModel');
const ActivityLog = require('../Models/LogModel');
const Card = require('../Models/CardModel');
const mongoose = require('mongoose');

const checkWorkspaceMembership = async (workspaceId, userId) => {
    try {
        const workspace = await Workspace.findById(workspaceId).select('members');
        if (!workspace) {
            return { isMember: false, message: 'Workspace not found.' };
        }
        const isMember = workspace.members.some(memberId => memberId.equals(userId));
        return { isMember, message: isMember ? 'Membership verified.' : 'Access denied. Not a workspace member.' };
    } catch (error) {
        return { isMember: false, message: 'Server error during workspace membership check.' };
    }
};

const checkBoardMembership = async (boardId, userId) => {
    try {
        const board = await Board.findById(boardId).select('+members');
        if (!board) {
            return { board: null, isMember: false, message: 'Board not found.' };
        }
        const isMember = board.members.some(memberId => memberId.equals(userId));
        return { board, isMember, message: isMember ? 'Membership verified.' : 'Access denied. Not a board member.' };
    } catch (error) {
        return { board: null, isMember: false, message: 'Server error during board membership check.' };
    }
};

const createBoard = async (req, res) => {
    const userId = req.user._id;
    const { title, visibility, workspaceId } = req.body;
    if (!title || !workspaceId) {
        return res.status(400).json({ message: 'Title and workspaceId are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return res.status(400).json({ message: 'Invalid workspace ID format.' });
    }
    try {
        const { isMember, message } = await checkWorkspaceMembership(workspaceId, userId);
        if (!isMember) {
            return res.status(403).json({ message });
        }
        const newBoard = await Board.create({
            title,
            visibility: visibility || 'workspace',
            workspaceId,
            owner: userId,
            members: [userId]
        });
        await ActivityLog.create({
            type: 'BOARD_CREATE',
            actorId: userId,
            boardId: newBoard._id,
            metadata: { title: newBoard.title }
        });

        res.status(201).json(newBoard);
    } catch (error) {
        console.error('Error creating board:', error.message);
        res.status(500).json({ message: 'Server error creating board.' });
    }
};

const listBoards = async (req, res) => {
    const userId = req.user._id;

    try {
        const boards = await Board.find({ members: userId })
            .populate('owner', 'name avatar')
            .populate('workspaceId', 'name');
        res.status(200).json(boards);
    } catch (error) {
        console.error('Error listing boards:', error.message);
        res.status(500).json({ message: 'Server error listing boards.' });
    }
};

const getBoard = async (req, res) => {
    const boardId = req.params.id;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    const { board, isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const fullBoard = await Board.findById(boardId)
            .populate('owner', 'name avatar')
            .populate('members', 'name email avatar')
            .populate('workspaceId', 'name');
        res.status(200).json(fullBoard);
    } catch (error) {
        console.error('Error fetching board:', error.message);
        res.status(500).json({ message: 'Server error fetching board.' });
    }
};

const updateBoard = async (req, res) => {
    const userId = req.user._id;
    const boardId = req.params.id;
    const { title, visibility } = req.body;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    const { board, isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    if (!board.owner || !board.owner.equals(userId)) {
        return res.status(403).json({ message: 'Access denied. Only the board owner can update the board.' });
    }
    try {
        board.title = title || board.title;
        board.visibility = visibility || board.visibility;
        const updatedBoard = await board.save();
        await ActivityLog.create({
            type: 'BOARD_UPDATE',
            actorId: userId,
            boardId: updatedBoard._id,
            metadata: { title: updatedBoard.title }
        });
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
    const { board, isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    if (!board.owner || !board.owner.equals(userId)) {
        return res.status(403).json({ message: 'Access denied. Only the board owner can delete the board.' });
    }
    try {
        const result = await Board.findByIdAndDelete(boardId);
        if (!result) {
            return res.status(404).json({ message: 'Board not found.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting board:', error.message);
        res.status(500).json({ message: 'Server error deleting board.' });
    }
};

const inviteMember = async (req, res) => {
    const userId = req.user._id;
    const { boardId, invitedEmail } = req.body;
    if (!boardId || !invitedEmail) {
        return res.status(400).json({ message: 'Board ID and invited email are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    const { board, isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const invitedUser = await User.findOne({ email: invitedEmail }).select('_id name');
        if (!invitedUser) {
            return res.status(404).json({ message: 'User with that email not found.' });
        }
        if (board.members.some(memberId => memberId.equals(invitedUser._id))) {
            return res.status(400).json({ message: 'User is already a member of this board.' });
        }
        board.members.push(invitedUser._id);
        const updatedBoard = await board.save();
        await ActivityLog.create({
            type: 'MEMBER_INVITE',
            actorId: userId,
            boardId: boardId,
            metadata: { 
                invitedUserId: invitedUser._id,
                invitedUserName: invitedUser.name
            }
        });
        res.status(200).json(updatedBoard);
    } catch (error) {
        console.error('Error inviting member:', error.message);
        res.status(500).json({ message: 'Server error inviting member.' });
    }
};

const getBoardActivity = async (req, res) => {
    const boardId = req.params.id;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID.' });
    }
    const { isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const activities = await ActivityLog.find({ boardId })
            .populate('actorId', 'name avatar')
            .sort({ timestamp: -1 })
            .limit(20);
        res.status(200).json(activities);
    } catch (error) {
        console.error('Error fetching board activity:', error.message);
        res.status(500).json({ message: 'Server error fetching board activity.' });
    }
};

const searchBoardCards = async (req, res) => {
    const boardId = req.params.id;
    const userId = req.user._id;
    const searchQuery = req.query.q;
    if (!searchQuery) {
        return res.status(400).json({ message: 'Search query (q) is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: 'Invalid board ID format.' });
    }
    const { isMember, message } = await checkBoardMembership(boardId, userId);
    if (!isMember) {
        return res.status(403).json({ message });
    }
    try {
        const regex = new RegExp(searchQuery, 'i');
        const searchConditions = [
            { title: regex },
            { description: regex },
            { labels: regex },
        ];
        const matchingUsers = await User.find({
            $or: [
                { name: regex },
                { email: regex }
            ]
        }).select('_id');
        const matchingUserIds = matchingUsers.map(user => user._id);
        if (matchingUserIds.length > 0) {
            searchConditions.push({ assignees: { $in: matchingUserIds } });
        }
        const cards = await Card.find({
            listId: { $in: boardId }, 
            $or: searchConditions
        })
        .populate('assignees', 'name avatar')
        .sort({ position: 1 });
        const boardLists = await mongoose.model('List').find({ boardId }).select('_id');
        const listIds = boardLists.map(list => list._id);
        const finalCards = await Card.find({
            listId: { $in: listIds },
            $or: searchConditions
        })
        .populate('assignees', 'name avatar')
        .sort({ position: 1 });
        res.status(200).json(finalCards);
    } catch (error) {
        console.error('Error during card search:', error.message);
        res.status(500).json({ message: 'Server error during card search.' });
    }
};

module.exports = {
    createBoard,
    listBoards,
    getBoard,
    updateBoard,
    deleteBoard,
    inviteMember,
    getBoardActivity,
    searchBoardCards
};
