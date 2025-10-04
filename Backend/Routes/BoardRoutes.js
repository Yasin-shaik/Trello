const express = require('express');
const { 
    createBoard, 
    listBoards, 
    getBoard, 
    updateBoard, 
    deleteBoard, 
    inviteMember,
    getBoardActivity,
    searchBoardCards
} = require('../Controllers/BoardController');
const { protect } = require('../Middleware/AuthMiddleware');

const router = express.Router();

router.use(protect); 

router.post('/invite', inviteMember);
router.get('/:id/search', searchBoardCards); 
router.get('/:id/activity', getBoardActivity); 
router.route('/').post(createBoard).get(listBoards);
router.route('/:id').get(getBoard).put(updateBoard).delete(deleteBoard);

module.exports = router;
