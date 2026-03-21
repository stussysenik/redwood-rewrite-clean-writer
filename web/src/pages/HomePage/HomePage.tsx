import { useEffect } from 'react'

import { navigate, routes } from '@redwoodjs/router'
import { Metadata } from '@redwoodjs/web'

import { useAuth } from 'src/auth'

/**
 * HomePage -- Landing route that redirects based on auth state.
 *
 * Authenticated users are sent straight to /write.
 * Unauthenticated users are sent to /login.
 */
const HomePage = () => {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        navigate(routes.writer())
      } else {
        navigate(routes.login())
      }
    }
  }, [isAuthenticated, loading])

  return (
    <>
      <Metadata title="Home" />
      {/* Blank while redirecting */}
    </>
  )
}

export default HomePage
