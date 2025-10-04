const express = require('express');
const { 
    createBoard, 
    listBoards, 
    getBoard, 
    updateBoard, 
    deleteBoard, 
    inviteMember 
} = require('../Controllers/BoardController');
const { protect } = require('../Middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', createBoard);
router.get('/', listBoards);
router.get('/:id', getBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);
router.post('/invite', inviteMember);

module.exports = router;
