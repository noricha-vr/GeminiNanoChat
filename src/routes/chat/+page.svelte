<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	let input: string = '';
	let response: string = '';
	let session: any = null;
	let isLoading: boolean = false;
	let debounceTimer: any;
	let isGeminiAvailable: boolean = false;
	let messages: string[] = [];
	onMount(async () => {
		if ((window as any).ai) {
			const canCreate = await (window as any).ai.canCreateTextSession();
			if (canCreate !== 'no') {
				session = await (window as any).ai.createTextSession();
				isGeminiAvailable = true;
			}
		}
	});

	function debounce(func: (...args: any[]) => void, delay: number) {
		return (...args: any[]) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => func(...args), delay);
		};
	}

	async function getResponse(text: string) {
		if (session && text.trim()) {
			isLoading = true;
			try {
				response = await session.prompt(text);
				messages.push(response);
				console.log(messages);
			} catch (error) {
				console.error('Error getting response:', error);
				response = 'エラーが発生しました。もう一度お試しください。';
			} finally {
				isLoading = false;
			}
		}
	}

	const debouncedGetResponse = debounce((text: string) => getResponse(text), 300);

	function submit(event: Event) {
		messages.push(input);
		const text = messages.join('\n');
		debouncedGetResponse(text);
		input = '';
	}

	function clearInput() {
		input = '';
		response = '';
		messages = [];
	}

	function convertMarkdownToHtml(markdown: string): string {
		return marked.parse(markdown) as string;
	}
</script>

<svelte:head>
	<title>Gemini Nano Chat</title>
	<meta
		name="description"
		content="Google ChromeのGemini Nanoを使用したリアルタイムチャットアプリケーションです。Gemini nanoに対応していない環境では設定方法を分かりやすく解説しています。"
	/>
	<link rel="canonical" href="/" />
	<meta name="keywords" content="Google, Chrome, Gemini, nano, AI, チャット" />
</svelte:head>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6 mt-5 text-center">Gemini Nano チャット</h1>

	<div class="mb-4 text-gray-900">
		<textarea
			class="w-full p-2 border rounded"
			rows="4"
			bind:value={input}
			placeholder="ここに質問を入力してください..."
		/>
		<div class="flex justify-end gap-2">
			<button type="button" class="btn btn-sm bg-primary-500 text-white" on:click={submit}>
				送信
			</button>
			<button type="button" class="btn btn-sm bg-secondary-500 text-white" on:click={clearInput}>
				クリア
			</button>
		</div>
	</div>
	{#if isLoading}
		<div class="mt-4 p-4 rounded">
			<p>回答を生成中...</p>
		</div>
	{:else if response}
		<div class="mt-4 p-4 rounded">
			<h2 class="font-bold mb-2">回答:</h2>
			<p class="prose">{@html convertMarkdownToHtml(response)}</p>
		</div>
	{/if}
</div>

<style>
	/* 必要に応じてスタイルを追加 */
</style>
