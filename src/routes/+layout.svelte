<script lang="ts">
	import '../app.postcss';
</script>

<nav class="p-3 flex justify-between bg-surface-100-800-token shadow-2xl">
	<div class="text-2xl font-bold">
		<a href="/">Gemini nano サンプルページ</a>
	</div>
	<ul class="flex">
		<li class="mr-6">
			<a href="/">リアルタイムチャット</a>
		</li>
		<li class="mr-6">
			<a href="/chat">チャット</a>
		</li>
	</ul>
</nav>
<slot />
