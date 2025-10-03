const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'A comment cannot be empty'],
        trim: true,
        maxlength: [2000, 'Comment length cannot exceed 2000 characters']
    },
    authorId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A comment must have an author']
    },
    cardId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Card',
        required: [true, 'A comment must belong to a card']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', CommentSchema);
