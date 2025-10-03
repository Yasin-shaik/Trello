const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A list must have a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    boardId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board',
        required: [true, 'A list must belong to a board']
    },
    position: {
        type: Number,
        required: [true, 'A list must have a position for ordering']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('List', ListSchema);
