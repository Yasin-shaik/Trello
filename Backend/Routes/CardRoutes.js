const express = require('express');
const {
    createCard,
    getCard,
    getCardsByList,
    updateCard,
    deleteCard,
    moveCard,
    toggleAssignee,
    toggleLabel
} = require('../Controllers/CardController');
const { protect } = require('../Middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);

router.put('/move', moveCard);         
router.put('/assign', toggleAssignee); 
router.put('/label', toggleLabel);    
router.post('/', createCard);
router.get('/', getCardsByList);
router.get('/:id', getCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

module.exports = router;
