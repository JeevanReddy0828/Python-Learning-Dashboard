export const XP_PER_LEVEL = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700, 7500]

export function computeLevel(totalXP: number): number {
  for (let i = 0; i < XP_PER_LEVEL.length; i++) {
    if (totalXP < XP_PER_LEVEL[i]) return Math.max(1, i)
  }
  const extra = totalXP - XP_PER_LEVEL[XP_PER_LEVEL.length - 1]
  return 10 + Math.floor(extra / 2000)
}

export function xpToNextLevel(level: number): number {
  if (level < XP_PER_LEVEL.length) return XP_PER_LEVEL[level]
  return XP_PER_LEVEL[XP_PER_LEVEL.length - 1] + (level - 10 + 1) * 2000
}

export function xpProgressInLevel(totalXP: number, level: number): { current: number; needed: number; percent: number } {
  const currentLevelStart = level > 1 ? XP_PER_LEVEL[level - 1] ?? 0 : 0
  const nextLevelStart = xpToNextLevel(level)
  const current = totalXP - currentLevelStart
  const needed = nextLevelStart - currentLevelStart
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) }
}
