const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'An activity must have a type to categorize the action'],
        trim: true,
        uppercase: true
    },
    actorId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'An activity must have an actor']
    },
    boardId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board',
        required: [true, 'An activity must be associated with a board']
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
