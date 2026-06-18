# Gemini Nano Chat

このプロジェクトは、Google ChromeのGemini Nanoを使用したチャットアプリケーションです。Gemini Nanoは、Googleが開発した軽量AIモデルで、Chromeブラウザに直接組み込まれています。

## 主な特徴

- **プライバシー保護**: データがローカルで処理されます。
- **高速レスポンス**: インターネット接続不要で迅速に応答。
- **オフライン対応**: インターネットがなくても利用可能。

## Gemini Nano の有効化手順

このアプリは Chrome の **Prompt API (`LanguageModel`)** を直接呼び出します。
事前に以下のセットアップが必要です（Chrome 138+ / Dev・Canary 推奨）。

1. `chrome://flags/#optimization-guide-on-device-model` を **Enabled BypassPerfRequirement** に設定
2. `chrome://flags/#prompt-api-for-gemini-nano` を **Enabled** に設定
3. Chrome を再起動
4. アプリを開き、初回はモデル（約 4GB）のダウンロード完了を待つ
   - 進捗はアプリ内に表示されます
   - `chrome://on-device-internals` でも状態を確認できます

### 動作要件

| | |
|---|---|
| Chrome | 138+ (Dev / Canary 推奨) |
| OS | Windows 10/11, macOS 13+, Linux, ChromeOS (Chromebook Plus) |
| ストレージ | 22 GB 以上の空き |
| GPU | 4 GB+ VRAM **または** |
| CPU | 16 GB+ RAM かつ 4 コア以上 |
| 回線 | 初回のモデル DL (約 4GB) 用に従量課金でない回線 |

### API の概要 (本アプリ内部での使い方)

```ts
const availability = await LanguageModel.availability();
// "unavailable" | "downloadable" | "downloading" | "available"

const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: 'You are a helpful assistant.' }],
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`${Math.round(e.loaded * 100)}%`);
    });
  }
});

const stream = session.promptStreaming('こんにちは');
for await (const chunk of stream) {
  // chunk は差分テキスト。連結して使う。
  console.log(chunk);
}

session.destroy();
```

参考: [Ar9av/gemini-nano-chrome](https://github.com/Ar9av/gemini-nano-chrome)

## 開発用セットアップ

### 依存関係のインストール

以下のコマンドを実行して依存関係をインストールします。

```bash
npm install
```

### 開発サーバーの起動

開発サーバーを起動するには、以下のコマンドを実行します。

```bash
npm run dev
```

### ビルド

プロジェクトをビルドするには、以下のコマンドを実行します。

```bash
npm run build
```

### プレビュー

ビルド後のプロジェクトをプレビューするには、以下のコマンドを実行します。

```bash
npm run preview
```

## 使用技術

- **Svelte**: フロントエンドフレームワーク
- **TypeScript**: 型安全なJavaScript
- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **Skeleton**: Svelte用のUIコンポーネントライブラリ

## ディレクトリ構成

```plaintext
src/
├── app.d.ts
├── app.html
├── app.postcss
├── lib/
│   └── index.ts
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── chat/
│       └── +page.svelte
├── main.ts
├── vite-env.d.ts
.gitignore
.npmrc
.prettierignore
.prettierrc
package.json
postcss.config.cjs
svelte.config.js
tailwind.config.ts
tsconfig.json
vite.config.ts
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
