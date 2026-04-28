/**
 * Supabase client — used for real-time presence (who's studying now).
 * Falls back gracefully when VITE_SUPABASE_URL is not configured.
 *
 * Setup (optional):
 *  1. Create a free project at https://supabase.com
 *  2. Add to frontend/.env:
 *       VITE_SUPABASE_URL=https://xxxx.supabase.co
 *       VITE_SUPABASE_ANON_KEY=eyJ...
 *  3. In Supabase dashboard → Enable Realtime on any table (or use Broadcast only)
 */
import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = supabaseEnabled
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : null

// ── Presence helpers ─────────────────────────────────────────────────────────

type PresenceState = { user_id: string; display_name: string; location: string; online_at: string }

let activeChannel: RealtimeChannel | null = null

export function joinPresence(
  userId: string,
  displayName: string,
  location: string,
  onUpdate: (count: number, users: PresenceState[]) => void,
): () => void {
  if (!supabase) {
    onUpdate(0, [])
    return () => {}
  }

  // Leave previous channel
  if (activeChannel) {
    supabase.removeChannel(activeChannel)
    activeChannel = null
  }

  const channel = supabase.channel(`presence:${location}`, {
    config: { presence: { key: userId } },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>()
      const users = Object.values(state).flatMap(arr => arr)
      onUpdate(users.length, users)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          display_name: displayName,
          location,
          online_at: new Date().toISOString(),
        })
      }
    })

  activeChannel = channel
  return () => {
    if (supabase && activeChannel) {
      supabase.removeChannel(activeChannel)
      activeChannel = null
    }
  }
}
