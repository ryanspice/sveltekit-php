<script lang="ts">
	import type { Snippet } from 'svelte';
	import { installNativeHostEventBridge } from '$lib/native-shell/native-host-event-bridge';

	type NativeShellTheme = 'theme-alpha' | 'theme-light' | 'theme-dark' | 'theme-ultragear';
	type WindowEffect = 'mica' | 'acrylic' | 'none';

	let {
		children,
		labelledby,
		windowEffect = 'mica',
		windowFocused = true,
		maximized = false,
		themeClass = 'theme-ultragear'
	}: {
		children: Snippet;
		labelledby?: string;
		windowEffect?: WindowEffect;
		windowFocused?: boolean;
		maximized?: boolean;
		themeClass?: NativeShellTheme;
	} = $props();

	$effect(() => {
		const bridge = installNativeHostEventBridge();

		return bridge.dispose;
	});
</script>

<main
	class={`native-shell-surface ${themeClass}`}
	data-native-shell
	data-native-shell-theme={themeClass}
	data-native-platform-provenance="lg-ultragear-native-platform-provenance"
	data-desktop-shell-ui-binding="desktopShellUiBinding"
	data-desktop-shell-helper-package="@scriptgpt/desktop-shell-ui"
	data-desktop-shell-helper-functions="enableMicaWindowChrome syncTaskbarProgress toggleWindowMaximize bindColorSchemeWatcher prefersDarkMode"
	data-native-host-controller-global="window.__SVELTEKIT_PHP_NATIVE_HOST__"
	data-native-host-installer="installSvelteKitPhpNativeHost"
	data-window-material={windowEffect === 'mica' ? 'windows-11-mica' : windowEffect}
	data-macos-chrome="traffic-light-row"
	data-windows-chrome="caption-control-row"
	data-window-effect={windowEffect}
	data-window-focused={windowFocused ? 'true' : 'false'}
>
	<section
		class="window-frame"
		class:window-frame--maximized={maximized}
		aria-labelledby={labelledby}
		data-native-window-frame
	>
		<div class="mica-wash" aria-hidden="true"></div>
		{@render children()}
	</section>
</main>

