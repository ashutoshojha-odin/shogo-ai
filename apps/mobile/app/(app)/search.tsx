// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.
/**
 * Native ChatGPT-style search page.
 *
 * Opened from the sidebar search icon. Web keeps the command-palette modal.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { observer } from 'mobx-react-lite'
import { formatDistanceToNow } from 'date-fns'
import { Folder, Key, Search, Star, Users, X } from 'lucide-react-native'
import { PlatformApi, type ApiKeyInfo } from '@shogo-ai/sdk'
import { useAuth } from '../../contexts/auth'
import { useResolvedTheme } from '../../contexts/theme'
import {
  useDomainHttp,
  useMemberCollection,
  useProjectCollection,
  useStarredProjectCollection,
  useWorkspaceCollection,
} from '../../contexts/domain'
import { useActiveWorkspace } from '../../hooks/useActiveWorkspace'
import { usePlatformConfig } from '../../lib/platform-config'
import { useNativeComposerDockPad } from '../../lib/use-native-composer-keyboard'
import { isNativePlatform, NATIVE_PHONE_GUTTER } from '../../lib/native-phone-layout'
import { nativeChatGptPalette } from '../../lib/native-chatgpt-theme'

const SEARCH_MIN_KEYBOARD_PAD = 8
const SEARCH_TAB_ROW_HEIGHT = 52
const SEARCH_PILL_HEIGHT = 36
const SEARCH_PILL_RADIUS = 18
const SEARCH_PILL_GAP = 8
const SEARCH_PILL_PAD_X = 14
/** Slightly warmer than `--color-muted` so idle pills read against the canvas. */
const SEARCH_PILL_IDLE = { dark: '#2a2a2a', light: '#f4f4f5' } as const
const SEARCH_PILL_COUNT_ACTIVE = {
  dark: 'rgba(13,13,13,0.55)',
  light: 'rgba(255,255,255,0.6)',
} as const

type SearchTab = 'all' | 'starred' | 'shared' | 'keys'

type SearchRow = {
  id: string
  title: string
  subtitle: string
  href: string
  kind: SearchTab
}

function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true
  return haystack.toLowerCase().includes(query)
}

function timeAgo(timestamp?: number | string | null): string {
  if (!timestamp) return ''
  const ms = typeof timestamp === 'number' ? timestamp : Date.parse(String(timestamp))
  if (!Number.isFinite(ms) || ms <= 0) return ''
  return formatDistanceToNow(new Date(ms), { addSuffix: true })
}

const ROW_ICON: Record<SearchTab, typeof Folder> = {
  all: Folder,
  starred: Star,
  shared: Users,
  keys: Key,
}

const SearchResultRow = memo(function SearchResultRow({
  row,
  onPress,
}: {
  row: SearchRow
  onPress: (row: SearchRow) => void
}) {
  const Icon = ROW_ICON[row.kind]
  return (
    <Pressable
      onPress={() => onPress(row)}
      accessibilityRole="button"
      accessibilityLabel={row.title}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-muted/60"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-muted">
        <Icon size={18} className="text-foreground" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[16px] font-medium text-foreground" numberOfLines={1}>
          {row.title}
        </Text>
        <Text className="mt-0.5 text-[13px] text-muted-foreground" numberOfLines={1}>
          {row.subtitle}
        </Text>
      </View>
    </Pressable>
  )
})

