import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }    // Adapter selon le format de réponse de ton API PHP
    let tasksArray = payload
    if (payload && payload.tasks && Array.isArray(payload.tasks)) {
      tasksArray = payload.tasks
    } else if (!Array.isArray(payload)) {
      console.warn('[TASKS_API][GET] Unexpected payload format:', payload)
      tasksArray = []
    }

    const normalized = tasksArray.map((item) => {
      if (item && typeof item === 'object') {
        const { detail, ...rest } = item
        return {
          ...rest,
          details: item?.details ?? detail ?? '',
          tags: item?.tags ?? '',
          priority: item?.priority ?? 'medium',
        }
      }
      return item
    })
    
    return NextResponse.json(normalized)..nextauth]/route'

const REMOTE_TASKS_ENDPOINT = process.env.TASKS_API_ENDPOINT
const REMOTE_API_KEY = process.env.TASKS_API_KEY

const ensureConfig = () => {
  console.log('🔧 Environment variables check:')
  console.log('- TASKS_API_ENDPOINT:', REMOTE_TASKS_ENDPOINT ? 'SET' : 'MISSING')
  console.log('- TASKS_API_KEY:', REMOTE_API_KEY ? 'SET' : 'MISSING')
  
  if (!REMOTE_TASKS_ENDPOINT) {
    console.error('❌ TASKS_API_ENDPOINT is not configured')
    throw new Error('TASKS_API_ENDPOINT is not configured')
  }

  if (!REMOTE_API_KEY) {
    console.error('❌ TASKS_API_KEY is not configured')
    throw new Error('TASKS_API_KEY is not configured')
  }
  
  console.log('✅ Configuration OK')
}

const withAuthorization = async (request = null) => {
  // Vérifier si c'est un appel cron avec email explicite
  if (request) {
    const cronSecret = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (cronSecret === process.env.CRON_SECRET) {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')
      if (email) {
        console.log('🤖 Cron access granted for:', email)
        return email
      }
    }
  }
  
  // Authentification normale via NextAuth
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return null
  }
  return session.user.email
}

const forwardHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': REMOTE_API_KEY,
})

const toJsonSafe = async (response) => {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch (_error) {
    return text
  }
}

// Fonction helper pour gérer les requêtes avec fallback IPv6
const fetchWithIPv6Fallback = async (url, options = {}) => {
  try {
    const response = await fetch(url, options)
    console.log('📡 Response status:', response.status)
    return response
  } catch (fetchError) {
    console.log('⚠️ Domaine fetch failed, trying IPv6 directly...', fetchError.message)
    
    // Fallback: utiliser l'IPv6 directement
    const ipv6Url = url.toString().replace('ohmytasks.vincenthenon.com', '[2a02:4780:27:1149:0:7a5:24c6:4]')
    console.log('🌐 Fallback IPv6:', ipv6Url)
    
    const response = await fetch(ipv6Url, options)
    console.log('📡 IPv6 Response status:', response.status)
    return response
  }
}

export async function GET(request) {
  try {
    console.log('🚀 Starting GET /api/tasks')
    ensureConfig()
    const email = await withAuthorization(request)
    console.log('👤 User email:', email ? 'SET' : 'MISSING')

    if (!email) {
      console.log('❌ Unauthorized - no email')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(REMOTE_TASKS_ENDPOINT)
    url.searchParams.set('email', email)
    console.log('🌐 Calling:', url.toString())

    const remoteResponse = await fetchWithIPv6Fallback(url, {
      method: 'GET',
      headers: forwardHeaders(),
      cache: 'no-store',
    })

    const payload = await toJsonSafe(remoteResponse)

    if (!remoteResponse.ok) {
      const status = remoteResponse.status || 502
      console.error('[TASKS_API][GET] upstream error', status, payload)
      return NextResponse.json({ error: 'Upstream error', details: payload }, { status })
    }

    if (Array.isArray(payload)) {
      const normalized = payload.map((item) => {
        if (item && typeof item === 'object') {
          const { detail, ...rest } = item
          return {
            ...rest,
            details: item?.details ?? detail ?? '',
            tags: item?.tags ?? '',
            priority: item?.priority ?? 'medium',
          }
        }
        return item
      })
      return NextResponse.json(normalized)
    }

    if (payload && typeof payload === 'object') {
      const { detail, ...rest } = payload
      return NextResponse.json({
        ...rest,
        details: payload?.details ?? detail ?? '',
        tags: payload?.tags ?? '',
        priority: payload?.priority ?? 'medium',
      })
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('💥 [TASKS_API][GET] Error:', error.message)
    console.error('💥 Stack:', error.stack)
    return NextResponse.json({ 
      error: 'Failed to load tasks', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    ensureConfig()
    const email = await withAuthorization()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const remoteResponse = await fetchWithIPv6Fallback(REMOTE_TASKS_ENDPOINT, {
      method: 'POST',
      headers: forwardHeaders(),
      body: JSON.stringify({
        email,
        title: body?.name ?? '',
        details: body?.details ?? '',
        date: body?.date ?? '',
        time: body?.time ?? '',
        isFullDay: body?.isFullDay ? 1 : 0,
        urgent: body?.isUrgent ? 1 : 0,
        completed: body?.completed ? 1 : 0,
        tags: body?.tags ?? '',
        priority: body?.priority ?? 'medium',
      }),
    })

    const payload = await toJsonSafe(remoteResponse)

    if (!remoteResponse.ok) {
      const status = remoteResponse.status || 502
      console.error('[TASKS_API][POST] upstream error', status, payload)
      return NextResponse.json({ error: 'Upstream error', details: payload }, { status })
    }

    return NextResponse.json(payload, { status: remoteResponse.status })
  } catch (error) {
    console.error('[TASKS_API][POST]', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    ensureConfig()
    const email = await withAuthorization()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const body = await request.json()

    const remoteResponse = await fetchWithIPv6Fallback(`${REMOTE_TASKS_ENDPOINT}?id=${id}`, {
      method: 'PUT',
      headers: forwardHeaders(),
      body: JSON.stringify({
        ...body,
        tags: body?.tags ?? '',
        priority: body?.priority ?? 'medium',
        email,
      }),
    })

    const payload = await toJsonSafe(remoteResponse)

    if (!remoteResponse.ok) {
      const status = remoteResponse.status || 502
      console.error('[TASKS_API][PUT] upstream error', status, payload)
      return NextResponse.json({ error: 'Upstream error', details: payload }, { status })
    }

    return NextResponse.json(payload, { status: remoteResponse.status })
  } catch (error) {
    console.error('[TASKS_API][PUT]', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    ensureConfig()
    const email = await withAuthorization()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const url = new URL(REMOTE_TASKS_ENDPOINT)
    url.searchParams.set('id', id)
    url.searchParams.set('email', email)

    const remoteResponse = await fetchWithIPv6Fallback(url, {
      method: 'DELETE',
      headers: forwardHeaders(),
    })

    if (!remoteResponse.ok) {
      const payload = await toJsonSafe(remoteResponse)
      const status = remoteResponse.status || 502
      console.error('[TASKS_API][DELETE] upstream error', status, payload)
      return NextResponse.json({ error: 'Upstream error', details: payload }, { status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[TASKS_API][DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