<style>
	:global(body) {
		color: #111827;
	}

	.native-shell-surface {
		--font-ui: 'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
		--font-display: 'Segoe UI Variable Display', 'Segoe UI', -apple-system, BlinkMacSystemFont,
			sans-serif;
		--radius-sm: 14px;
		--radius-md: 18px;
		--radius-lg: 22px;
		--radius-xl: 28px;
		--blur-mica: saturate(136%) blur(28px);
		--shadow-deep: 0 24px 70px rgba(33, 42, 70, 0.18);
		--window-border: rgba(79, 93, 128, 0.2);
		--window-bg:
			radial-gradient(circle at 14% 12%, rgba(0, 177, 255, 0.22), transparent 28rem),
			radial-gradient(circle at 86% 16%, rgba(255, 45, 122, 0.2), transparent 26rem),
			linear-gradient(135deg, #edf4ff 0%, #e7ebf7 42%, #f3e9f1 100%);
		--window-bg-plain: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.52),
			rgba(255, 255, 255, 0.3)
		);
		--window-bg-mica: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.54),
			rgba(255, 255, 255, 0.28)
		);
		--window-bg-inactive:
			linear-gradient(180deg, rgba(247, 250, 255, 0.54), rgba(229, 236, 248, 0.3)),
			linear-gradient(180deg, rgba(104, 116, 146, 0.035), rgba(104, 116, 146, 0.015));
		--window-wash:
			radial-gradient(circle at 14% 12%, rgba(68, 117, 255, 0.12), transparent 28%),
			radial-gradient(circle at 88% 20%, rgba(255, 45, 122, 0.11), transparent 28%),
			radial-gradient(circle at 76% 82%, rgba(0, 182, 167, 0.11), transparent 30%);
		--window-wash-inactive:
			linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.18)),
			radial-gradient(circle at 16% 8%, rgba(111, 116, 255, 0.09), transparent 32%),
			radial-gradient(circle at 82% 18%, rgba(41, 121, 255, 0.08), transparent 30%),
			radial-gradient(circle at 76% 86%, rgba(236, 72, 153, 0.06), transparent 26%);
		--window-surface: rgba(255, 255, 255, 0.38);
		--surface-chrome: rgba(255, 255, 255, 0.48);
		--caption-hover-bg: rgba(17, 24, 39, 0.08);
		--caption-active-bg: rgba(17, 24, 39, 0.12);
		--danger-hover-bg: rgba(232, 17, 35, 0.92);
		--desktop-shell-helper-package: '@scriptgpt/desktop-shell-ui';

		min-height: 100vh;
		padding: clamp(1rem, 3vw, 2.5rem);
		background: var(--window-bg);
		font-family: var(--font-ui);
	}

	.native-shell-surface.theme-ultragear {
		color-scheme: dark;
		--shadow-deep: 0 24px 68px rgba(4, 6, 15, 0.32);
		--window-border: rgba(255, 255, 255, 0.08);
		--window-bg:
			radial-gradient(circle at 18% 10%, rgba(220, 126, 228, 0.18), transparent 30%),
			radial-gradient(circle at 80% 18%, rgba(103, 122, 255, 0.16), transparent 28%),
			radial-gradient(circle at 78% 88%, rgba(255, 45, 122, 0.12), transparent 24%),
			linear-gradient(180deg, #17192f 0%, #131425 56%, #101119 100%);
		--window-bg-plain: linear-gradient(180deg, rgba(18, 24, 36, 0.16), rgba(10, 14, 22, 0.08));
		--window-bg-mica: linear-gradient(180deg, rgba(14, 18, 28, 0.2), rgba(9, 12, 18, 0.1));
		--window-bg-inactive:
			linear-gradient(180deg, rgba(16, 19, 32, 0.34), rgba(10, 12, 20, 0.22)),
			linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0.006));
		--window-wash: linear-gradient(180deg, rgba(255, 255, 255, 0.024), rgba(255, 255, 255, 0.007));
		--window-wash-inactive:
			linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0.008)),
			radial-gradient(circle at 16% 8%, rgba(220, 126, 228, 0.1), transparent 32%),
			radial-gradient(circle at 82% 18%, rgba(103, 122, 255, 0.1), transparent 30%),
			radial-gradient(circle at 76% 86%, rgba(255, 45, 122, 0.07), transparent 26%);
		--window-surface: rgba(16, 18, 34, 0.61);
		--surface-chrome: rgba(22, 25, 44, 0.38);
		--surface-footer: rgba(255, 255, 255, 0.016);
		--accent: #ff2d7a;
		--accent-soft: rgba(127, 56, 108, 0.42);
		--accent-blue: rgba(137, 165, 255, 0.11);
		--caption-hover-bg: rgba(255, 255, 255, 0.06);
		--caption-active-bg: rgba(255, 255, 255, 0.08);
		--danger-hover-bg: rgba(232, 17, 35, 0.92);
		color: #f6f7ff;
	}

	.native-shell-surface.theme-dark {
		color-scheme: dark;
		--shadow-deep: 0 24px 70px rgba(0, 0, 0, 0.26);
		--window-border: rgba(255, 255, 255, 0.08);
		--window-bg:
			radial-gradient(circle at 18% 10%, rgba(0, 177, 255, 0.18), transparent 28rem),
			radial-gradient(circle at 84% 16%, rgba(255, 45, 122, 0.16), transparent 26rem),
			linear-gradient(135deg, #101827 0%, #111827 52%, #181320 100%);
		--window-bg-plain: linear-gradient(180deg, rgba(18, 24, 38, 0.68), rgba(8, 13, 25, 0.52));
		--window-bg-mica: linear-gradient(180deg, rgba(18, 24, 38, 0.68), rgba(8, 13, 25, 0.52));
		--window-bg-inactive:
			linear-gradient(180deg, rgba(18, 24, 38, 0.74), rgba(8, 13, 25, 0.62)),
			linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0.006));
		--window-wash:
			radial-gradient(circle at 14% 12%, rgba(68, 117, 255, 0.12), transparent 28%),
			radial-gradient(circle at 88% 20%, rgba(255, 45, 122, 0.1), transparent 28%);
		--window-wash-inactive:
			linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0.008)),
			radial-gradient(circle at 16% 8%, rgba(139, 123, 255, 0.1), transparent 32%),
			radial-gradient(circle at 82% 18%, rgba(103, 122, 255, 0.1), transparent 30%);
		--window-surface: rgba(15, 23, 42, 0.5);
		color: #f8fafc;
	}

	.window-frame {
		position: relative;
		isolation: isolate;
		max-width: 1280px;
		margin: 0 auto;
		border: 1px solid var(--window-border);
		border-radius: var(--radius-xl);
		overflow: hidden;
		background: var(--window-bg-plain), var(--window-surface);
		box-shadow: var(--shadow-deep), inset 0 1px 0 rgba(255, 255, 255, 0.74);
		backdrop-filter: var(--blur-mica);
		-webkit-backdrop-filter: var(--blur-mica);
		transition: border-radius 160ms ease, background 160ms ease, box-shadow 160ms ease;
	}

	.window-frame::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.024), rgba(255, 255, 255, 0.007));
		opacity: 0;
		pointer-events: none;
		transition: opacity 160ms ease, background 160ms ease;
	}

	.window-frame--maximized {
		max-width: none;
		min-height: calc(100vh - clamp(1rem, 3vw, 2.5rem) * 2);
		border-radius: 0;
	}

	.native-shell-surface[data-window-effect='mica'] .window-frame {
		background: var(--window-bg-mica), var(--window-surface);
	}

	.native-shell-surface[data-window-effect='mica'] .window-frame::after {
		opacity: 1;
	}

	.native-shell-surface[data-window-effect='mica'][data-window-focused='false'] .window-frame {
		background: var(--window-bg-inactive), var(--window-surface);
		box-shadow: 0 18px 46px rgba(33, 42, 70, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.62);
	}

	.native-shell-surface[data-window-effect='mica'][data-window-focused='false'] .window-frame::after {
		background: var(--window-wash-inactive);
		opacity: 0.96;
	}

	.native-shell-surface[data-window-effect='none'] .window-frame {
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}

	.mica-wash {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: var(--window-wash);
		opacity: 0.9;
		transition: opacity 160ms ease, filter 160ms ease;
	}

	.native-shell-surface[data-window-focused='false'] .mica-wash {
		opacity: 0.72;
		filter: saturate(0.82);
	}

	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.window-frame {
			background: var(--window-bg-inactive), var(--window-surface);
		}
	}

	@media (prefers-color-scheme: dark) {
		:global(body) {
			color: #f8fafc;
		}

		.native-shell-surface.theme-alpha {
			--shadow-deep: 0 24px 70px rgba(0, 0, 0, 0.26);
			--window-border: rgba(255, 255, 255, 0.08);
			--window-bg:
				radial-gradient(circle at 18% 10%, rgba(0, 177, 255, 0.18), transparent 28rem),
				radial-gradient(circle at 84% 16%, rgba(255, 45, 122, 0.16), transparent 26rem),
				linear-gradient(135deg, #101827 0%, #111827 52%, #181320 100%);
			--window-bg-plain: linear-gradient(180deg, rgba(18, 24, 38, 0.68), rgba(8, 13, 25, 0.52));
			--window-bg-mica: linear-gradient(180deg, rgba(18, 24, 38, 0.68), rgba(8, 13, 25, 0.52));
			--window-bg-inactive:
				linear-gradient(180deg, rgba(18, 24, 38, 0.74), rgba(8, 13, 25, 0.62)),
				linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0.006));
			--window-surface: rgba(15, 23, 42, 0.5);
		}
	}

	@media (max-width: 640px) {
		.native-shell-surface {
			padding: 0;
		}

		.window-frame {
			min-height: 100vh;
			border-radius: 0;
			border-left: 0;
			border-right: 0;
		}
	}
</style>
