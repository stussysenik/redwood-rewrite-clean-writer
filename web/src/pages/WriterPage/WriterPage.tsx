import { Metadata } from '@redwoodjs/web'

import { useAuth } from 'src/auth'

/**
 * WriterPage -- Placeholder for the main writing interface.
 *
 * This will become the full editor in a later task. For now it simply
 * confirms the user is authenticated and provides a logout button.
 */
const WriterPage = () => {
  const { currentUser, logOut } = useAuth()

  return (
    <>
      <Metadata title="Write" />

      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: '#FDFBF7', color: '#333333' }}
      >
        <h1 className="text-2xl font-light tracking-wide mb-4">
          Clean Writer
        </h1>
        <p className="text-sm mb-6" style={{ color: '#999999' }}>
          Logged in as {(currentUser as { email?: string })?.email ?? 'unknown'}
        </p>
        <button
          onClick={logOut}
          className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: '#F15060' }}
        >
          Log Out
        </button>
      </div>
    </>
  )
}

export default WriterPage
