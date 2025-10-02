import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const REMOTE_TASKS_ENDPOINT = process.env.TASKS_API_BASE_URL
const REMOTE_API_KEY = process.env.TASKS_API_KEY

const ensureConfig = () => {
  if (!REMOTE_TASKS_ENDPOINT) {
    throw new Error('TASKS_API_BASE_URL is not configured')
  }

  if (!REMOTE_API_KEY) {
    throw new Error('TASKS_API_KEY is not configured')
  }
}

const withAuthorization = async () => {
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

export async function GET() {
  try {
    ensureConfig()
    const email = await withAuthorization()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(REMOTE_TASKS_ENDPOINT)
    url.searchParams.set('email', email)

    const remoteResponse = await fetch(url, {
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
    console.error('[TASKS_API][GET]', error)
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 })
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

    const remoteResponse = await fetch(REMOTE_TASKS_ENDPOINT, {
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

    const remoteResponse = await fetch(`${REMOTE_TASKS_ENDPOINT}?id=${id}`, {
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

    const remoteResponse = await fetch(url, {
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
