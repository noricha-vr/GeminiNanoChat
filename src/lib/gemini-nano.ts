/**
 * Chrome の Prompt API (`LanguageModel`) を扱うための薄いラッパー。
 *
 * @remarks
 * 旧 `window.ai.assistant.*` から `LanguageModel` グローバル API への移行。
 * 参照: https://github.com/Ar9av/gemini-nano-chrome
 */

export type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

export interface InitialPrompt {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface CreateOptions {
	initialPrompts?: InitialPrompt[];
	monitor?: (m: LanguageModelMonitor) => void;
}

export interface LanguageModelMonitor {
	addEventListener(
		type: 'downloadprogress',
		listener: (event: { loaded: number }) => void
	): void;
}

export interface LanguageModelSession {
	prompt(input: string, options?: { responseConstraint?: object }): Promise<string>;
	promptStreaming(
		input: string,
		options?: { responseConstraint?: object }
	): AsyncIterable<string>;
	destroy(): void;
	readonly contextUsage?: number;
	readonly contextWindow?: number;
}

export interface LanguageModelStatic {
	availability(): Promise<Availability>;
	create(options?: CreateOptions): Promise<LanguageModelSession>;
}

declare global {
	const LanguageModel: LanguageModelStatic | undefined;
	interface Window {
		LanguageModel?: LanguageModelStatic;
	}
}

export function isSupported(): boolean {
	return typeof globalThis !== 'undefined' && typeof (globalThis as any).LanguageModel !== 'undefined';
}

export async function getAvailability(): Promise<Availability> {
	if (!isSupported()) return 'unavailable';
	return (globalThis as any).LanguageModel.availability();
}

export interface CreateSessionParams {
	systemPrompt?: string;
	onDownloadProgress?: (pct: number) => void;
}

export async function createSession(
	params: CreateSessionParams = {}
): Promise<LanguageModelSession> {
	if (!isSupported()) {
		throw new Error('LanguageModel API is not available in this browser.');
	}
	const options: CreateOptions = {};
	if (params.systemPrompt) {
		options.initialPrompts = [{ role: 'system', content: params.systemPrompt }];
	}
	if (params.onDownloadProgress) {
		options.monitor = (m) => {
			m.addEventListener('downloadprogress', (e) => {
				params.onDownloadProgress!(Math.round(e.loaded * 100));
			});
		};
	}
	return (globalThis as any).LanguageModel.create(options);
}
