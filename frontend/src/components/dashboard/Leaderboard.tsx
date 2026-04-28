/**
 * XP Leaderboard — backed by Redis sorted sets on the backend.
 * Shows top 20 students by total XP with the current user highlighted.
 */
import { useEffect, useState } from 'react'
import { leaderboardApi } from '../../api'
import type { LeaderboardEntry } from '../../types'

const MEDALS = ['🥇', '🥈', '🥉']
const LEVEL_FOR_XP = (xp: number) => {
  const thresholds = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700, 7500]
  let lvl = 1
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) lvl = i + 1
  }
  return lvl
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    leaderboardApi.sync().catch(() => {})
    Promise.all([leaderboardApi.top(), leaderboardApi.myRank()])
      .then(([topRes, rankRes]) => {
        setEntries(topRes.data)
        setMyRank(rankRes.data.rank)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"/>
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl"/>
        ))}
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          🏆 XP Leaderboard
          <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Redis
          </span>
        </h3>
        {myRank && (
          <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
            Your rank: #{myRank}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-sm">Complete lessons to appear here!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const level = LEVEL_FOR_XP(entry.xp)
            const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  entry.is_me
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-700'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent'
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar initial */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: entry.is_me ? '#7C3AED' : `hsl(${(entry.rank * 47) % 360} 60% 55%)` }}
                >
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${entry.is_me ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    {entry.display_name}{entry.is_me && ' (you)'}
                  </p>
                  <p className="text-xs text-gray-400">Level {level}</p>
                </div>

                {/* XP */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{entry.xp.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
