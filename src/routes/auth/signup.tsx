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
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

      toast({ title: 'Welcome to Rezzi! 🍳' })
      void navigate({ to: '/' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      toast({ title: 'Sign up failed', description: message, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🍳</div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-1 text-sm">Start your shared recipe collection</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Your name</Label>
            <Input id="display_name" placeholder="Alex" {...register('display_name')} />
            {errors.display_name && <p className="text-xs text-destructive">{errors.display_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {/* Household mode toggle */}
          <div className="space-y-3">
            <Label>Household</Label>
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
                Create new
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
                Join existing
              </button>
            </div>

            <input type="hidden" value={mode} {...register('household_mode')} />

            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="household_name" className="text-sm text-muted-foreground">
                  Kitchen name (optional)
                </Label>
                <Input
                  id="household_name"
                  placeholder="Our Kitchen"
                  {...register('household_name')}
                />
              </div>
            )}

            {mode === 'join' && (
              <div className="space-y-2">
                <Label htmlFor="invite_code" className="text-sm text-muted-foreground">
                  Invite code
                </Label>
                <Input
                  id="invite_code"
                  placeholder="e.g. AB3X7Y2Z"
                  className="uppercase tracking-widest font-mono"
                  {...register('invite_code')}
                />
                <p className="text-xs text-muted-foreground">
                  Ask your partner for their invite code from Settings
                </p>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth/signup')({
  component: SignupPage,
})
