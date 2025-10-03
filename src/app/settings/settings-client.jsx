'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import DashboardHeader from '../../components/DashboardHeader'
import ThemeToggle from '../../components/ThemeToggle'

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
]

const DEFAULT_FORM = {
  language: 'en',
  notifyUpcoming: false,
  notifyOverdue: false,
}

export default function SettingsClient() {
  const { t, currentLanguage, setCurrentLanguage } = useLanguage()
  const { status } = useSession()
  const router = useRouter()

  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setForm({
        language: typeof data.language === 'string' ? data.language : DEFAULT_FORM.language,
        notifyUpcoming: Boolean(data.notifyUpcoming),
        notifyOverdue: Boolean(data.notifyOverdue),
      })
      setSuccess(null)
      setError(null)
    } catch (fetchError) {
      console.error('[settings] load failed', fetchError)
      setError(t('errorLoadingSettings'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (status === 'authenticated') {
      loadSettings()
    }
  }, [status, loadSettings])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin?callbackUrl=/settings')
    }
  }, [status, router])

  useEffect(() => {
    // Sync global language when preferences change
    if (form.language && form.language !== currentLanguage) {
      setCurrentLanguage(form.language)
    }
  }, [form.language, currentLanguage, setCurrentLanguage])

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      setForm({
        language: typeof data.language === 'string' ? data.language : DEFAULT_FORM.language,
        notifyUpcoming: Boolean(data.notifyUpcoming),
        notifyOverdue: Boolean(data.notifyOverdue),
      })

      setSuccess(t('saved'))
    } catch (submitError) {
      console.error('[settings] save failed', submitError)
      setError(t('errorSavingSettings'))
    } finally {
      setSaving(false)
    }
  }

  if (status !== 'authenticated') {
    return null
  }

  const languageChoices = LANG_OPTIONS.map((option) => ({
    ...option,
    label: option.value === 'fr' ? t('french') : t('english'),
  }))

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DashboardHeader tasks={[]} />
      
      <main className="pt-20 p-8">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-4xl font-light mb-2 lowercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{t('settingsTitle')}</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>{t('settingsDescription')}</p>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{t('languageLabel')}</legend>
          <div>
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              disabled={loading || saving}
              className="w-full max-w-sm rounded-md border px-3 py-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-primary)',
              }}
            >
              {languageChoices.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{t('notificationPreferences')}</legend>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="notifyUpcoming"
              checked={form.notifyUpcoming}
              onChange={handleChange}
              disabled={loading || saving}
              className="mt-1"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('notifyUpcoming')}</span>
              <br />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('notifyUpcomingHelper')}</span>
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="notifyOverdue"
              checked={form.notifyOverdue}
              onChange={handleChange}
              disabled={loading || saving}
              className="mt-1"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('notifyOverdue')}</span>
              <br />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('notifyOverdueHelper')}</span>
            </span>
          </label>
        </fieldset>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-4 py-2 rounded-md font-medium transition-colors"
            style={{
              backgroundColor: 'var(--secondary-button-bg)',
              color: 'var(--secondary-button-text)',
              border: '1px solid var(--secondary-button-border)',
              opacity: saving || loading ? 0.6 : 1,
            }}
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>

          {saving && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('saving')}</span>
          )}

          {success && !saving && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{success}</span>
          )}

          {error && (
            <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
          )}
        </div>
      </form>
          
          <ThemeToggle />
        </div>
      </main>
    </div>
  )
}