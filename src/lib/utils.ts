import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(mins: number | null): string {
  if (!mins) return ''
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function scaleIngredientAmount(amount: string, factor: number): string {
  // Try to parse as a number or fraction
  const fractionMatch = amount.match(/^(\d+)\/(\d+)$/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1]!)
    const den = parseInt(fractionMatch[2]!)
    const scaled = (num / den) * factor
    return formatDecimal(scaled)
  }

  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  return formatDecimal(num * factor)
}

function formatDecimal(n: number): string {
  if (n === Math.floor(n)) return n.toString()
  // Try common fractions
  const fractions: [number, string][] = [
    [0.25, '¼'],
    [0.33, '⅓'],
    [0.5, '½'],
    [0.67, '⅔'],
    [0.75, '¾'],
  ]
  const whole = Math.floor(n)
  const frac = n - whole
  for (const [val, sym] of fractions) {
    if (Math.abs(frac - val) < 0.05) {
      return whole > 0 ? `${whole}${sym}` : sym
    }
  }
  return parseFloat(n.toFixed(1)).toString()
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
