import { hashPassword } from '@redwoodjs/auth-dbauth-api'

import { db } from 'api/src/lib/db'

export default async () => {
  try {
    const [hashedPassword, salt] = hashPassword('testpass123')

    const user = await db.user.create({
      data: {
        email: 'test@cleanwriter.app',
        hashedPassword,
        salt,
        settings: { create: {} },
        themeConfig: { create: {} },
      },
    })

    await db.document.create({
      data: {
        userId: user.id,
        title: 'Welcome',
        content: 'Start writing here...',
      },
    })

    console.log('Seeded user:', user.email)
  } catch (error) {
    console.error(error)
  }
}
