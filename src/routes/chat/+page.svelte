<script lang="ts">
	import { onMount, afterUpdate, onDestroy } from 'svelte';
	import { marked } from 'marked';

	let input: string = '';
	let response: string = '';
	let session: any = null;
	let isLoading: boolean = false;
	let isGeminiAvailable: boolean = false;
	let messages: { role: string; content: string }[] = [];
	let isComposing: boolean = false; // 変換中かどうかのフラグ
	$: isSubmitDisabled = isLoading || input.trim() === '';

	onMount(async () => {
		if ((window as any).ai) {
			const canCreate = await ai?.assistant.capabilities();
			if (canCreate.available === 'readily') {
				isGeminiAvailable = true;
				session = await ai?.assistant.create({
					tone: 'casual',
					systemPrompt: `# 役割
あなたは、ユーザーと楽しく魅力的な会話を続けることを目的とした AIアシスタントです。`
				});
			}
		}
	});

	onDestroy(() => {
		if (session) {
			session.destroy();
		}
	});

	async function getResponse(text: string) {
		if (session && text.trim()) {
			console.log(`prompt: ${text}`);
			isLoading = true;
			try {
				const responseStream = await session.promptStreaming(text);
				isLoading = false;
				response = '';
				for await (const chunk of responseStream) {
					response = chunk;
				}
				messages = [...messages, { role: 'assistant', content: response }];
				response = '';
				console.log(messages);
			} catch (error) {
				console.error('Error getting response:', error);
				response = 'エラーが発生しました。もう一度お試しください。';
			} finally {
			}
		}
	}

	function submit(event: Event) {
		messages = [...messages, { role: 'user', content: input }];

		getResponse(input);
		input = '';

		// テキストボックスにフォーカスを設定
		const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
		if (inputElement) {
			inputElement.focus();
		}
	}

	function convertMarkdownToHtml(markdown: string): string {
		return marked.parse(markdown) as string;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isComposing) {
			submit(event);
		}
	}

	function handleCompositionStart() {
		isComposing = true;
	}

	function handleCompositionEnd() {
		isComposing = false;
	}
	// メッセージが更新されるたびにスクロール
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
		content="Google Chrome搭載のGemini Nanoを使用したリアルタイムAIチャット。高速レスポンスとプライバシー保護を両立。オフライン対応で、いつでもどこでもAI会話が可能。未対応環境向けの簡単セットアップガイド付き。"
	/>
	<link rel="canonical" href="/chat" />
	<meta
		name="keywords"
		content="Gemini Nano, Google Chrome, AIチャット, リアルタイム会話, ローカルLLM, オフラインAI"
	/>
</svelte:head>
<div class="container mx-auto p-4 flex flex-col justify-between h-screen">
	<h1 class="text-3xl font-bold mb-6 mt-5 text-center">Gemini Nano チャット</h1>

	<div class="flex-grow overflow-y-auto mb-4 text-gray-900 message-container">
		{#each messages as message}
			<div class="p-2 border-b">
				{message.role}: {@html convertMarkdownToHtml(message.content)}
			</div>
		{/each}
		{#if response != ''}
			<div class="p-2 border-b">
				Assistant: {@html convertMarkdownToHtml(response)}
			</div>
		{/if}
	</div>

	<!-- ここから変更 -->
	<div class="mb-4 text-gray-900 flex gap-2 sticky bottom-0 p-4">
		<input
			type="text"
			class="w-full p-2 border rounded"
			bind:value={input}
			placeholder="ここに質問を入力してください..."
			on:keydown={handleKeyDown}
			on:compositionstart={handleCompositionStart}
			on:compositionend={handleCompositionEnd}
		/>
		<div class="flex justify-end gap-2 mt-1">
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
	<!-- ここまで変更 -->
</div>
