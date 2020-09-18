var express = require('express')
var app = express()
var cors = require('cors')
var http = require('http').Server(app)
var socketConfig = require('./config')
var io = require('socket.io')(http, socketConfig)
var port = process.env.PORT || 8081
require('./repositories/set-up')();
const ChatMessageRepository = require('./repositories/chat-message-repository');

var rooms = {}
var roomsCreatedAt = new WeakMap()
var names = new Map();
var roomId
var name

app.use(cors())

app.get('/rooms/:roomId', (req, res) => {
	const {roomId} = req.params
	const room = rooms[roomId]

	if (room) {
		res.json({
			createdAt: roomsCreatedAt.get(room),
			users: Object.values(room).map((socket) => names.get(socket)),
		})
	} else {
		res.status(500).end()
	}
})

app.get('/rooms', (req, res) => {
	res.json(Object.keys(rooms))
})

io.on('connection', (socket) => {
	let user;

  socket.on('join', async (_roomId, _user, callback) => {
    if (!_roomId || !_user) {
      if (callback) {
        callback('roomId and user params required')
      }
      console.warn(`${socket.id} attempting to connect without roomId or user`, { _roomId, _user })
      return
    }

    roomId = _roomId;
    user = _user;
    name = _user.name;

		if (rooms[roomId]) {
			rooms[roomId][socket.id] = socket
		} else {
			rooms[roomId] = {[socket.id]: socket}
			roomsCreatedAt.set(rooms[roomId], new Date());
		}
		socket.join(roomId)

		names.set(_user.id, name)

    io.to(roomId).emit('system message', `${name} joined ${roomId}`);

		const chatMessageRepository = new ChatMessageRepository();
    const chatHistory = await chatMessageRepository.getByRoomId(roomId);
    chatHistory.forEach(chat => chat.fromUser = names.get(chat.fromUser));

    socket.emit('chat history', chatHistory);

		if (callback) {
			callback(null, {success: true})
		}
	})

	socket.on('chat message', (msg) => {
    io.to(roomId).emit('chat message', msg, name)

    const chatMessageRepository = new ChatMessageRepository();
    chatMessageRepository.create({roomId: roomId, fromUser: user.id, message: msg});
  })

	socket.on('disconnect', () => {
		io.to(roomId).emit('system message', `${name} left ${roomId}`)

		delete rooms[roomId][socket.id]

		const room = rooms[roomId]
		if (!Object.keys(room).length) {
			delete rooms[roomId]
		}
	})
})

http.listen(port, '0.0.0.0', () => {
	console.log('listening on *:' + port)
})
