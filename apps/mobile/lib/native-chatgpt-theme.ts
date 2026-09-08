// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.
/**
 * Native-only ChatGPT iOS surface palette.
 *
 * Single source of truth for every hard surface colour the native phone chrome
 * needs outside NativeWind: the drawer/home canvas, the composer pill, and the
 * Gluestack CSS variables. Web and desktop keep `global.css` / `config.ts`.
 *
 * Sourced from ChatGPT iOS 1.2026 App Store shots plus OpenAI product tokens.
 */

export type NativeThemeMode = 'light' | 'dark'

/**
 * Role-named surfaces. `canvas` is the page/drawer background; `raised` is the
 * composer pill and card fill, which only differs from `canvas` in dark mode.
 */
export const NATIVE_CHATGPT_PALETTE = {
  light: {
    canvas: '#ffffff',
    raised: '#ffffff',
    text: '#0d0d0d',
    /** Inverted text, e.g. the label on a filled send button or active pill. */
    onAccent: '#ffffff',
    muted: '#f4f4f4',
    mutedText: '#8e8e8e',
    border: '#e5e5e5',
    input: '#e5e5e5',
  },
  dark: {
    canvas: '#000000',
    raised: '#212121',
    text: '#ececec',
    onAccent: '#0d0d0d',
    muted: '#2f2f2f',
    mutedText: '#8e8e8e',
    border: '#3e3e3e',
    input: '#3e3e3e',
  },
} as const

export function nativeChatGptPalette(isDark: boolean) {
  return isDark ? NATIVE_CHATGPT_PALETTE.dark : NATIVE_CHATGPT_PALETTE.light
}

/**
 * Composer-specific view of the palette. `border` in dark mode is a translucent
 * white rather than the opaque `--color-border`, so the pill reads as raised
 * against both the canvas and the message list behind it.
 */
export const CHATGPT_COMPOSER = {
  light: {
    fill: NATIVE_CHATGPT_PALETTE.light.raised,
    border: NATIVE_CHATGPT_PALETTE.light.border,
    borderFocus: '#cfcfcf',
    text: NATIVE_CHATGPT_PALETTE.light.text,
    placeholder: NATIVE_CHATGPT_PALETTE.light.mutedText,
    icon: NATIVE_CHATGPT_PALETTE.light.text,
    sendFill: NATIVE_CHATGPT_PALETTE.light.text,
    sendIcon: NATIVE_CHATGPT_PALETTE.light.onAccent,
  },
  dark: {
    fill: NATIVE_CHATGPT_PALETTE.dark.raised,
    border: 'rgba(255,255,255,0.08)',
    borderFocus: 'rgba(255,255,255,0.16)',
    text: NATIVE_CHATGPT_PALETTE.dark.text,
    placeholder: NATIVE_CHATGPT_PALETTE.dark.mutedText,
    icon: NATIVE_CHATGPT_PALETTE.dark.text,
    sendFill: '#ffffff',
    sendIcon: NATIVE_CHATGPT_PALETTE.dark.onAccent,
  },
} as const

export function chatGptComposerColors(isDark: boolean) {
  return isDark ? CHATGPT_COMPOSER.dark : CHATGPT_COMPOSER.light
}

/** `#rrggbb` → the `"r g b"` channel string NativeWind's `vars()` expects. */
export function hexToRgbChannels(hex: string): string {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  const int = Number.parseInt(full, 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

/**
 * Gluestack/NativeWind CSS variables for a mode, derived from the palette above
 * so the raw colours and the CSS variables cannot drift apart.
 */
export function nativeChatGptCssVars(mode: NativeThemeMode): Record<string, string> {
  const p = NATIVE_CHATGPT_PALETTE[mode]
  const rgb = hexToRgbChannels
  return {
    '--color-background': rgb(p.canvas),
    '--color-foreground': rgb(p.text),
    '--color-card': rgb(p.raised),
    '--color-card-foreground': rgb(p.text),
    '--color-popover': rgb(p.raised),
    '--color-popover-foreground': rgb(p.text),
    '--color-muted': rgb(p.muted),
    '--color-muted-foreground': rgb(p.mutedText),
    '--color-border': rgb(p.border),
    '--color-secondary': rgb(p.muted),
    '--color-secondary-foreground': rgb(p.text),
    '--color-accent': rgb(p.muted),
    '--color-accent-foreground': rgb(p.text),
    '--color-input': rgb(p.input),
  }
}
