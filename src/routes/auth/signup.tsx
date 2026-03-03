import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { generateInviteCode } from '@/lib/utils'

const signupSchema = z.object({
  display_name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  household_mode: z.enum(['create', 'join']),
  household_name: z.string().optional(),
  invite_code: z.string().optional(),
})

type SignupForm = z.infer<typeof signupSchema>

function SignupPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'create' | 'join'>('create')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { household_mode: 'create' },
  })

  const onSubmit = async (data: SignupForm) => {
    try {
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned')

      const userId = authData.user.id

      let householdId: string

      if (data.household_mode === 'create') {
        // 2a. Create household
        const inviteCode = generateInviteCode()
        const { data: household, error: hhError } = await supabase
          .from('households')
          .insert({
            name: data.household_name ?? `${data.display_name}'s Kitchen`,
            invite_code: inviteCode,
          })
          .select('id')
          .single()

        if (hhError) throw hhError
        householdId = household.id
      } else {
        // 2b. Find household by invite code
        const { data: household, error: hhError } = await supabase
          .from('households')
          .select('id')
          .eq('invite_code', data.invite_code?.toUpperCase() ?? '')
          .single()

        if (hhError) throw new Error('Invalid invite code')
        householdId = household.id
      }

      // 3. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        household_id: householdId,
        display_name: data.display_name,
      })

      if (profileError) throw profileError

      toast({ title: 'Willkommen bei Rezzi! 🍳' })
      void navigate({ to: '/' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen'
      toast({ title: 'Registrierung fehlgeschlagen', description: message, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🍳</div>
          <h1 className="text-2xl font-bold">Konto erstellen</h1>
          <p className="text-muted-foreground mt-1 text-sm">Starte deine gemeinsame Rezeptsammlung</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Dein Name</Label>
            <Input id="display_name" placeholder="Alex" {...register('display_name')} />
            {errors.display_name && <p className="text-xs text-destructive">{errors.display_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Household mode toggle */}
          <div className="space-y-3">
            <Label>Haushalt</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`rounded-xl border p-3 text-sm font-medium transition-colors ${
                  mode === 'create'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-white'
                }`}
              >
                Neu erstellen
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className={`rounded-xl border p-3 text-sm font-medium transition-colors ${
                  mode === 'join'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-white'
                }`}
              >
                Bestehendem beitreten
              </button>
            </div>

            <input type="hidden" value={mode} {...register('household_mode')} />

            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="household_name" className="text-sm text-muted-foreground">
                  Küchenname (optional)
                </Label>
                <Input
                  id="household_name"
                  placeholder="Unsere Küche"
                  {...register('household_name')}
                />
              </div>
            )}

            {mode === 'join' && (
              <div className="space-y-2">
                <Label htmlFor="invite_code" className="text-sm text-muted-foreground">
                  Einladungscode
                </Label>
                <Input
                  id="invite_code"
                  placeholder="e.g. AB3X7Y2Z"
                  className="uppercase tracking-widest font-mono"
                  {...register('invite_code')}
                />
                <p className="text-xs text-muted-foreground">
                  Frage deinen Partner nach dem Einladungscode aus den Einstellungen
                </p>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Konto wird erstellt...' : 'Konto erstellen'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Bereits ein Konto?{' '}
          <Link to="/auth/login" className="text-primary font-medium">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth/signup')({
  component: SignupPage,
})
