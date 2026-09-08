// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.
import { describe, expect, it } from 'bun:test'
import {
  CHATGPT_COMPOSER,
  hexToRgbChannels,
  nativeChatGptCssVars,
  nativeChatGptPalette,
  NATIVE_CHATGPT_PALETTE,
} from '../native-chatgpt-theme'

/**
 * The CSS variables below are the literals the Gluestack provider used before
 * they were derived from the hex palette. Keeping them spelled out here is the
 * guard that the refactor did not shift a single channel.
 */
const LIGHT_VARS_BEFORE_REFACTOR = {
  '--color-background': '255 255 255',
  '--color-foreground': '13 13 13',
  '--color-card': '255 255 255',
  '--color-card-foreground': '13 13 13',
  '--color-popover': '255 255 255',
  '--color-popover-foreground': '13 13 13',
  '--color-muted': '244 244 244',
  '--color-muted-foreground': '142 142 142',
  '--color-border': '229 229 229',
  '--color-secondary': '244 244 244',
  '--color-secondary-foreground': '13 13 13',
  '--color-accent': '244 244 244',
  '--color-accent-foreground': '13 13 13',
  '--color-input': '229 229 229',
}

const DARK_VARS_BEFORE_REFACTOR = {
  '--color-background': '0 0 0',
  '--color-foreground': '236 236 236',
  '--color-card': '33 33 33',
  '--color-card-foreground': '236 236 236',
  '--color-popover': '33 33 33',
  '--color-popover-foreground': '236 236 236',
  '--color-muted': '47 47 47',
  '--color-muted-foreground': '142 142 142',
  '--color-border': '62 62 62',
  '--color-secondary': '47 47 47',
  '--color-secondary-foreground': '236 236 236',
  '--color-accent': '47 47 47',
  '--color-accent-foreground': '236 236 236',
  '--color-input': '62 62 62',
}

describe('hexToRgbChannels', () => {
  it('expands shorthand hex', () => {
    expect(hexToRgbChannels('#fff')).toBe('255 255 255')
    expect(hexToRgbChannels('#000')).toBe('0 0 0')
  })

  it('converts full hex', () => {
    expect(hexToRgbChannels('#0d0d0d')).toBe('13 13 13')
    expect(hexToRgbChannels('#212121')).toBe('33 33 33')
    expect(hexToRgbChannels('#ececec')).toBe('236 236 236')
  })
})

describe('nativeChatGptCssVars', () => {
  it('matches the values the provider hardcoded before the palette existed', () => {
    expect(nativeChatGptCssVars('light')).toEqual(LIGHT_VARS_BEFORE_REFACTOR)
    expect(nativeChatGptCssVars('dark')).toEqual(DARK_VARS_BEFORE_REFACTOR)
  })
})

describe('CHATGPT_COMPOSER', () => {
  it('keeps the composer tokens the composers shipped with', () => {
    expect(CHATGPT_COMPOSER.light).toEqual({
      fill: '#ffffff',
      border: '#e5e5e5',
      borderFocus: '#cfcfcf',
      text: '#0d0d0d',
      placeholder: '#8e8e8e',
      icon: '#0d0d0d',
      sendFill: '#0d0d0d',
      sendIcon: '#ffffff',
    })
    expect(CHATGPT_COMPOSER.dark).toEqual({
      fill: '#212121',
      border: 'rgba(255,255,255,0.08)',
      borderFocus: 'rgba(255,255,255,0.16)',
      text: '#ececec',
      placeholder: '#8e8e8e',
      icon: '#ececec',
      sendFill: '#ffffff',
      sendIcon: '#0d0d0d',
    })
  })
})

describe('nativeChatGptPalette', () => {
  it('selects by mode', () => {
    expect(nativeChatGptPalette(true)).toBe(NATIVE_CHATGPT_PALETTE.dark)
    expect(nativeChatGptPalette(false)).toBe(NATIVE_CHATGPT_PALETTE.light)
  })

  it('keeps the canvas true black / true white', () => {
    expect(NATIVE_CHATGPT_PALETTE.dark.canvas).toBe('#000000')
    expect(NATIVE_CHATGPT_PALETTE.light.canvas).toBe('#ffffff')
  })
})
