const express = require('express');
const {
    createList,
    getListsByBoard,
    updateList,
    deleteList,
    reorderLists
} = require('../Controllers/ListController');
const { protect } = require('../Middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);

router.put('/reorder', reorderLists);
router.post('/', createList);
router.get('/:boardId', getListsByBoard);
router.put('/:id', updateList);
router.delete('/:id', deleteList);

module.exports = router;
