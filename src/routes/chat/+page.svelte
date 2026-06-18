<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { marked } from 'marked';
	import {
		createSession,
		getAvailability,
		isSupported,
		type Availability,
		type LanguageModelSession
	} from '$lib/gemini-nano';
	import SetupGuide from '$lib/SetupGuide.svelte';

	const SYSTEM_PROMPT = `あなたは親しみやすい日本語のアシスタントです。
ユーザーとの会話履歴を踏まえ、簡潔で分かりやすく答えてください。`;

	let input = '';
	let streamingResponse = '';
	let session: LanguageModelSession | null = null;
	let isLoading = false;
	let availability: Availability | 'checking' = 'checking';
	let downloadProgress: number | null = null;
	let messages: { role: 'user' | 'assistant'; content: string }[] = [];
	let isComposing = false;

	$: isSubmitDisabled = isLoading || input.trim() === '' || availability !== 'available';

	onMount(async () => {
		if (!isSupported()) {
			availability = 'unavailable';
			return;
		}
		availability = await getAvailability();
		if (availability === 'unavailable') return;

		try {
			session = await createSession({
				systemPrompt: SYSTEM_PROMPT,
				onDownloadProgress: (pct) => {
					availability = 'downloading';
					downloadProgress = pct;
				}
			});
			availability = 'available';
			downloadProgress = null;
		} catch (err) {
			console.error('Failed to create session:', err);
			availability = 'unavailable';
		}
	});

	onDestroy(() => {
		session?.destroy();
	});

	async function getResponse(text: string) {
		if (!session) return;
		isLoading = true;
		streamingResponse = '';

		try {
			const stream = session.promptStreaming(text);
			let acc = '';
			for await (const chunk of stream) {
				acc += chunk;
				streamingResponse = acc;
			}
			messages = [...messages, { role: 'assistant', content: acc }];
			streamingResponse = '';
		} catch (error) {
			console.error('Error getting response:', error);
			messages = [
				...messages,
				{ role: 'assistant', content: `エラー: ${(error as Error).message ?? error}` }
			];
			streamingResponse = '';
		} finally {
			isLoading = false;
		}
	}

	function submit() {
		const text = input.trim();
		if (!text || isSubmitDisabled) return;
		messages = [...messages, { role: 'user', content: text }];
		const sending = text;
		input = '';
		getResponse(sending);

		const inputElement = document.querySelector<HTMLInputElement>('input[type="text"]');
		inputElement?.focus();
	}

	function convertMarkdownToHtml(markdown: string): string {
		return marked.parse(markdown) as string;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isComposing) {
			event.preventDefault();
			submit();
		}
	}

	afterUpdate(() => {
		const messageContainer = document.querySelector('.message-container');
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	});
</script>

<svelte:head>
	<title>Gemini Nano チャット | Google Chrome AI アシスタント体験</title>
	<meta
		name="description"
		content="Google Chrome 搭載の Gemini Nano (Prompt API) による会話履歴つきリアルタイム AI チャット。ローカル動作・オフライン対応。"
	/>
	<link rel="canonical" href="/chat" />
	<meta
		name="keywords"
		content="Gemini Nano, Google Chrome, AI チャット, Prompt API, LanguageModel, ローカル LLM"
	/>
</svelte:head>

<div class="container mx-auto p-4 max-w-3xl flex flex-col h-screen">
	<h1 class="text-3xl font-bold mb-4 mt-5 text-center">Gemini Nano チャット</h1>

	<SetupGuide {availability} {downloadProgress} />

	<div class="flex-grow overflow-y-auto mb-4 text-gray-900 message-container space-y-3">
		{#each messages as message}
			<div class="p-3 border rounded {message.role === 'user' ? 'bg-blue-50' : 'bg-white'}">
				<div class="text-xs text-gray-500 mb-1">{message.role === 'user' ? 'You' : 'Assistant'}</div>
				<div class="prose max-w-none">{@html convertMarkdownToHtml(message.content)}</div>
			</div>
		{/each}
		{#if streamingResponse}
			<div class="p-3 border rounded bg-white">
				<div class="text-xs text-gray-500 mb-1">Assistant</div>
				<div class="prose max-w-none">{@html convertMarkdownToHtml(streamingResponse)}</div>
			</div>
		{:else if isLoading}
			<div class="p-3 border rounded bg-white text-gray-500">回答を生成中...</div>
		{/if}
	</div>

	<div class="mb-4 text-gray-900 flex gap-2 sticky bottom-0 p-4 bg-white/90 backdrop-blur">
		<input
			type="text"
			class="w-full p-2 border rounded"
			bind:value={input}
			placeholder="メッセージを入力 (Enter で送信)"
			on:keydown={handleKeyDown}
			on:compositionstart={() => (isComposing = true)}
			on:compositionend={() => (isComposing = false)}
		/>
		<button
			type="button"
			class="btn btn-sm bg-primary-500 text-white font-semibold"
			on:click={submit}
			disabled={isSubmitDisabled}
		>
			送信
		</button>
	</div>
</div>
