import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, LogOut, User } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import type { Profile, Household } from '@/types/app'

function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [nameEdited, setNameEdited] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data as Profile
    },
    staleTime: 60_000,
  })

  const { data: household, isLoading: householdLoading } = useQuery<Household>({
    queryKey: ['household'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .single()
      if (error) throw error
      return data as Household
    },
    enabled: !!profile?.household_id,
    staleTime: 60_000,
  })

  const updateName = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
      setNameEdited(false)
    },
  })

  const currentName = nameEdited ? displayName : (profile?.display_name ?? '')

  function handleNameChange(value: string) {
    setDisplayName(value)
    setNameEdited(true)
  }

  function handleNameBlur() {
    if (nameEdited && displayName.trim() && displayName.trim() !== profile?.display_name) {
      updateName.mutate(displayName.trim())
    } else {
      setNameEdited(false)
    }
  }

  async function handleCopyInviteCode() {
    if (!household?.invite_code) return
    await navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    void navigate({ to: '/auth/login' })
  }

  const isLoading = profileLoading || householdLoading

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader title="Einstellungen" />

      <div className="px-4 space-y-6 mt-2">
        {/* Profile section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
            Profil
          </h2>
          <div className="bg-white rounded-2xl border border-border divide-y divide-border">
            <div className="flex items-center gap-3 p-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-muted-foreground mb-1">Anzeigename</label>
                {isLoading ? (
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                ) : (
                  <Input
                    value={currentName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    className="h-8 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent text-sm"
                    placeholder="Dein Name"
                  />
                )}
              </div>
              {updateName.isPending && (
                <span className="text-xs text-muted-foreground">Wird gespeichert…</span>
              )}
            </div>
          </div>
        </section>

        {/* Household section */}
        {profile?.household_id && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Haushalt
            </h2>
            <div className="bg-white rounded-2xl border border-border divide-y divide-border">
              <button
                onClick={handleCopyInviteCode}
                disabled={!household?.invite_code}
                className="w-full flex items-center gap-3 p-4 text-left active:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Einladungscode</p>
                  {householdLoading ? (
                    <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                  ) : (
                    <p className="font-mono font-semibold tracking-widest text-base">
                      {household?.invite_code ?? '—'}
                    </p>
                  )}
                </div>
                {copied ? (
                  <Check className="h-4 w-4 text-accent flex-shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground">
                  Teile diesen Code mit deinem Partner, um denselben Haushalt zu nutzen.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Account section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
            Konto
          </h2>
          <div className="bg-white rounded-2xl border border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 text-left text-destructive active:bg-muted/50 transition-colors rounded-2xl"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Abmelden</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})
