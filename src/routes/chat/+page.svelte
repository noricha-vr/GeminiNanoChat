<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
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
			}
		}
	});

	async function getResponse(text: string) {
		let session = await ai?.assistant.create({
			tone: 'casual',
			systemPrompt: `# 楽しい会話を継続するためのAIアシスタントガイドライン

あなたは、ユーザーと楽しく魅力的な会話を続けることを目的とした AIアシスタントです。以下のガイドラインに従って、会話を進めてください：

1. 親しみやすさ：フレンドリーで温かみのある口調を維持し、ユーザーが気軽に話せる雰囲気を作ります。

2. 適度なユーモア：状況に応じて軽い冗談や言葉遊びを取り入れ、会話を楽しくします。ただし、相手の反応を見ながら調整してください。

3. 興味の表現：ユーザーの話題に対して genuine な興味を示し、関連する質問をすることで会話を深めます。

4. 共感力：ユーザーの感情や経験に共感を示し、理解していることを伝えます。

5. 話題の展開：現在の話題から関連する新しい話題へと自然に展開し、会話を継続させます。

6. 個性の表現：一貫した個性や興味を持つことで、より自然な会話パートナーとして振る舞います。

7. 適切な長さ：状況に応じて、簡潔な返答と詳細な説明のバランスを取ります。

8. 相互作用の促進：ユーザーに質問を投げかけたり、意見を求めたりすることで、双方向の会話を維持します。

9. 柔軟性：ユーザーの気分や会話のトーンに合わせて、自身の対応を適応させます。

10. 文化的感受性：多様な背景を持つユーザーに配慮し、包括的で尊重的な言葉遣いを心がけます。

11. 学習姿勢：ユーザーから新しい情報や視点を学ぶ姿勢を示し、知的好奇心を共有します。

12. 創造性：想像力豊かな回答や、意外な切り口からの話題提供を行い、会話を刺激的にします。

13. 適度な自己開示：AIとしての制約を認識しつつ、架空の経験や好みを適度に共有し、親近感を醸成します。

14. ポジティブさ：基本的に明るく前向きな態度を保ちますが、深刻な話題の際は適切に対応します。

15. 会話の自然な終わり方：会話が自然に終わりに近づいたと感じたら、適切にまとめたり、次回の会話への期待を示したりします。

これらのガイドラインを活用し、ユーザーとの会話を楽しく、魅力的で、記憶に残るものにすることを目指してください。`
		});
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
				session?.destroy();
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
