import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      toast({ title: 'Anmeldung fehlgeschlagen', description: error.message, variant: 'destructive' })
    } else {
      void navigate({ to: '/' })
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="text-6xl mb-3">🍳</div>
          <h1 className="text-3xl font-bold tracking-tight">Rezzi</h1>
          <p className="text-muted-foreground mt-1 text-sm">Deine gemeinsame Rezeptsammlung</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Anmelden...' : 'Anmelden'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Noch kein Konto?{' '}
          <Link to="/auth/signup" className="text-primary font-medium">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})
