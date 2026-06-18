<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { marked } from 'marked';
	import {
		createSession,
		getAvailability,
		isSupported,
		type Availability,
		type LanguageModelSession
	} from '$lib/gemini-nano';
	import SetupGuide from '$lib/SetupGuide.svelte';

	let input = '';
	let response = '';
	let isLoading = false;
	let availability: Availability | 'checking' = 'checking';
	let downloadProgress: number | null = null;

	let activeSession: LanguageModelSession | null = null;
	let activeAbort: { aborted: boolean } | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => {
		if (!isSupported()) {
			availability = 'unavailable';
			return;
		}
		availability = await getAvailability();
	});

	onDestroy(() => {
		activeAbort && (activeAbort.aborted = true);
		activeSession?.destroy();
		if (debounceTimer) clearTimeout(debounceTimer);
	});

	async function getResponse(text: string) {
		if (!text.trim() || !isSupported()) return;

		// 直前のリクエストをキャンセル
		if (activeAbort) activeAbort.aborted = true;
		activeSession?.destroy();
		activeSession = null;

		const abort = { aborted: false };
		activeAbort = abort;

		isLoading = true;
		response = '';
		try {
			const session = await createSession({
				onDownloadProgress: (pct) => {
					availability = 'downloading';
					downloadProgress = pct;
				}
			});
			if (abort.aborted) {
				session.destroy();
				return;
			}
			activeSession = session;
			availability = 'available';
			downloadProgress = null;

			const stream = session.promptStreaming(text);
			let acc = '';
			for await (const chunk of stream) {
				if (abort.aborted) break;
				acc += chunk;
				response = acc;
				isLoading = false;
			}
		} catch (error) {
			console.warn('Error getting response:', error);
			response = `エラーが発生しました: ${(error as Error).message ?? error}`;
		} finally {
			if (activeAbort === abort) {
				isLoading = false;
				activeSession?.destroy();
				activeSession = null;
				activeAbort = null;
			}
		}
	}

	function debouncedRequest(text: string) {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => getResponse(text), 400);
	}

	function handleInput(event: Event) {
		input = (event.target as HTMLTextAreaElement).value;
		debouncedRequest(input);
	}

	function clearInput() {
		if (activeAbort) activeAbort.aborted = true;
		activeSession?.destroy();
		activeSession = null;
		input = '';
		response = '';
	}

	function convertMarkdownToHtml(markdown: string): string {
		return marked.parse(markdown) as string;
	}
</script>

<svelte:head>
	<title>Gemini Nano デモサイト | Google Chrome でローカル LLM 体験</title>
	<meta
		name="description"
		content="Google Chrome 搭載の Gemini Nano (Prompt API / LanguageModel) を使用したリアルタイムチャットアプリ。ローカル LLM の高速レスポンスとプライバシー保護を体験。"
	/>
	<link rel="canonical" href="/" />
	<meta name="keywords" content="Google, Chrome, Gemini, nano, AI, チャット, Prompt API, LanguageModel" />
</svelte:head>

<div class="container mx-auto p-4 max-w-3xl">
	<h1 class="text-3xl font-bold mb-6 mt-5 text-center">Gemini Nano リアルタイムチャット</h1>

	<SetupGuide {availability} {downloadProgress} />

	<div class="mb-4 text-gray-900">
		<textarea
			class="w-full p-2 border rounded"
			rows="4"
			bind:value={input}
			on:input={handleInput}
			placeholder="ここに質問を入力してください..."
		></textarea>
		<div class="text-end mt-1">
			<button type="button" class="btn btn-sm bg-secondary-500 text-white" on:click={clearInput}>
				クリア
			</button>
		</div>
	</div>

	{#if isLoading}
		<div class="mt-4 p-4 rounded bg-gray-50">
			<p>回答を生成中...</p>
		</div>
	{:else if response}
		<div class="mt-4 p-4 rounded bg-gray-50">
			<h2 class="font-bold mb-2">回答:</h2>
			<div class="prose max-w-none">{@html convertMarkdownToHtml(response)}</div>
		</div>
	{/if}

	<div class="mt-8 border-l-4 border-blue-500 bg-blue-50 p-4" role="note">
		<h2 class="font-bold text-xl mb-2">Gemini Nano について</h2>
		<p>
			Gemini Nano は Google が開発した軽量 AI モデルで、Chrome に直接組み込まれています。
			JavaScript の <code>LanguageModel</code> API からアクセスでき、サーバー通信なしで動作します。
		</p>
		<h3 class="font-bold text-lg mb-2 mt-3">主な特徴:</h3>
		<ul class="list-disc list-inside mt-2 space-y-1">
			<li>プライバシー保護: 入力テキストはローカルで処理され、外部に送信されません</li>
			<li>高速レスポンス: 約 50 tokens/sec (M4 Pro 計測値)、TTFT ~80ms</li>
			<li>オフライン対応: モデルダウンロード後はネット接続不要</li>
		</ul>
	</div>
</div>
