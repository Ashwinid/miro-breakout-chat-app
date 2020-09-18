const mongoose = require('mongoose');

const {Schema} = mongoose;

const chatMessageSchema = new Schema({
    roomId: String,
    fromUser: String,
    message: String,
}, {timestamps: {createdAt: true, updatedAt: false}, versionKey: false});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema, 'chatMessages');

module.exports = ChatMessage;