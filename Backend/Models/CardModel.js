const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A card must have a title'],
        trim: true,
        maxlength: [500, 'Title cannot be more than 500 characters']
    },
    description: {
        type: String,
        default: ''
    },
    labels: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    assignees: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    dueDate: {
        type: Date,
        default: null
    },
    listId: {
        type: mongoose.Schema.ObjectId,
        ref: 'List',
        required: [true, 'A card must belong to a list']
    },
    position: {
        type: Number,
        required: [true, 'A card must have a position for ordering']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Card', CardSchema);
