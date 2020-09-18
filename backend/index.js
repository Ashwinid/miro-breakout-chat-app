var express = require('express')
var app = express()
var cors = require('cors')
var http = require('http').Server(app)
var socketConfig = require('./config')
var io = require('socket.io')(http, socketConfig)
var port = process.env.PORT || 8081
require('./repositories/set-up')()
const ChatMessageRepository = require('./repositories/chat-message-repository')

var rooms = {}
var roomsCreatedAt = new WeakMap()
var names = new Map()
var roomId
var name

const ChatHistoryEventName = 'chat history'
const ChatMessageEventName = 'chat message'
const SystemMessageEventName = 'system message'

app.use(cors())

app.get('/rooms/:roomId', (req, res) => {
	const {roomId} = req.params
	const room = rooms[roomId]

	if (room) {
		res.json({
			createdAt: roomsCreatedAt.get(room),
			users: Object.values(room).map((userId) => getNameForUserId(userId)),
		})
	} else {
		res.status(500).end()
	}
})

app.get('/rooms', (req, res) => {
	res.json(Object.keys(rooms))
})

io.on('connection', (socket) => {
	socket.on('join', async (_roomId, _user, callback) => {
		if (!_roomId || !_user) {
			if (callback) {
				callback('roomId and user params required')
			}
			console.warn(`${socket.id} attempting to connect without roomId or user`, {_roomId, _user})
			return
		}

		roomId = _roomId
		name = _user.name

		if (rooms[roomId]) {
			rooms[roomId][socket.id] = _user.id
		} else {
			rooms[roomId] = {[socket.id]: _user.id}
			roomsCreatedAt.set(rooms[roomId], new Date())
		}
		socket.join(roomId)

		await onNewUserJoined(_user, socket, roomId)

		if (callback) {
			callback(null, {success: true})
		}
	})

	socket.on(ChatMessageEventName, (msg) => {
		const userId = getUserIdFromSocket(roomId, socket)
		io.to(roomId).emit(ChatMessageEventName, msg, getNameForUserId(userId))

		const chatMessageRepository = new ChatMessageRepository()
		chatMessageRepository.create({roomId: roomId, fromUser: userId, message: msg})
	})

	socket.on('disconnect', () => {
		io.to(roomId).emit(SystemMessageEventName, `${name} left ${roomId}`)

		delete rooms[roomId][socket.id]

		const room = rooms[roomId]
		if (!Object.keys(room).length) {
			delete rooms[roomId]
		}
	})
})

async function onNewUserJoined(user, socket, roomId) {
	setNameForUser(user.id, user.name)

	io.to(roomId).emit(SystemMessageEventName, `${user.name} joined ${roomId}`)

	const chatMessageRepository = new ChatMessageRepository()
	const chatHistory = await chatMessageRepository.getByRoomId(roomId)
	chatHistory.forEach((chat) => (chat.fromUser = getNameForUserId(chat.fromUser)))

	socket.emit(ChatHistoryEventName, chatHistory)
}

function getUserIdFromSocket(roomId, socket) {
	return rooms[roomId][socket.id]
}

function setNameForUser(userId, name) {
	names.set(userId, name)
}

function getNameForUserId(userId) {
	return names.get(userId)
}

http.listen(port, '0.0.0.0', () => {
	console.log('listening on *:' + port)
})
