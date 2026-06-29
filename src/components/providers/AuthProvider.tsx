'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Lock, GraduationCap, UserPlus, LogIn } from 'lucide-react'
import { AuthContext } from '@/lib/auth-context'
import { clearLocalStorage } from '@/lib/store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth-token') ? null : false
  })
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    if (!token) return

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch(`/api/auth/verify?token=${token}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) {
          setUser(d.user)
          setAuthed(true)
        } else {
          localStorage.removeItem('auth-token')
          setAuthed(false)
        }
      })
      .catch(() => {
        localStorage.removeItem('auth-token')
        setAuthed(false)
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    setError('')
    if (!email || !password) { setError('Email and password required'); return }
    if (mode === 'register' && !name) { setError('Name required'); return }

    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login' ? { email, password } : { name, email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }

      localStorage.setItem('auth-token', data.token)
      setUser(data.user)
      setAuthed(true)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [mode, email, password, name])

  const logout = useCallback(() => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).catch(() => {})
    }
    localStorage.removeItem('auth-token')
    clearLocalStorage()
    setUser(null)
    setAuthed(false)
  }, [])

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    )
  }

  if (authed === true) {
    return (
      <AuthContext.Provider value={{ user, logout, isLoading: false }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-xl">GATE CSE 2027</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Sign in to your prep companion' : 'Create your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass">Password</Label>
            <Input id="pass" type="password" placeholder="At least 6 characters" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {mode === 'login' ? <><Lock className="h-4 w-4 mr-2" />Sign In</> : <><UserPlus className="h-4 w-4 mr-2" />Register</>}
          </Button>
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <button className="hover:underline cursor-pointer" onClick={() => { setMode('register'); setError('') }}>
                <LogIn className="h-3 w-3 inline mr-1" />Don&apos;t have an account? Register
              </button>
            ) : (
              <button className="hover:underline cursor-pointer" onClick={() => { setMode('login'); setError('') }}>
                <Lock className="h-3 w-3 inline mr-1" />Already have an account? Sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
