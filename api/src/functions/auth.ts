import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

import { DbAuthHandler } from '@redwoodjs/auth-dbauth-api'
import type { DbAuthHandlerOptions, UserType } from '@redwoodjs/auth-dbauth-api'

import { cookieName } from 'src/lib/auth'
import { db } from 'src/lib/db'

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
) => {
  const forgotPasswordOptions: DbAuthHandlerOptions['forgotPassword'] = {
    handler: (user) => {
      return user
    },

    // How long the resetToken is valid for, in seconds (default is 24 hours)
    expires: 60 * 60 * 24,

    errors: {
      usernameNotFound: 'Username not found',
      usernameRequired: 'Username is required',
    },
  }

  const loginOptions: DbAuthHandlerOptions['login'] = {
    handler: (user) => {
      return user
    },

    errors: {
      usernameOrPasswordMissing: 'Both email and password are required',
      usernameNotFound: 'Email ${username} not found',
      incorrectPassword: 'Incorrect password for ${username}',
    },

    // Stay logged in for 10 years
    expires: 60 * 60 * 24 * 365 * 10,
  }

  const resetPasswordOptions: DbAuthHandlerOptions['resetPassword'] = {
    handler: (_user) => {
      return true
    },

    allowReusedPassword: true,

    errors: {
      resetTokenExpired: 'resetToken is expired',
      resetTokenInvalid: 'resetToken is invalid',
      resetTokenRequired: 'resetToken is required',
      reusedPassword: 'Must choose a new password',
    },
  }

  const signupOptions: DbAuthHandlerOptions<UserType>['signup'] = {
    // On signup, create the user along with default UserSettings and ThemeConfig
    handler: ({ username, hashedPassword, salt }) => {
      return db.user.create({
        data: {
          email: username,
          hashedPassword,
          salt,
          settings: { create: {} },
          themeConfig: { create: {} },
        },
      })
    },

    passwordValidation: (_password) => {
      return true
    },

    errors: {
      fieldMissing: '${field} is required',
      usernameTaken: 'Email `${username}` already in use',
    },
  }

  const authHandler = new DbAuthHandler(event, context, {
    // Provide prisma db client
    db: db,

    // The name of the property you'd call on `db` to access your user table.
    authModelAccessor: 'user',

    // A map of what dbAuth calls a field to what your database calls it.
    authFields: {
      id: 'id',
      username: 'email',
      hashedPassword: 'hashedPassword',
      salt: 'salt',
      resetToken: 'resetToken',
      resetTokenExpiresAt: 'resetTokenExpiresAt',
    },

    // Cookie configuration
    cookie: {
      attributes: {
        HttpOnly: true,
        Path: '/',
        SameSite: 'Strict',
        Secure: process.env.NODE_ENV === 'production',
      },
      name: cookieName,
    },

    forgotPassword: forgotPasswordOptions,
    login: loginOptions,
    resetPassword: resetPasswordOptions,
    signup: signupOptions,
  })

  return await authHandler.invoke()
}