export default observer(function SearchPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const isDark = useResolvedTheme() === 'dark'
  const palette = nativeChatGptPalette(isDark)
  const pageBg = palette.canvas
  const { localMode } = usePlatformConfig()
  const projects = useProjectCollection()
  const workspaces = useWorkspaceCollection()
  const starredColl = useStarredProjectCollection()
  const membersColl = useMemberCollection()
  const workspace = useActiveWorkspace()
  const http = useDomainHttp()
  const platform = useMemo(() => new PlatformApi(http), [http])
  const inputRef = useRef<TextInput>(null)
  const insets = useSafeAreaInsets()
  const restKeyboardPad = Math.max(insets.bottom, SEARCH_MIN_KEYBOARD_PAD)
  const composerKeyboardPad = useNativeComposerDockPad({
    enabled: isNativePlatform(),
    restPad: restKeyboardPad,
    iosKeyboardAvoiding: false,
  })

  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<SearchTab>('all')
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (Platform.OS === 'web') {
      router.replace('/(app)' as any)
    }
  }, [router])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    // Without this the spinner never clears for a signed-out or still-hydrating
    // session, because `loading` only drops in the fetch's `finally`.
    if (!isAuthenticated || !user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        await Promise.all([
          workspaces.loadAll({}).catch(() => undefined),
          projects.loadAll().catch(() => undefined),
          starredColl.loadAll({ userId: user.id }).catch(() => undefined),
          localMode ? Promise.resolve() : membersColl.loadAll({ userId: user.id }).catch(() => undefined),
        ])
        if (workspace?.id) {
          const listed = await platform.listApiKeys(workspace.id).catch(() => [])
          if (!cancelled) setKeys(listed)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, localMode, membersColl, platform, projects, starredColl, user?.id, workspace?.id, workspaces])

  const allProjects = useMemo(() => {
    const list = (() => {
      try {
        return projects.all.slice()
      } catch {
        return [] as any[]
      }
    })()
    if (!workspace?.id) return list
    return list.filter((p: any) => p.workspaceId === workspace.id)
  }, [projects.all, workspace?.id])

  const starredProjects = useMemo(() => {
    if (!user?.id) return [] as any[]
    const ids = new Set(
      starredColl.all
        .filter((s: any) => s.userId === user.id)
        .map((s: any) => s.projectId),
    )
    return projects.all.filter((p: any) => ids.has(p.id))
  }, [projects.all, starredColl.all, user?.id])

  const sharedProjects = useMemo(() => {
    if (localMode || !user?.id) return [] as any[]
    const userMembers = membersColl.all.filter((m: any) => m.userId === user.id)
    const sharedWorkspaceIds = new Set(
      workspaces.all
        .filter((ws: any) => {
          const membership = userMembers.find((m: any) => m.workspaceId === ws.id)
          return membership && membership.role !== 'owner'
        })
        .map((ws: any) => ws.id),
    )
    return projects.all.filter((p: any) => sharedWorkspaceIds.has(p.workspaceId))
  }, [localMode, membersColl.all, projects.all, user?.id, workspaces.all])

  const q = query.trim().toLowerCase()

  /**
   * Filter every tab's source list once. The tab strip needs a count for each
   * tab and the list needs the rows for the selected one, so filtering per
   * consumer would run the same predicate over the same arrays twice. Sorting
   * stays out of here — only the selected tab is ever rendered.
   */
  const matches = useMemo(() => {
    const filterProjects = (list: any[]) =>
      list.filter((p: any) => matchesQuery(`${p.name ?? ''} ${p.description ?? ''}`, q))
    return {
      all: filterProjects(allProjects),
      starred: filterProjects(starredProjects),
      shared: filterProjects(sharedProjects),
      keys: keys.filter((k) => matchesQuery(`${k.name ?? ''} ${k.kind ?? ''}`, q)),
    }
  }, [allProjects, keys, q, sharedProjects, starredProjects])

  const rows = useMemo<SearchRow[]>(() => {
    if (tab === 'keys') {
      return matches.keys.map((k) => ({
        id: k.id,
        title: k.name || 'API key',
        subtitle: k.kind === 'device' ? 'Device' : 'API key',
        href: '/(app)/api-keys',
        kind: 'keys' as const,
      }))
    }
    return matches[tab]
      .slice()
      .sort((a: any, b: any) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .map((p: any) => ({
        id: p.id,
        title: p.name || 'Untitled project',
        subtitle: [p.description, timeAgo(p.updatedAt || p.createdAt)].filter(Boolean).join(' · ') || 'Project',
        href: `/(app)/projects/${p.id}?tab=chat-fullscreen`,
        kind: tab,
      }))
  }, [matches, tab])

  const tabs = useMemo(
    () => [
      { id: 'all' as const, label: 'All projects', count: matches.all.length },
      { id: 'starred' as const, label: 'Starred', count: matches.starred.length },
      ...(!localMode
        ? [{ id: 'shared' as const, label: 'Shared with me', count: matches.shared.length }]
        : []),
      { id: 'keys' as const, label: 'API keys', count: matches.keys.length },
    ],
    [localMode, matches],
  )

  const closeSearch = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/(app)' as any)
  }, [router])

  const openRow = useCallback(
    (row: SearchRow) => {
      router.push(row.href as any)
    },
    [router],
  )

  const renderRow = useCallback(
    ({ item }: { item: SearchRow }) => <SearchResultRow row={item} onPress={openRow} />,
    [openRow],
  )

  const emptyCopy =
    tab === 'keys'
      ? q
        ? 'No API keys match that search'
        : 'No API keys yet'
      : q
        ? 'No projects match that search'
        : tab === 'starred'
          ? 'No starred projects'
          : tab === 'shared'
            ? 'Nothing shared with you yet'
            : 'No projects yet'

  if (Platform.OS === 'web') return null

  return (
    <View className="flex-1 bg-background" style={{ flex: 1, paddingTop: insets.top, backgroundColor: pageBg }}>
      <View className="flex-1">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ height: SEARCH_TAB_ROW_HEIGHT, flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            paddingHorizontal: NATIVE_PHONE_GUTTER,
            alignItems: 'center',
            height: SEARCH_TAB_ROW_HEIGHT,
          }}
        >
          {tabs.map((item) => {
            const active = tab === item.id
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  height: SEARCH_PILL_HEIGHT,
                  marginRight: SEARCH_PILL_GAP,
                  paddingHorizontal: SEARCH_PILL_PAD_X,
                  borderRadius: SEARCH_PILL_RADIUS,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: active
                    ? palette.text
                    : (isDark ? SEARCH_PILL_IDLE.dark : SEARCH_PILL_IDLE.light),
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    fontWeight: '500',
                    color: active ? palette.onAccent : palette.text,
                    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    marginLeft: 6,
                    fontSize: 13,
                    lineHeight: 18,
                    color: active
                      ? (isDark ? SEARCH_PILL_COUNT_ACTIVE.dark : SEARCH_PILL_COUNT_ACTIVE.light)
                      : palette.mutedText,
                    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
                  }}
                >
                  {item.count}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : rows.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Search size={44} className="text-muted-foreground/70" />
            <Text className="mt-4 text-center text-base text-muted-foreground">{emptyCopy}</Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 12 }}
          />
        )}
      </View>

      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: composerKeyboardPad,
          backgroundColor: pageBg,
        }}
      >
        <View className="h-12 min-w-0 flex-1 flex-row items-center rounded-full bg-muted px-4">
          <Search size={18} className="text-muted-foreground" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={palette.mutedText}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            className="ml-2 flex-1 text-[16px] text-foreground"
            style={{ fontSize: 16, lineHeight: 20, paddingVertical: 0 }}
            accessibilityLabel="Search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <X size={16} className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={closeSearch}
          accessibilityLabel="Close search"
          className="ml-2 h-12 w-12 items-center justify-center rounded-full bg-muted"
        >
          <X size={20} className="text-foreground" />
        </Pressable>
      </Animated.View>
    </View>
  )
})
