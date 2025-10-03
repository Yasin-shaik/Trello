const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        // Exclude the password from being returned in query results by default
        select: false
    },
    avatar: {
        type: String,
        default: 'https://www.google.com/imgres?q=profile%20picture&imgurl=https%3A%2F%2Fwww.shutterstock.com%2Fimage-vector%2Fuser-profile-icon-vector-avatar-600nw-2558760599.jpg&imgrefurl=https%3A%2F%2Fwww.shutterstock.com%2Fsearch%2Fblank-profile-picture&docid=6PF0lYIppkG5DM&tbnid=zK2Sdy298j6AWM&vet=12ahUKEwiy6_Df14iQAxXMSnADHZ6tAgUQM3oECBkQAA..i&w=581&h=600&hcb=2&ved=2ahUKEwiy6_Df14iQAxXMSnADHZ6tAgUQM3oECBkQAA' // Default placeholder image
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
