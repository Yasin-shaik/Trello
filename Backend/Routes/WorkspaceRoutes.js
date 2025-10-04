const express = require('express');
const { 
    createWorkspace, 
    listWorkspaces,
    joinWorkspace
} = require('../Controllers/WorkspaceController');
const { protect } = require('../Middleware/AuthMiddleware');

const router = express.Router();
router.use(protect); 
router.post('/', createWorkspace);
router.get('/', listWorkspaces);
router.post('/join', joinWorkspace);

module.exports = router;
