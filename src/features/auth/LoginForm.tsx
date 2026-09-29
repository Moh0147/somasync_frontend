import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { useAuth } from './AuthContext'
import { roleHomeRoute } from './roleRoutes'

interface LocationState {
  from?: { pathname: string }
}

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!username.trim() || !password) {
      setFormError('Enter your username and password.')
      return
    }

    setIsSubmitting(true)
    try {
      const loggedInUser = await login(username.trim(), password)
      const state = location.state as LocationState | null
      const redirectTo = state?.from?.pathname ?? roleHomeRoute[loggedInUser.role]
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          setFormError('Network error. Check your connection and try again.')
        } else if (error.response.status === 401 || error.response.status === 400) {
          setFormError('Incorrect username or password.')
        } else if (error.response.status === 429) {
          setFormError('Too many attempts. Try again in a moment.')
        } else {
          setFormError('Something went wrong. Please try again.')
        }
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Username"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={isSubmitting}
      />
      {formError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
