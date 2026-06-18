<script lang="ts">
	import type { Availability } from './gemini-nano';
	export let availability: Availability | 'checking' = 'checking';
	export let downloadProgress: number | null = null;
</script>

{#if availability === 'checking'}
	<div class="border-l-4 border-blue-400 bg-blue-50 p-4 mb-6" role="status">
		<p>Gemini Nano の利用可否を確認しています...</p>
	</div>
{:else if availability === 'available'}
	<!-- 表示不要 -->
{:else if availability === 'downloading'}
	<div class="border-l-4 border-amber-400 bg-amber-50 p-4 mb-6" role="status">
		<p class="font-bold">モデルをダウンロード中です</p>
		{#if downloadProgress !== null}
			<div class="mt-2 h-2 w-full rounded bg-amber-200 overflow-hidden">
				<div class="h-full bg-amber-500 transition-all" style="width: {downloadProgress}%"></div>
			</div>
			<p class="mt-1 text-sm">進捗: {downloadProgress}%</p>
		{:else}
			<p class="text-sm">初回は約 4GB のダウンロードに数分かかります。</p>
		{/if}
	</div>
{:else if availability === 'downloadable'}
	<div class="border-l-4 border-amber-400 bg-amber-50 p-4 mb-6" role="alert">
		<p class="font-bold">モデルのダウンロードが必要です</p>
		<p>下のフォームから最初のメッセージを送ると、約 4GB のモデルダウンロードが開始されます。</p>
	</div>
{:else}
	<div class="border-l-4 border-red-400 bg-red-50 p-4 mb-6" role="alert">
		<p class="font-bold">Gemini Nano を利用できません</p>
		<p>以下の手順で Chrome の Prompt API を有効化してください（Chrome 138+ / Dev・Canary 推奨）。</p>
		<ol class="list-decimal list-inside mt-2 space-y-1">
			<li>
				<code>chrome://flags/#optimization-guide-on-device-model</code> を
				<strong>Enabled BypassPerfRequirement</strong> に設定
			</li>
			<li>
				<code>chrome://flags/#prompt-api-for-gemini-nano</code> を
				<strong>Enabled</strong> に設定
			</li>
			<li>Chrome を再起動</li>
			<li>このページをリロード</li>
		</ol>
		<p class="mt-2 text-sm">
			ハードウェア要件: GPU 4GB+ VRAM もしくは CPU 16GB+ RAM / 22GB 以上の空き容量。
		</p>
	</div>
{/if}
