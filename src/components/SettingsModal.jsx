'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { Settings } from 'lucide-react'
import { useDeviceDetection } from '../hooks/useDeviceDetection'
import CrossIcon from './CrossIcon'
import { SettingsSkeleton } from './Skeleton'

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
]

const DEFAULT_FORM = {
  language: 'en',
  notifyUpcoming: false,
  notifyOverdue: false,
}

export default function SettingsModal({ 
  isOpen = false, 
  onClose = () => {}, 
  preloadedData = null,
  onSettingsUpdate = () => {}
}) {
  const { t, currentLanguage, setCurrentLanguage } = useLanguage()
  const { status } = useSession()
  const device = useDeviceDetection()

  const [form, setForm] = useState(DEFAULT_FORM)
  const [originalForm, setOriginalForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false) // Default to false since we have preloaded data
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      const loadedSettings = {
        language: typeof data.language === 'string' ? data.language : DEFAULT_FORM.language,
        notifyUpcoming: Boolean(data.notifyUpcoming),
        notifyOverdue: Boolean(data.notifyOverdue),
      }
      setForm(loadedSettings)
      setOriginalForm(loadedSettings) // Save original for comparison
      setHasUnsavedChanges(false)
      setSuccess(null)
      setError(null)
    } catch (fetchError) {
      console.error('[settings] load failed', fetchError)
      setError(t('errorLoadingSettings'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // Use preloaded data if available, otherwise load from API
  useEffect(() => {
    if (status === 'authenticated' && isOpen) {
      if (preloadedData) {
        // Use preloaded data immediately
        setForm(preloadedData)
        setOriginalForm(preloadedData)
        setHasUnsavedChanges(false)
        setSuccess(null)
        setError(null)
        setLoading(false)
      } else {
        // Fallback to API call if no preloaded data
        loadSettings()
      }
    }
  }, [status, isOpen, preloadedData, loadSettings])

  // Note: Language sync will happen only after successful save, not on form change

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target
    const newForm = {
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    }
    setForm(newForm)
    
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(newForm) !== JSON.stringify(originalForm)
    setHasUnsavedChanges(hasChanges)
    
    // Clear success/error messages when user makes changes
    if (hasChanges) {
      setSuccess(null)
      setError(null)
    }
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
      const savedSettings = {
        language: typeof data.language === 'string' ? data.language : DEFAULT_FORM.language,
        notifyUpcoming: Boolean(data.notifyUpcoming),
        notifyOverdue: Boolean(data.notifyOverdue),
      }
      
      setForm(savedSettings)
      setOriginalForm(savedSettings) // Update original after successful save
      setHasUnsavedChanges(false) // Reset unsaved changes flag

      // Update parent component's settings data
      onSettingsUpdate(savedSettings)

      // Only sync global language AFTER successful save
      if (savedSettings.language !== currentLanguage) {
        setCurrentLanguage(savedSettings.language)
      }

      setSuccess(t('saved'))
    } catch (submitError) {
      console.error('[settings] save failed', submitError)
      setError(t('errorSavingSettings'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm(originalForm)
    setHasUnsavedChanges(false)
    setSuccess(null)
    setError(null)
  }

  const languageChoices = LANG_OPTIONS.map((option) => ({
    ...option,
    label: option.value === 'fr' ? t('french') : t('english'),
  }))

  return (
    <>
      {/* Settings Drawer - Always rendered for animation */}
      <div 
        className="fixed top-0 h-full z-[10001] overflow-y-auto"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          right: '0px',
          width: device.isMobile ? '100vw' : '640px',
          transform: isOpen ? 'translateX(0px)' : 'translateX(100%)',
          transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
          willChange: 'transform',
          boxShadow: isOpen ? '-8px 0 32px rgba(0, 0, 0, 0.15)' : 'none'
        }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${device.isMobile ? 'p-4' : 'p-6'}`} style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-2">
            <Settings size={24} style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('settings')}
            </h2>
          </div>
          <CrossIcon
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onClose}
            size={28}
          />
        </div>

        {/* Settings Content */}
        <div className={device.isMobile ? 'p-4' : 'p-6'}>
          {loading ? (
            <SettingsSkeleton />
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Language Section */}
              <fieldset className="space-y-4">
                <legend className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t('languageLabel')}
                </legend>
                <div>
                  <select
                    name="language"
                    value={form.language}
                    onChange={handleChange}
                    disabled={loading || saving}
                    className="w-full rounded-md border px-3 py-2"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
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

              {/* Notifications Section */}
              <fieldset className="space-y-4">
                <legend className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t('notificationPreferences')}
                </legend>

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
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t('notifyUpcoming')}
                    </span>
                    <br />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t('notifyUpcomingHelper')}
                    </span>
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
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t('notifyOverdue')}
                    </span>
                    <br />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {t('notifyOverdueHelper')}
                    </span>
                  </span>
                </label>
              </fieldset>

              {/* Unsaved Changes Indicator */}
              {hasUnsavedChanges && (
                <div className="p-3 rounded-md mb-4" style={{ backgroundColor: 'var(--bg-tertiary)', borderLeft: '3px solid #f59e0b' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t('unsavedChanges')}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving || loading || !hasUnsavedChanges}
                  className="w-full px-4 py-2 rounded-md font-medium transition-colors"
                  style={{
                    backgroundColor: hasUnsavedChanges ? 'var(--secondary-button-bg)' : 'var(--bg-tertiary)',
                    color: hasUnsavedChanges ? 'var(--secondary-button-text)' : 'var(--text-secondary)',
                    border: `1px solid ${hasUnsavedChanges ? 'var(--secondary-button-border)' : 'var(--border-primary)'}`,
                    opacity: saving || loading ? 0.6 : 1,
                  }}
                >
                  {saving ? t('saving') : t('saveChanges')}
                </button>

                {hasUnsavedChanges && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving || loading}
                    className="w-full px-4 py-2 rounded-md font-medium transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)',
                    }}
                  >
                    {t('cancel')}
                  </button>
                )}

                {/* Status Messages */}
                {saving && (
                  <div className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                    {t('saving')}...
                  </div>
                )}

                {success && !saving && (
                  <div className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                    {success}
                  </div>
                )}

                {error && (
                  <div className="text-sm text-center" style={{ color: '#ef4444' }}>
                    {error}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}