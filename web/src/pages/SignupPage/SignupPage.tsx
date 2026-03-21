import { useEffect, useRef } from 'react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  FieldError,
  Submit,
} from '@redwoodjs/forms'
import { Link, navigate, routes } from '@redwoodjs/router'
import { Metadata } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

/**
 * SignupPage -- Clean Writer account creation form.
 *
 * Minimal design with the Classic theme accent colour (#F15060) for the CTA.
 * After successful signup the user is automatically logged in.
 */
const SignupPage = () => {
  const { isAuthenticated, signUp } = useAuth()

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
    const response = await signUp({
      username: data.email,
      password: data.password,
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Welcome!')
    }
  }

  return (
    <>
      <Metadata title="Sign Up" />

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
          Create your account
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
            autoComplete="new-password"
            validation={{
              required: { value: true, message: 'Password is required' },
            }}
          />
          <FieldError
            name="password"
            className="text-xs mt-1"
            style={{ color: '#E53E3E' }}
          />

          <div className="mt-6">
            <Submit
              className="w-full py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: '#F15060' }}
            >
              Sign Up
            </Submit>
          </div>
        </Form>
      </div>

      {/* Footer link */}
      <p className="text-center text-sm mt-6" style={{ color: '#999999' }}>
        Already have an account?{' '}
        <Link
          to={routes.login()}
          className="font-medium hover:underline"
          style={{ color: '#F15060' }}
        >
          Sign in
        </Link>
      </p>
    </>
  )
}

export default SignupPage
