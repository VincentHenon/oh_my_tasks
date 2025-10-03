import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/settings')
  }

  return <SettingsClient />
}
