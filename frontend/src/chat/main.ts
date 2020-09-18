import socketioControllerFactory from './controllers/socketIoController'
import Chat from './components/Chat/Chat.svelte'
import Error from './components/Error.svelte'

import {CLIENT_ID} from '../config'
import type {User} from './models/user'

const initApp = (roomId: string, user: User) => {
	const app = new Chat({
		target: document.body,
		props: {
			roomId,
			user,
			chatFactory: socketioControllerFactory,
		},
	})
}

const getCurrentUser = async (): Promise<User> => {
	const id = await miro.currentUser.getId()
	// @ts-ignore
	const onlineUsers = await miro.board.getOnlineUsers()

	return onlineUsers.find((user) => user.id === id) as User
}

miro.onReady(async () => {
	const savedState = await miro.__getRuntimeState()
	const user = await getCurrentUser()

	if (savedState[CLIENT_ID]?.breakoutChatRoomId && user) {
		initApp(savedState[CLIENT_ID]?.breakoutChatRoomId, user)
	} else {
		const app = new Error({
			target: document.body,
		})
	}
})
