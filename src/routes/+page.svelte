<!-- src/routes/+page.svelte -->
<script>
	import { onMount } from 'svelte';

	let input = '';
	let response = '';
	//@ts-ignore
	let session = null;
	let isLoading = false;
	//@ts-ignore
	let debounceTimer;

	onMount(async () => {
		//@ts-ignore
		if (window.ai) {
			//@ts-ignore
			const canCreate = await window.ai.canCreateTextSession();
			if (canCreate !== 'no') {
				//@ts-ignore
				session = await window.ai.createTextSession();
			}
		}
	});

	//@ts-ignore
	function debounce(func, delay) {
		//@ts-ignore
		return (...args) => {
			//@ts-ignore
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => func(...args), delay);
		};
	}

	//@ts-ignore
	async function getResponse(text) {
		//@ts-ignore
		if (session && text.trim()) {
			isLoading = true;
			try {
				response = await session.prompt(text);
			} catch (error) {
				console.error('Error getting response:', error);
				response = 'エラーが発生しました。もう一度お試しください。';
			} finally {
				isLoading = false;
			}
		}
	}

	//@ts-ignore
	const debouncedGetResponse = debounce((text) => getResponse(text), 300);

	//@ts-ignore
	function handleInput(event) {
		input = event.target.value;
		debouncedGetResponse(input);
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-4">Gemini Nano リアルタイムチャット</h1>
	<div class="mb-4">
		<textarea
			class="w-full p-2 border rounded"
			rows="4"
			bind:value={input}
			on:input={handleInput}
			placeholder="ここに質問を入力してください..."
		/>えみ
	</div>
	{#if isLoading}
		<div class="mt-4 p-4 bg-gray-100 rounded">
			<p>回答を生成中...</p>
		</div>
	{:else if response}
		<div class="mt-4 p-4 bg-gray-100 text-gray-900 rounded">
			<h2 class="font-bold mb-2">回答:</h2>
			<p class="">{response}</p>
		</div>
	{/if}
</div>

<style>
	input[type='text'],
	textarea {
		color: black;
	}
	.chat-input,
	#message-input {
		color: black;
	}
</style>
