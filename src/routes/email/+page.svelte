<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	let input: string = '';
	let response: string = '';
	let session: any = null;
	let isLoading: boolean = false;
	let debounceTimer: any;
	let isGeminiAvailable: boolean = false;
	let responses: string[] = ['', '', ''];

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
		let session1 = await ai?.assistant.create({
			tone: 'formal',
			systemPrompt: `与えられた情報をもとに、言葉を補ってビジネスメールに書き直してください。`
		});
		let session2 = await ai?.assistant.create({
			tone: 'casual',
			systemPrompt: `与えられた情報���もとに、言葉を補ってビジネスメールに書き直してください。`
		});
		let session3 = await ai?.assistant.create({
			tone: 'frank',
			systemPrompt: `与えられた情報をもとに、言葉を補ってビジネスメールに書き直してください。`
		});

		if (session1 && session2 && session3 && text.trim()) {
			isLoading = true;
			try {
				const responseStream1 = await session1.promptStreaming(text);
				for await (const chunk1 of responseStream1) {
					responses[0] = chunk1;
				}
				session1.destroy();
				const responseStream2 = await session2.promptStreaming(text);
				for await (const chunk2 of responseStream2) {
					responses[1] = chunk2;
				}
				session2.destroy();
				const responseStream3 = await session3.promptStreaming(text);
				for await (const chunk3 of responseStream3) {
					responses[2] = chunk3;
				}
				session3.destroy();
			} catch (error) {
				console.error('Error getting response:', error);
				responses = ['エラーが発生しました。もう一度お試しください。', '', ''];
			} finally {
				isLoading = false;
			}
		}
	}

	const debouncedGetResponse = debounce((text: string) => getResponse(text), 300);

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
	<title>Gemini Nano メール添削 | Google Chrome AI アシスタント</title>
	<meta
		name="description"
		content="Google Chrome搭載のGemini Nanoを使用したリアルタイムメール添削ツール。ビジネスメールを瞬時に3パターンで改善。高速・オフライン対応のAIアシスタントを体験。未対応環境向けの簡単セットアップガイド付き。"
	/>
	<link rel="canonical" href="/email" />
	<meta
		name="keywords"
		content="Gemini Nano, Google Chrome, AI メール添削, ビジネスメール, リアルタイム添削, ローカルLLM"
	/>
</svelte:head>

<div class="container mx-auto p-4">
	<h1 class="text-3xl font-bold mb-6 mt-5 text-center">Gemini Nano リアルタイム添削</h1>

	{#if !isGeminiAvailable}
		<div class="border-l-4 p-4 mb-6" role="alert">
			<p class="font-bold">Gemini Nanoを利用できません</p>
			<p>以下の手順に従って、Gemini Nanoを有効にしてください：</p>
			<ol class="list-decimal list-inside mt-2">
				<li>
					<a
						href="https://www.google.com/intl/ja/chrome/dev/"
						target="_blank"
						class="text-blue-600"
						rel="noopener noreferrer">Chrome Dev版</a
					>をインストールします。
				</li>
				<li>
					<code>chrome://flags</code> を開き、以下の2つのフラグを有効にします：
					<ul class="list-disc list-inside ml-4 font-bold">
						<li>
							"Enables optimization guide on device": <code>Enabled BypassPerfRequirement</code>
						</li>
						<li>"Prompt API for Gemini Nano": <code>Enabled</code></li>
					</ul>
				</li>
				<li>
					<code>chrome://components</code> にアクセスし、"Optimization Guide On Device Model"のアップデー���を確認します。
				</li>
				<li>Chromeを再起動します。</li>
			</ol>
			<p class="mt-2">
				設定後、<a class="text-blue-600" href="https://gemini-nano-chat.kojin.works/"
					>https://gemini-nano-chat.kojin.works/</a
				>にアクセスしてください。
			</p>
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
	{:else if responses[0] || responses[1] || responses[2]}
		<div class="mt-4 p-4 rounded">
			<h2 class="font-bold mb-2">回答:</h2>
			<div class="prose">
				<h3>候補1：</h3>
				<p>{@html convertMarkdownToHtml(responses[0])}</p>
				<h3>候補2：</h3>
				<p>{@html convertMarkdownToHtml(responses[1])}</p>
				<h3>候補3：</h3>
				<p>{@html convertMarkdownToHtml(responses[2])}</p>
			</div>
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
