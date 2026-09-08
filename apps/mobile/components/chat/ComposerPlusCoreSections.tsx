// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Shogo Technologies, Inc.
/**
 * The Mode + Environment rows every native plus sheet shows, shared by the
 * project composer (`ChatInput`) and the home composer (`CompactChatInput`).
 *
 * Lives outside `ComposerPlusMenu` so that module stays free of the
 * `EnvironmentPicker` → `ComposerPlusMenu` import cycle.
 */
import { Cloud } from "lucide-react-native"
import { ComposerPlusModeList, ComposerPlusSection } from "./ComposerPlusMenu"
import { EnvironmentPicker } from "./EnvironmentPicker"

type ModeOption<T extends string> = Parameters<typeof ComposerPlusModeList<T>>[0]["modes"][number]

export function ComposerPlusCoreSections<T extends string>({
  modes,
  interactionMode,
  currentModeLabel,
  CurrentModeIcon,
  onInteractionModeChange,
  dualPlan,
  onDualPlanChange,
  dualPlanDisabled,
  dualPlanTestId,
  expandedId,
  environmentDisabled,
}: {
  modes: ModeOption<T>[]
  interactionMode: T
  currentModeLabel: string
  CurrentModeIcon: ModeOption<T>["Icon"]
  onInteractionModeChange: (id: T) => void
  dualPlan?: boolean
  onDualPlanChange?: (next: boolean) => void
  dualPlanDisabled?: boolean
  dualPlanTestId?: string
  expandedId: string | null
  environmentDisabled?: boolean
}) {
  return (
    <>
      <ComposerPlusSection id="mode" label="Mode" value={currentModeLabel} Icon={CurrentModeIcon}>
        <ComposerPlusModeList
          modes={modes}
          selectedId={interactionMode}
          onSelect={onInteractionModeChange}
          dualPlan={dualPlan}
          onDualPlanChange={onDualPlanChange}
          dualPlanDisabled={dualPlanDisabled}
          dualPlanTestId={dualPlanTestId}
        />
      </ComposerPlusSection>
      <ComposerPlusSection id="environment" label="Environment" Icon={Cloud}>
        <EnvironmentPicker
          disabled={environmentDisabled}
          presentation="list"
          listActive={expandedId === "environment"}
        />
      </ComposerPlusSection>
    </>
  )
}
