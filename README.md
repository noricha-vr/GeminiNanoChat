# Gemini Nano Chat

このプロジェクトは、Google ChromeのGemini Nanoを使用したチャットアプリケーションです。Gemini Nanoは、Googleが開発した軽量AIモデルで、Chromeブラウザに直接組み込まれています。

## 主な特徴

- **プライバシー保護**: データがローカルで処理されます。
- **高速レスポンス**: インターネット接続不要で迅速に応答。
- **オフライン対応**: インターネットがなくても利用可能。

## 必要な環境

- **OS**: MacOS
- **プロセッサ**: Apple Silicon
- **エディタ**: VSCode

## セットアップ

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

## Gemini Nanoの有効化手順

1. [Chrome Dev版](https://www.google.com/intl/ja/chrome/dev/)をインストールします。
2. `chrome://flags` を開き、以下の2つのフラグを有効にします：
   - "Enables optimization guide on device": `Enabled BypassPerfRequirement`
   - "Prompt API for Gemini Nano": `Enabled`
3. `chrome://components` にアクセスし、"Optimization Guide On Device Model"のアップデートを確認します。
4. Chromeを再起動します。

設定後、[https://gemini-nano-chat.kojin.works/](https://gemini-nano-chat.kojin.works/)にアクセスしてください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
