'use client'

import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { useDeviceDetection } from '../hooks/useDeviceDetection'
import { Mail, Phone, MessageCircle, Send } from 'lucide-react'
import CrossIcon from './CrossIcon'

export default function ContactModal({ isOpen = false, onClose = () => {} }) {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const device = useDeviceDetection()

  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'general'
  })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate sending contact form
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(t('messageSent'))
      setForm({ subject: '', message: '', category: 'general' })
    } catch (submitError) {
      console.error('[contact] send failed', submitError)
      setError(t('errorSendingMessage'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Contact Drawer - Always rendered for animation */}
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
            <Mail size={24} style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('contact')}
            </h2>
          </div>
          <CrossIcon
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onClose}
            size={28}
          />
        </div>

        {/* Contact Content */}
        <div className={device.isMobile ? 'p-4' : 'p-6'}>
          {/* Contact Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('getInTouch')}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>support@ohmytasks.com</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone size={18} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>+1 (555) 123-4567</span>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageCircle size={18} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)' }}>{t('liveChat')}</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="category" 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('category')}
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={sending}
                className="w-full rounded-md border px-3 py-2"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <option value="general">{t('generalInquiry')}</option>
                <option value="technical">{t('technicalSupport')}</option>
                <option value="billing">{t('billing')}</option>
                <option value="feature">{t('featureRequest')}</option>
                <option value="bug">{t('bugReport')}</option>
              </select>
            </div>

            <div>
              <label 
                htmlFor="subject" 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('subject')}
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                disabled={sending}
                placeholder={t('enterSubject')}
                className="w-full rounded-md border px-3 py-2"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                }}
                required
              />
            </div>

            <div>
              <label 
                htmlFor="message" 
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('message')}
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                disabled={sending}
                placeholder={t('enterMessage')}
                rows={5}
                className="w-full rounded-md border px-3 py-2 resize-none"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-primary)',
                }}
                required
              />
            </div>

            {/* User Info Display */}
            {session && (
              <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('sendingAs')}: <span style={{ color: 'var(--text-primary)' }}>{session.user?.email}</span>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending || !form.subject || !form.message}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors"
              style={{
                backgroundColor: 'var(--secondary-button-bg)',
                color: 'var(--secondary-button-text)',
                border: '1px solid var(--secondary-button-border)',
                opacity: (sending || !form.subject || !form.message) ? 0.6 : 1,
              }}
            >
              <Send size={18} />
              {sending ? t('sending') : t('sendMessage')}
            </button>

            {/* Status Messages */}
            {success && (
              <div className="text-sm text-center p-2 rounded-md" style={{ 
                backgroundColor: 'var(--success-bg, #dcfce7)', 
                color: 'var(--success-text, #166534)' 
              }}>
                {success}
              </div>
            )}

            {error && (
              <div className="text-sm text-center p-2 rounded-md" style={{ 
                backgroundColor: 'var(--error-bg, #fef2f2)', 
                color: 'var(--error-text, #dc2626)' 
              }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  )
}