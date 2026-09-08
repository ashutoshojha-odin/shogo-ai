// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.
import React, { useEffect, useMemo } from 'react';
import { config } from './config';
import { View, ViewProps, Platform } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { useColorScheme, vars } from 'nativewind';
import { useAccentTheme, getAccentVars } from '../../../contexts/accent-theme';
import { nativeChatGptCssVars } from '../../../lib/native-chatgpt-theme';

export type ModeType = 'light' | 'dark' | 'system';

/**
 * Native-only ChatGPT iOS surface tokens. Web keeps `config.ts` / global.css
 * so desktop is unchanged.
 */
const nativeChatGptSurfaces = {
  light: vars(nativeChatGptCssVars('light')),
  dark: vars(nativeChatGptCssVars('dark')),
} as const;

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { accent } = useAccentTheme();

  useEffect(() => {
    setColorScheme(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const resolvedMode = colorScheme === 'dark' ? 'dark' : 'light';
  const accentOverrides = useMemo(
    () => vars(getAccentVars(accent, resolvedMode)),
    [accent, resolvedMode],
  );

  return (
    <View
      style={[
        config[colorScheme!],
        Platform.OS !== 'web' ? nativeChatGptSurfaces[resolvedMode] : null,
        accentOverrides,
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
