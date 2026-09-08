// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.
/**
 * Two-layer native drawer frame: `sidebar` sits underneath, `children` are the
 * current screen rendered as a clipped sheet that slides right to reveal it.
 *
 * When `drawer.enabled` is false this collapses to a plain flex column, which
 * is what web and desktop render.
 */
import type { ReactNode } from 'react'
import { Animated, View } from 'react-native'
import {
  nativeDrawerUnderlayStyle,
  type NativeSheetDrawer,
} from '../../lib/use-native-drawer-swipe'

const CLIP_FRAME = { flex: 1, overflow: 'hidden' } as const
const SHEET_FRAME = { flex: 1, zIndex: 1 } as const

export function NativeSheetDrawerShell({
  drawer,
  isDark,
  sidebar,
  children,
}: {
  drawer: NativeSheetDrawer
  isDark: boolean
  sidebar: ReactNode
  children: ReactNode
}) {
  const { enabled, drawerOpen, drawerWidth, swipeHandlers, sheetStyle, sheetClipStyle } = drawer

  return (
    <View style={CLIP_FRAME} collapsable={false}>
      {enabled ? (
        <View
          pointerEvents={drawerOpen ? 'auto' : 'none'}
          accessibilityElementsHidden={!drawerOpen}
          importantForAccessibility={drawerOpen ? 'auto' : 'no-hide-descendants'}
          style={nativeDrawerUnderlayStyle(drawerWidth, isDark)}
        >
          {sidebar}
        </View>
      ) : null}
      <Animated.View
        collapsable={false}
        {...swipeHandlers}
        style={[SHEET_FRAME, enabled ? sheetStyle : undefined]}
      >
        <Animated.View style={enabled ? sheetClipStyle : CLIP_FRAME}>{children}</Animated.View>
      </Animated.View>
    </View>
  )
}
