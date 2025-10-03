const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A workspace must have a name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    // Optionally: Define permissions (e.g., 'private', 'public', 'org')
    type: {
        type: String,
        enum: ['private', 'public'],
        default: 'private'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
