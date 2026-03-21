import { Router, Route, Set, Private } from '@redwoodjs/router'

import AuthLayout from 'src/layouts/AuthLayout/AuthLayout'
import WriterLayout from 'src/layouts/WriterLayout/WriterLayout'

import { useAuth } from './auth'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      {/* Public auth routes wrapped in the centred AuthLayout */}
      <Set wrap={AuthLayout}>
        <Route path="/login" page={LoginPage} name="login" />
        <Route path="/signup" page={SignupPage} name="signup" />
        <Route path="/forgot-password" page={ForgotPasswordPage} name="forgotPassword" />
        <Route path="/reset-password" page={ResetPasswordPage} name="resetPassword" />
      </Set>

      {/* Authenticated routes wrapped in WriterLayout (theme provider) */}
      <Private unauthenticated="login">
        <Set wrap={WriterLayout}>
          <Route path="/write" page={WriterPage} name="writer" />
        </Set>
      </Private>

      {/* Home redirects to /write or /login based on auth state */}
      <Route path="/" page={HomePage} name="home" />

      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
