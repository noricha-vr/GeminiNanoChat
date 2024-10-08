<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	let input: string = '';
	let response: string = '';
	let isLoading: boolean = false;
	let debounceTimer: any;
	let isGeminiAvailable: boolean = false;

	onMount(async () => {
		const capabilities = await ai?.assistant.capabilities();
		console.log(`assistant: ${capabilities.available}`);
		if (capabilities.available === 'readily') {
			isGeminiAvailable = true;
		}
	});

	function debounce(func: (...args: any[]) => void, delay: number) {
		return (...args: any[]) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => func(...args), delay);
		};
	}

	async function getResponse(text: string) {
		console.log('Creating new session');
		const session = await ai?.assistant.create();

		if (session && text.trim()) {
			isLoading = true;
			try {
				console.log('getResponse: start');
				console.log('Input text:', text);
				console.log('Session state:', session);
				const responseStream = await session.promptStreaming(text);
				console.log('Response stream received');
				let chunkCount = 0;
				let fullResponse = '';
				for await (const chunk of responseStream) {
					chunkCount++;
					console.log(`Chunk ${chunkCount}:`, chunk);
					response = chunk;
				}
				console.log('Total chunks received:', chunkCount);
				console.log('Full response:', fullResponse);
			} catch (error) {
				console.error('Error getting response:', error);
				if (error instanceof Error) {
					console.error('Error details:', error.message, error.stack);
				}
				response = 'エラーが発生しました。もう一度お試しください。';
			} finally {
				console.log('getResponse: end');
				session?.destroy();
				isLoading = false;
			}
		} else {
			console.log('getResponse: session or text is invalid');
			console.log('Session:', session);
			console.log('Text:', text);
		}
	}

	const debouncedGetResponse = debounce((text: string) => getResponse(text), 1000); // デバウンス時間を1秒に増やす

	function handleInput(event: Event) {
		input = (event.target as HTMLTextAreaElement).value;
		debouncedGetResponse(input);
	}

	function clearInput() {
		input = '';
		response = '';
	}

	function convertMarkdownToHtml(markdown: string): string {
		return marked.parse(markdown) as string;
	}
</script>

<svelte:head>
	<title>Gemini Nanoデモサイト | Google ChromeでローカルLLM体験</title>
	<meta
		name="description"
		content="Google Chrome搭載のGemini Nanoを使用したリアルタイムチャットアプリ。ローカルLLMの高速レスポンスとプライバシー保護を体験。未対応環境向けの詳細セットアップガイド付き。オフライン対応のAIチャットを今すぐ試そう！"
	/>
	<link rel="canonical" href="/" />
	<meta name="keywords" content="Google, Chrome, Gemini, nano, AI, チャット" />
</svelte:head>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6 mt-5 text-center">Gemini Nano リアルタイムチャット</h1>

	{#if !isGeminiAvailable}
		<div class="border-l-4 p-4 mb-6" role="alert">
			<p class="font-bold">Gemini Nanoを利用できません</p>
			<p>以下の手順に従って、Gemini Nanoを有効にしてください：</p>
			<ol class="list-decimal list-inside mt-2">
				<li>
					<code>chrome://flags</code> を開き、以下の2つのフラグを有効にします：
					<ul class="list-disc list-inside ml-4 font-bold">
						<li>
							"Enables optimization guide on device": <code>Enabled BypassPerfRequirement</code>
						</li>
						<li>"Prompt API for Gemini Nano": <code>Enabled</code></li>
					</ul>
				</li>
				<li>Google Chromeを再起動します。</li>
				<li>
					<code>chrome://components</code> にアクセスし、"Optimization Guide On Device Model"のアップデートを確認します。
				</li>
				<li>このページをリロードして、メッセージが消えていればGemini Nanoが有効になっています。</li>
			</ol>
		</div>
	{/if}

	<div class="mb-4 text-gray-900">
		<textarea
			class="w-full p-2 border rounded"
			rows="4"
			bind:value={input}
			on:input={handleInput}
			placeholder="ここに質問を入力してください..."
		/>
		<div class="text-end mt-1">
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

	<div class="mt-8 border-l-4 border-blue-500 p-4" role="info">
		<h2 class="font-bold text-xl mb-2">Gemini Nanoについて</h2>
		<p>Gemini NanoはGoogleが開発した軽量AIモデルで、Chromeブラウザに直接組み込まれています。</p>
		<h2 class="font-bold text-lg mb-2 mt-3">主な特徴：</h2>
		<ul class="list-disc list-inside mt-2">
			<li>プライバシー保護：データがローカルで処理されます</li>
			<li>高速レスポンス：インターネット接続不要で迅速に応答</li>
			<li>オフライン対応：インターネットがなくても利用可能</li>
		</ul>
	</div>
</div>

<style>
	/* 必要に応じてスタイルを追加 */
</style>
