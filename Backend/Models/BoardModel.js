const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A board must have a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A board must have an owner.']
    },
    visibility: {
        type: String,
        enum: ['private', 'workspace', 'public'], // Common Trello visibility options
        default: 'workspace',
        required: true
    },
    workspaceId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Workspace',
        required: [true, 'A board must belong to a workspace']
    },
    members: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    background: {
        type: String,
        default: '#0079bf' // Trello's signature blue color
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Board', BoardSchema);
