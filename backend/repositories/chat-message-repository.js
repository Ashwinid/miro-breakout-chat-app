const ChatMessage = require("./schemas/chat-message");

class ChatMessageRepository {

    async create(chatMessage) {
        await ChatMessage.create(chatMessage);
    }
}

module.exports = ChatMessageRepository;