import { useEffect, useRef } from 'react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'
import { Link, navigate, routes } from '@redwoodjs/router'
import { Metadata } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

/**
 * LoginPage -- Clean Writer login form.
 *
 * Minimal, distraction-free design using the Classic theme palette.
 * Redirects authenticated users to the home page.
 */
const LoginPage = () => {
  const { isAuthenticated, loading, logIn } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await logIn({
      username: data.email,
      password: data.password,
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Welcome back!')
    }
  }

  if (loading) {
    return null
  }

  return (
    <>
      <Metadata title="Login" />

      <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />

      {/* Logo / app name */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-light tracking-wide"
          style={{ color: '#333333' }}
        >
          Clean Writer
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#999999' }}>
          Sign in to continue writing
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-lg p-8"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E4DF',
        }}
      >
        <Form onSubmit={onSubmit}>
          <Label
            name="email"
            className="block text-sm font-medium mb-1"
            errorClassName="block text-sm font-medium mb-1 text-red-600"
            style={{ color: '#555555' }}
          >
            Email
          </Label>
          <TextField
            name="email"
            ref={emailRef}
            className="w-full px-3 py-2 rounded text-sm outline-none transition-colors"
            errorClassName="w-full px-3 py-2 rounded text-sm outline-none border-red-400"
            style={{
              border: '1px solid #DDD8D0',
              color: '#333333',
              backgroundColor: '#FDFBF7',
            }}
            autoFocus
            validation={{
              required: { value: true, message: 'Email is required' },
            }}
          />
          <FieldError
            name="email"
            className="text-xs mt-1"
            style={{ color: '#E53E3E' }}
          />

          <Label
            name="password"
            className="block text-sm font-medium mb-1 mt-5"
            errorClassName="block text-sm font-medium mb-1 mt-5 text-red-600"
            style={{ color: '#555555' }}
          >
            Password
          </Label>
          <PasswordField
            name="password"
            className="w-full px-3 py-2 rounded text-sm outline-none transition-colors"
            errorClassName="w-full px-3 py-2 rounded text-sm outline-none border-red-400"
            style={{
              border: '1px solid #DDD8D0',
              color: '#333333',
              backgroundColor: '#FDFBF7',
            }}
            autoComplete="current-password"
            validation={{
              required: { value: true, message: 'Password is required' },
            }}
          />
          <FieldError
            name="password"
            className="text-xs mt-1"
            style={{ color: '#E53E3E' }}
          />

          <div className="text-right mt-1">
            <Link
              to={routes.forgotPassword()}
              className="text-xs hover:underline"
              style={{ color: '#F15060' }}
            >
              Forgot password?
            </Link>
          </div>

          <div className="mt-6">
            <Submit
              className="w-full py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#F15060' }}
            >
              Sign In
            </Submit>
          </div>
        </Form>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm mt-6" style={{ color: '#999999' }}>
        Don&apos;t have an account?{' '}
        <Link
          to={routes.signup()}
          className="font-medium hover:underline"
          style={{ color: '#F15060' }}
        >
          Sign up
        </Link>
      </p>
    </>
  )
}

export default LoginPage
