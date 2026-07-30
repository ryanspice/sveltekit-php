<script lang="ts">
	interface StreamedMessage {
		message: string;
	}

	interface StreamData {
		serverTime: string;
		streamId: string;
		streamed: Promise<StreamedMessage>;
	}

	type StreamMessage = { id: number; text: string; timestamp: string };

	let { data }: { data: StreamData } = $props();

	let streamStatus = $state('Connecting...');
	let messages: StreamMessage[] = $state([]);
	let mounted = false;

	$effect(() => {
		if (mounted) return;
		mounted = true;

		// Simulate a streaming connection
		streamStatus = 'Connected';

		// Add initial messages
		messages = [
			{ id: 1, text: 'Stream initialized', timestamp: new Date().toLocaleTimeString() },
			{ id: 2, text: 'Starting data transmission...', timestamp: new Date().toLocaleTimeString() }
		];

		// Simulate incoming messages
		let messageId = 3;
		const interval = setInterval(() => {
			messages = [
				...messages,
				{
					id: messageId++,
					text: `Server message ${messageId - 2}`,
					timestamp: new Date().toLocaleTimeString()
				}
			];

			// Limit to last 10 messages
			if (messages.length > 10) {
				messages = messages.slice(-10);
			}
		}, 2000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<title>SSR Stream Demo</title>
	<meta name="description" content="Demonstrates streaming data with Server-Side Rendering" />
</svelte:head>

<main>
	<h1>Server-Side Streaming Demo</h1>

	<div class="stream-info">
		<h2>Stream Status</h2>
		<p><strong>Status:</strong> {streamStatus}</p>
		<p><strong>Initial Server Time:</strong> {data.serverTime}</p>
		<p><strong>Stream ID:</strong> {data.streamId}</p>
	</div>

	<div class="messages">
		<h2>Stream Messages</h2>
		{#if messages.length === 0}
			<p>No messages yet...</p>
		{:else}
			<div class="message-list">
				{#each messages as message (message.id)}
					<div class="message" class:recent={message.id > messages.length - 3}>
						<span class="timestamp">{message.timestamp}</span>
						<span class="text">{message.text}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="explanation">
		<h3>How Streaming Works</h3>
		<p>This demo simulates server-sent events streaming:</p>
		<ol>
			<li>Server renders initial HTML with connection info</li>
			<li>Client establishes streaming connection</li>
			<li>Server pushes data continuously</li>
			<li>Client updates UI in real-time</li>
		</ol>
	</div>

	<div class="features">
		<h3>Streaming Benefits</h3>
		<ul>
			<li>✅ Real-time data updates</li>
			<li>✅ Efficient server resources</li>
			<li>✅ Automatic reconnection</li>
			<li>✅ Low latency communication</li>
		</ul>
	</div>

	<div class="server-stream-test">
		<h3>SvelteKit Server Streaming</h3>
		{#await data.streamed}
			<p class="loading">Waiting for server stream...</p>
		{:then value}
			<p class="loaded">{value.message}</p>
		{/await}
	</div>
</main>

<style>
	.stream-info {
		background: #e8f4f8;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
		border-left: 4px solid #4a90e2;
	}

	.messages {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
		min-height: 200px;
	}

	.message-list {
		max-height: 300px;
		overflow-y: auto;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
		padding: 0.5rem;
	}

	.message {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
		margin: 0.25rem 0;
		background: white;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.message.recent {
		background: #e8f5e8;
		animation: highlight 0.5s ease-in-out;
	}

	.timestamp {
		font-family: monospace;
		color: #666;
		font-size: 0.9rem;
	}

	.text {
		flex: 1;
		margin-left: 1rem;
	}

	.explanation {
		background: #fff8dc;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.features {
		background: #f0fff0;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
		border-left: 4px solid #32cd32;
	}

	@keyframes highlight {
		0% {
			background: #ffffcc;
		}
		100% {
			background: #e8f5e8;
		}
	}

	ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.25rem 0;
	}

	strong {
		color: #2c5282;
	}
</style>
