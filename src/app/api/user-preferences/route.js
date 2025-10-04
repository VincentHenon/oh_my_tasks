import { NextResponse } from 'next/server'

const SETTINGS_ENDPOINT = process.env.USER_SETTINGS_API_ENDPOINT
const SETTINGS_API_KEY = process.env.USER_SETTINGS_API_KEY

/**
 * API pour récupérer les utilisateurs avec des préférences spécifiques
 * Utilisée par les crons pour savoir qui envoyer des notifications
 */
export async function GET(request) {
  try {
    if (!SETTINGS_ENDPOINT) {
      console.warn('[user-preferences] USER_SETTINGS_API_ENDPOINT not configured')
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const notifyUpcoming = searchParams.get('notify_upcoming')
    const notifyOverdue = searchParams.get('notify_overdue')

    // Pour l'instant, on retourne ton utilisateur en dur
    // TODO: Modifier ton API PHP pour supporter la récupération de tous les utilisateurs
    const users = [
      {
        email: 'kluberrrr@gmail.com',
        notifyUpcoming: true,
        notifyOverdue: true,
        language: 'en'
      }
    ]

    // Filtrer selon les paramètres
    let filteredUsers = users
    
    if (notifyUpcoming === 'true') {
      filteredUsers = filteredUsers.filter(user => user.notifyUpcoming)
    }
    
    if (notifyOverdue === 'true') {
      filteredUsers = filteredUsers.filter(user => user.notifyOverdue)
    }

    console.log(`📧 Found ${filteredUsers.length} users for notifications`)
    
    return NextResponse.json(filteredUsers)

  } catch (error) {
    console.error('[user-preferences] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 })
  }
}