/**
 * AuthLayout -- Centered, minimal layout for authentication pages.
 *
 * Uses the Clean Writer "Classic" theme colours so the auth flow
 * feels cohesive with the writing experience from the very first screen.
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div
    className="flex items-center justify-center"
    style={{ minHeight: '100dvh', backgroundColor: '#FDFBF7', color: '#333333' }}
  >
    <div className="w-full max-w-md px-8">{children}</div>
  </div>
)

export default AuthLayout
