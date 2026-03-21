import { useEffect, useRef, useState } from 'react'

import {
  Form,
  Label,
  PasswordField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'
import { navigate, routes } from '@redwoodjs/router'
import { Metadata } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

/**
 * ResetPasswordPage -- Allows the user to set a new password using a
 * reset token received via email.
 *
 * The token is validated on mount; if invalid the form is disabled.
 */
const ResetPasswordPage = ({ resetToken }: { resetToken: string }) => {
  const {
    isAuthenticated,
    reauthenticate,
    validateResetToken,
    resetPassword,
  } = useAuth()
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  useEffect(() => {
    const validateToken = async () => {
      const response = await validateResetToken(resetToken)
      if (response.error) {
        setEnabled(false)
        toast.error(response.error)
      } else {
        setEnabled(true)
      }
    }
    validateToken()
  }, [resetToken, validateResetToken])

  const passwordRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    passwordRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await resetPassword({
      resetToken,
      password: data.password,
    })

    if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Password changed!')
      await reauthenticate()
      navigate(routes.login())
    }
  }

  return (
    <>
      <Metadata title="Reset Password" />

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
          Choose a new password
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
            name="password"
            className="block text-sm font-medium mb-1"
            errorClassName="block text-sm font-medium mb-1 text-red-600"
            style={{ color: '#555555' }}
          >
            New Password
          </Label>
          <PasswordField
            name="password"
            autoComplete="new-password"
            ref={passwordRef}
            className="w-full px-3 py-2 rounded text-sm outline-none transition-colors"
            errorClassName="w-full px-3 py-2 rounded text-sm outline-none border-red-400"
            style={{
              border: '1px solid #DDD8D0',
              color: '#333333',
              backgroundColor: '#FDFBF7',
            }}
            disabled={!enabled}
            validation={{
              required: { value: true, message: 'New password is required' },
            }}
          />
          <FieldError
            name="password"
            className="text-xs mt-1"
            style={{ color: '#E53E3E' }}
          />

          <div className="mt-6">
            <Submit
              className="w-full py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#F15060' }}
              disabled={!enabled}
            >
              Reset Password
            </Submit>
          </div>
        </Form>
      </div>
    </>
  )
}

export default ResetPasswordPage
