<script lang="ts">
    import {afterUpdate, onMount} from 'svelte'
	import type {User} from '../../models/user';
    import Message from './Message.svelte'

	import type {
		MessageHandler,
		Message as MessageInterface, ChatController, ChatSettings ,
	} from '../../interfaces/chat'

    export let chatFactory: (settings: ChatSettings) => ChatController;
    export let roomId: string;
    export let user: User;

	let newMessageText: string = ''

	let chatController: ChatController = null

	let messages: Array<MessageInterface> = []
	const handleNewMessage: MessageHandler = (message: MessageInterface) => {
		messages = [...messages, message]
	}

	const scrollToBottom = () => {
        const wrapper = document.querySelector('.sidebar__messages_wrapper');
        wrapper.scrollTop = wrapper.scrollHeight;
    }

    const handleMessageSend = () => {
        if (!newMessageText) return

		chatController.sendMessage(newMessageText)

		newMessageText = ''

		return false
	}

    onMount(() => {
        chatController = chatFactory({ roomId, user, messageHandler: handleNewMessage });
    });

    afterUpdate(() => scrollToBottom());
</script>

<style>
	.sidebar__container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
	}

	.sidebar__header {
		padding: 24px;
		height: 64px;
	}

	.sidebar__body {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		height: calc(100% - 135px);
		padding: 0 24px;
	}

	.sidebar__footer {
		padding: 0 8px;
	}

	.sidebar__footer input {
		width: 100%;
	}

    .sidebar__messages_wrapper {
        overflow: scroll;
    }
</style>

<div class="sidebar__container">
	<div class="sidebar__header">
		<span class="miro-h2">Breakout Chat</span>
	</div>
	<div class="sidebar__body">
		<div class="sidebar__messages_wrapper">
            {#each messages as message}
                <Message {message} />
            {/each}
        </div>
	</div>
	<div class="sidebar__footer">
		<form on:submit|preventDefault={handleMessageSend}>
			<input
				disabled={chatController === null}
				type="text"
				class="miro-input miro-input--primary"
				bind:value={newMessageText}
				placeholder="Type your message here" />
		</form>
	</div>
</div>
