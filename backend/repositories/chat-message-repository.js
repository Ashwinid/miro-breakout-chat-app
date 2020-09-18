const ChatMessage = require('./schemas/chat-message')

class ChatMessageRepository {
	async create(chatMessage) {
		await ChatMessage.create(chatMessage)
	}

	async getByRoomId(roomId) {
		return await ChatMessage.find({roomId: roomId}).lean()
	}
}

module.exports = ChatMessageRepository
