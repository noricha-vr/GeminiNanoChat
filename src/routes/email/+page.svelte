<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { marked } from 'marked';
	import {
		createSession,
		getAvailability,
		isSupported,
		type Availability
	} from '$lib/gemini-nano';
	import SetupGuide from '$lib/SetupGuide.svelte';

	const TONES = [
		{
			label: '候補 1: フォーマル',
			systemPrompt: `あなたはビジネスメールのライターです。
入力された箇条書きや要点をもとに、丁寧でフォーマルな日本語のビジネスメール本文を作成してください。
件名、宛名、結びまで含め、敬語を適切に使い、過不足のない言葉に整えます。`
		},
		{
			label: '候補 2: カジュアル',
			systemPrompt: `あなたはビジネスメールのライターです。
入力された要点をもとに、社内の親しい同僚に送るような、ややカジュアルな日本語メールを作成してください。
過度な敬語は避けつつ、ビジネスとして失礼にならないトーンで整えます。`
		},
		{
			label: '候補 3: 簡潔',
			systemPrompt: `あなたはビジネスメールのライターです。
入力された要点をもとに、必要最小限の情報だけを伝える簡潔な日本語メールを作成してください。
不要な前置きや結びの常套句を省き、要件が一目で分かる構成にします。`
		}
	];

	let input = '';
	let availability: Availability | 'checking' = 'checking';
	let downloadProgress: number | null = null;
	let isLoading = false;
	let responses: string[] = ['', '', ''];
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let activeAbort: { aborted: boolean } | null = null;

	onMount(async () => {
		if (!isSupported()) {
			availability = 'unavailable';
			return;
		}
		availability = await getAvailability();
	});

	onDestroy(() => {
		if (activeAbort) activeAbort.aborted = true;
		if (debounceTimer) clearTimeout(debounceTimer);
	});

	async function runOne(index: number, text: string, abort: { aborted: boolean }) {
		const session = await createSession({
			systemPrompt: TONES[index].systemPrompt,
			onDownloadProgress: (pct) => {
				availability = 'downloading';
				downloadProgress = pct;
			}
		});
		availability = 'available';
		downloadProgress = null;

		try {
			if (abort.aborted) return;
			const stream = session.promptStreaming(text);
			let acc = '';
			for await (const chunk of stream) {
				if (abort.aborted) return;
				acc += chunk;
				responses[index] = acc;
				responses = responses; // Svelte の reactivity 用
			}
		} finally {
			session.destroy();
		}
	}

	async function generate(text: string) {
		if (!text.trim() || !isSupported()) return;

		if (activeAbort) activeAbort.aborted = true;
		const abort = { aborted: false };
		activeAbort = abort;

		isLoading = true;
		responses = ['', '', ''];

		try {
			// Gemini Nano は同一プロセス内で複数 create() を直列処理する方が安定するため
			// 並列ではなく順次実行する。
			for (let i = 0; i < TONES.length; i++) {
				if (abort.aborted) break;
				await runOne(i, text, abort);
			}
		} catch (error) {
			console.warn('Error getting response:', error);
			responses = [`エラー: ${(error as Error).message ?? error}`, '', ''];
		} finally {
			if (activeAbort === abort) {
				isLoading = false;
				activeAbort = null;
			}
		}
	}

	function debouncedGenerate(text: string) {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => generate(text), 600);
	}

	function handleInput(event: Event) {
		input = (event.target as HTMLTextAreaElement).value;
		debouncedGenerate(input);
	}

	function clearInput() {
		if (activeAbort) activeAbort.aborted = true;
		input = '';
		responses = ['', '', ''];
	}

	function convertMarkdownToHtml(markdown: string): string {
		return marked.parse(markdown) as string;
	}
</script>

<svelte:head>
	<title>Gemini Nano メール作成アシスタント | Google Chrome AI</title>
	<meta
		name="description"
		content="Google Chrome 搭載の Gemini Nano (Prompt API) を使ったメール作成アシスタント。フォーマル / カジュアル / 簡潔の 3 パターンを順次生成。"
	/>
	<link rel="canonical" href="/email" />
	<meta
		name="keywords"
		content="Gemini Nano, Google Chrome, AI メール, ビジネスメール, Prompt API, LanguageModel"
	/>
</svelte:head>

<div class="container mx-auto p-4 max-w-3xl">
	<h1 class="text-3xl font-bold mb-6 mt-5 text-center">Gemini Nano メール作成アシスタント</h1>

	<SetupGuide {availability} {downloadProgress} />

	<div class="mb-4 text-gray-900">
		<textarea
			class="w-full p-2 border rounded"
			rows="4"
			bind:value={input}
			on:input={handleInput}
			placeholder="メールの要点を箇条書きで入力してください..."
		></textarea>
		<div class="text-end mt-1">
			<button type="button" class="btn btn-sm bg-secondary-500 text-white" on:click={clearInput}>
				クリア
			</button>
		</div>
	</div>

	{#if isLoading && !(responses[0] || responses[1] || responses[2])}
		<div class="mt-4 p-4 rounded bg-gray-50">
			<p>回答を生成中...</p>
		</div>
	{:else if responses[0] || responses[1] || responses[2]}
		<div class="mt-4 space-y-4">
			{#each TONES as tone, i}
				<div class="p-4 border rounded bg-gray-50">
					<h3 class="font-bold mb-2">{tone.label}</h3>
					<div class="prose max-w-none">{@html convertMarkdownToHtml(responses[i])}</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-8 border-l-4 border-blue-500 bg-blue-50 p-4" role="note">
		<h2 class="font-bold text-xl mb-2">Gemini Nano について</h2>
		<p>
			Gemini Nano は Google が開発した軽量 AI モデルで、Chrome に直接組み込まれています。
			<code>LanguageModel</code> API 経由でローカル動作し、メール本文も外部に送信されません。
		</p>
		<ul class="list-disc list-inside mt-2 space-y-1">
			<li>プライバシー保護: 入力はローカルで処理</li>
			<li>3 パターンを順次生成 (並列だと context 競合が起こるため直列)</li>
			<li>オフライン対応 (モデル DL 後)</li>
		</ul>
	</div>
</div>
