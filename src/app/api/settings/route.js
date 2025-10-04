import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const SETTINGS_ENDPOINT = process.env.USER_SETTINGS_API_ENDPOINT
const SETTINGS_API_KEY = process.env.USER_SETTINGS_API_KEY ?? process.env.EXPECTED_KEY ?? ''

// Fonction helper pour gérer les requêtes avec fallback IPv6
const fetchWithIPv6Fallback = async (url, options = {}) => {
  try {
    const response = await fetch(url, options)
    return response
  } catch (fetchError) {
    console.log('⚠️ Settings API: Domaine fetch failed, trying IPv6 directly...', fetchError.message)
    
    // Fallback: utiliser l'IPv6 directement
    const ipv6Url = url.toString().replace('ohmytasks.vincenthenon.com', '[2a02:4780:27:1149:0:7a5:24c6:4]')
    console.log('🌐 Settings API Fallback IPv6:', ipv6Url)
    
    const response = await fetch(ipv6Url, options)
    return response
  }
}

const DEFAULT_SETTINGS = {
  language: 'en',
  notifyUpcoming: false,
  notifyOverdue: false,
}

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'n', 'off', ''].includes(normalized)) return false
  }
  return Boolean(value)
}

const normalizeSettingsPayload = (payload = {}) => ({
  language: typeof payload.language === 'string' ? payload.language : DEFAULT_SETTINGS.language,
  notifyUpcoming: normalizeBoolean(payload.notifyUpcoming ?? payload.notify_upcoming),
  notifyOverdue: normalizeBoolean(payload.notifyOverdue ?? payload.notify_overdue),
})

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  ...(SETTINGS_API_KEY ? { 'X-API-KEY': SETTINGS_API_KEY } : {}),
})

const ensureAuthenticated = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { session: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, response: null }
}

export async function GET() {
  const { session, response } = await ensureAuthenticated()
  if (!session) return response

  if (!SETTINGS_ENDPOINT) {
    console.warn('[settings] USER_SETTINGS_API_ENDPOINT is not configured, returning defaults')
    return NextResponse.json(DEFAULT_SETTINGS)
  }

  const url = `${SETTINGS_ENDPOINT}?email=${encodeURIComponent(session.user.email)}`

  try {
    const upstream = await fetchWithIPv6Fallback(url, {
      method: 'GET',
      headers: buildHeaders(),
      cache: 'no-store',
    })

    if (!upstream.ok) {
      if (upstream.status === 404) {
        return NextResponse.json(DEFAULT_SETTINGS)
      }
      const text = await upstream.text()
      console.error('[settings][GET] upstream error', upstream.status, text)
      return NextResponse.json(DEFAULT_SETTINGS, { status: upstream.status })
    }

    const payload = await upstream.json().catch(() => DEFAULT_SETTINGS)
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...normalizeSettingsPayload(payload) })
  } catch (error) {
    console.error('[settings][GET] fetch failed', error)
    return NextResponse.json(DEFAULT_SETTINGS, { status: 200 })
  }
}

export async function PUT(request) {
  const { session, response } = await ensureAuthenticated()
  if (!session) return response

  if (!SETTINGS_ENDPOINT) {
    console.warn('[settings] USER_SETTINGS_API_ENDPOINT is not configured, skipping update')
    return NextResponse.json(DEFAULT_SETTINGS)
  }

  const body = await request.json().catch(() => ({}))

  const language = typeof body.language === 'string' ? body.language : DEFAULT_SETTINGS.language
  const notifyUpcoming = normalizeBoolean(body.notifyUpcoming)
  const notifyOverdue = normalizeBoolean(body.notifyOverdue)

  const payload = {
    email: session.user.email,
    language,
    notifyUpcoming,
    notifyOverdue,
  }

  try {
    const upstream = await fetchWithIPv6Fallback(SETTINGS_ENDPOINT, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      console.error('[settings][PUT] upstream error', upstream.status, text)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: upstream.status })
    }

    const responseBody = await upstream.json().catch(() => ({}))
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      ...normalizeSettingsPayload(responseBody),
    })
  } catch (error) {
    console.error('[settings][PUT] fetch failed', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
