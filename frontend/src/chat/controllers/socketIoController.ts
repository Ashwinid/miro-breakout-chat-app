import io from 'socket.io-client'

import {CHAT_HOST, CHAT_OPTIONS} from '../../config'

import type {ChatSettings, ChatController, Message} from '../interfaces/chat';

function createMessage(text, author, timestamp: Date | string) {
    return <Message>{text, author, timestamp: new Date(timestamp)};
}

const initChat = ({roomId, user, messageHandler}: ChatSettings) => {
	const socket = io(CHAT_HOST, CHAT_OPTIONS)

	socket.emit('join', roomId, user, () => {})

	socket.on('chat message', (text, author, timestamp = new Date()) => {
        messageHandler(createMessage(text, author, timestamp));
    });

    socket.on('chat history', (history) => history.forEach(oldMessage => {
        messageHandler(createMessage(oldMessage.message, oldMessage.fromUser, oldMessage.createdAt));
    }))

	return {
		sendMessage: (msg: string) => {
			socket.emit('chat message', msg, () => {})
		},
	} as ChatController
}

export default initChat
