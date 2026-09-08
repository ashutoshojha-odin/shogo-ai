// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.

import { useEffect, useRef } from 'react'
import { Animated, Dimensions, Easing, Keyboard, Platform } from 'react-native'
import {
  nativeComposerDockBottomPad,
  nativeComposerKeyboardDuration,
  nativeComposerKeyboardOpenFromSource,
  nativeComposerKeyboardOverlap,
  NATIVE_COMPOSER_KEYBOARD_EASING,
  type NativeComposerKeyboardEvent,
  type NativeComposerKeyboardSource,
} from './native-composer-keyboard'

export function nativeComposerKeyboardEasing() {
  return Easing.bezier(
    NATIVE_COMPOSER_KEYBOARD_EASING[0],
    NATIVE_COMPOSER_KEYBOARD_EASING[1],
    NATIVE_COMPOSER_KEYBOARD_EASING[2],
    NATIVE_COMPOSER_KEYBOARD_EASING[3],
  )
}

export function nativeComposerKeyboardOverlapFromEvent(
  event: NativeComposerKeyboardEvent,
): number {
  return nativeComposerKeyboardOverlap(event.endCoordinates, Dimensions.get('window').height)
}

export function subscribeNativeComposerKeyboard(
  listener: (event: NativeComposerKeyboardEvent, source: NativeComposerKeyboardSource) => void,
): () => void {
  const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
  const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
  const showSub = Keyboard.addListener(showEvent, (event) => listener(event, 'show'))
  const hideSub = Keyboard.addListener(hideEvent, (event) => listener(event, 'hide'))
  const changeSub =
    Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillChangeFrame', (event) => listener(event, 'change'))
      : undefined
  return () => {
    showSub.remove()
    hideSub.remove()
    changeSub?.remove()
  }
}

/** Subscribe once; the latest `onFrame` is read from a ref so callers can close over rest pads. */
export function useNativeComposerKeyboard(
  enabled: boolean,
  onFrame: (event: NativeComposerKeyboardEvent, source: NativeComposerKeyboardSource) => void,
): void {
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame
  useEffect(() => {
    if (!enabled) return
    return subscribeNativeComposerKeyboard((event, source) => {
      onFrameRef.current(event, source)
    })
  }, [enabled])
}

/**
 * Animated bottom padding that keeps a docked composer a fixed gap above the
 * keyboard. Returns the value to spread into a `paddingBottom` style.
 *
 * `restPad` may change while the keyboard is closed (rotation, safe-area
 * updates); the value is re-seeded in that case so the pill does not jump.
 */
export function useNativeComposerDockPad({
  enabled,
  restPad,
  iosKeyboardAvoiding,
}: {
  enabled: boolean
  restPad: number
  iosKeyboardAvoiding: boolean
}): Animated.Value {
  const pad = useRef(new Animated.Value(restPad)).current
  const restPadRef = useRef(restPad)
  restPadRef.current = restPad
  const keyboardOpenRef = useRef(false)

  useEffect(() => {
    if (!keyboardOpenRef.current) pad.setValue(restPad)
  }, [pad, restPad])

  useNativeComposerKeyboard(enabled, (event, source) => {
    const rest = restPadRef.current
    const overlap = nativeComposerKeyboardOverlapFromEvent(event)
    const keyboardOpen = nativeComposerKeyboardOpenFromSource(source, overlap, rest)
    if (keyboardOpen == null) return
    keyboardOpenRef.current = keyboardOpen
    Animated.timing(pad, {
      toValue: nativeComposerDockBottomPad({
        keyboardOpen,
        overlap,
        restPad: rest,
        iosKeyboardAvoiding,
      }),
      duration: nativeComposerKeyboardDuration(event.duration),
      easing: nativeComposerKeyboardEasing(),
      useNativeDriver: false,
    }).start()
  })

  return pad
}
