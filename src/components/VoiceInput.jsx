'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const MONTHS_EN = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const RELATIVE_DAYS = {
  today: 0,
  tomorrow: 1,
};

const DAYS_OF_WEEK = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const FRENCH_EN_MAP = {
  'pour': 'for',
  'à': 'at',
  'le': 'on',
  'la': 'on',
  'les': 'on',
  'demain': 'tomorrow',
  'aujourd\'hui': 'today',
  'ce soir': 'tonight',
  'matin': 'morning',
  'midi': 'noon',
  'soir': 'evening',
  'nuit': 'night',
  'urgent': 'urgent',
  'urgence': 'urgent',
  'important': 'urgent',
  'journée': 'day',
  'complète': 'full',
  'journée complète': 'all day',
  'toute la journée': 'all day',
  'lundi': 'monday',
  'mardi': 'tuesday',
  'mercredi': 'wednesday',
  'jeudi': 'thursday',
  'vendredi': 'friday',
  'samedi': 'saturday',
  'dimanche': 'sunday',
  'janvier': 'january',
  'février': 'february',
  'fevrier': 'february',
  'mars': 'march',
  'avril': 'april',
  'mai': 'may',
  'juin': 'june',
  'juillet': 'july',
  'août': 'august',
  'aout': 'august',
  'septembre': 'september',
  'octobre': 'october',
  'novembre': 'november',
  'décembre': 'december',
  'decembre': 'december',
  'heure': 'hour',
  'heures': 'hours',
  'et demi': 'thirty',
};

const normaliseFrench = (text) => {
  let translated = text.toLowerCase();
  Object.entries(FRENCH_EN_MAP).forEach(([fr, en]) => {
    const regex = new RegExp(`\\b${fr}\\b`, 'gi');
    translated = translated.replace(regex, en);
  });
  return translated;
};

const toDateString = (date) => date.toISOString().slice(0, 10);

const parseRelativeDay = (keyword) => {
  const lower = keyword.toLowerCase();
  if (RELATIVE_DAYS[lower] !== undefined) {
    const base = new Date();
    base.setDate(base.getDate() + RELATIVE_DAYS[lower]);
    return base;
  }
  if (DAYS_OF_WEEK[lower] !== undefined) {
    const target = DAYS_OF_WEEK[lower];
    const base = new Date();
    const baseDay = base.getDay();
    let diff = target - baseDay;
    if (diff <= 0) diff += 7;
    base.setDate(base.getDate() + diff);
    return base;
  }
  return null;
};

const parseExplicitDate = (match) => {
  // ISO 2025-03-18
  if (/\d{4}-\d{2}-\d{2}/.test(match)) {
    return new Date(match);
  }
  // dd/mm[/yyyy] or dd-mm
  const slash = match.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]) - 1;
    const year = slash[3] ? Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3]) : new Date().getFullYear();
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // Month name + day (e.g. march 12)
  const monthMatch = match.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i);
  if (monthMatch) {
    const month = MONTHS_EN[monthMatch[1].toLowerCase()];
    const day = Number(monthMatch[2]);
    const year = new Date().getFullYear();
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const parseTimeValue = (text) => {
  const colon = text.match(/(\d{1,2}):(\d{2})/);
  if (colon) {
    const hours = String(colon[1]).padStart(2, '0');
    const minutes = colon[2];
    return `${hours}:${minutes}`;
  }
  const ampm = text.match(/(\d{1,2})\s?(am|pm)/);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = '00';
    if (ampm[2].toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (ampm[2].toLowerCase() === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  const frenchHour = text.match(/(\d{1,2})h(\d{0,2})?/);
  if (frenchHour) {
    const hours = String(frenchHour[1]).padStart(2, '0');
    const minutes = frenchHour[2] ? frenchHour[2].padEnd(2, '0') : '00';
    return `${hours}:${minutes}`;
  }
  return '';
};

const removeSegment = (raw, segment) => {
  if (!segment) return raw;
  return raw.replace(segment, ' ').replace(/\s{2,}/g, ' ').trim();
};

const splitTitleDetails = (text) => {
  const detailRegex = /(details?|notes?|description)[:\-]?\s*(.+)$/i;
  const detailMatch = text.match(detailRegex);
  if (detailMatch) {
    return [text.slice(0, detailMatch.index).trim(), detailMatch[2].trim()];
  }

  if (text.includes(' - ')) {
    const [title, ...rest] = text.split(' - ');
    return [title.trim(), rest.join(' - ').trim()];
  }

  if (text.includes(':')) {
    const [title, ...rest] = text.split(':');
    return [title.trim(), rest.join(':').trim()];
  }

  if (text.includes('. ')) {
    const [title, ...rest] = text.split('. ');
    return [title.trim(), rest.join('. ').trim()];
  }

  return [text.trim(), ''];
};

const parseVoiceTranscript = (transcript, language) => {
  const original = transcript.trim();
  if (!original) {
    return { name: 'New Task', details: '', date: '', time: '', isFullDay: false, isUrgent: false };
  }

  const normalised = language === 'fr' ? normaliseFrench(original) : original.toLowerCase();
  let working = normalised;
  let rawWorking = original;

  const isUrgent = /\burgent|important|priority\b/.test(working);
  const isFullDay = /\ball day|whole day|all-day\b/.test(working);

  const dateRegexes = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/,
    /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/,
  ];

  let detectedDate = '';
  dateRegexes.some((regex) => {
    const match = working.match(regex);
    if (!match) return false;
    const parsed = parseExplicitDate(match[1]) || parseRelativeDay(match[1]);
    if (parsed) {
      detectedDate = toDateString(parsed);
      working = removeSegment(working, match[0]);
      rawWorking = removeSegment(rawWorking, match[0]);
      return true;
    }
    return false;
  });

  if (!detectedDate) {
    const relMatch = working.match(/in\s+(\d+)\s+days?/);
    if (relMatch) {
      const base = new Date();
      base.setDate(base.getDate() + Number(relMatch[1]));
      detectedDate = toDateString(base);
      working = removeSegment(working, relMatch[0]);
      rawWorking = removeSegment(rawWorking, relMatch[0]);
    }
  }

  let detectedTime = '';
  const timeRegexes = [
    /(\d{1,2}:\d{2})/,
    /(\d{1,2}\s?(?:am|pm))/,
    /(\d{1,2})h(\d{0,2})?/, // French style
  ];

  timeRegexes.some((regex) => {
    const match = working.match(regex);
    if (!match) return false;
    const parsed = parseTimeValue(match[0], isFullDay ? '' : undefined);
    if (parsed) {
      detectedTime = parsed;
      working = removeSegment(working, match[0]);
      rawWorking = removeSegment(rawWorking, match[0]);
      return true;
    }
    return false;
  });

  const cleaned = rawWorking
    .replace(/\b(urgent|important|priority)\b/gi, '')
    .replace(/\ball day|whole day|all-day\b/gi, '')
    .trim();

  const [title, details] = splitTitleDetails(cleaned);

  return {
    name: title || 'New Task',
    details,
    date: detectedDate,
    time: isFullDay ? '' : detectedTime,
    isFullDay,
    isUrgent,
    tags: '',
    priority: 'medium',
  };
};

export default function VoiceInput({ onTaskParsed }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef(null);
  const { getSpeechLang, currentLanguage, t } = useLanguage();

  const idleLabel = t('addVocalTask');
  const buttonLabel = isRecording
    ? t('clickToStop')
    : isProcessing
      ? t('processing')
      : idleLabel;
  const buttonTextClass = !isRecording && !isProcessing ? 'hidden min-[600px]:inline' : '';

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getSpeechLang();

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setCurrentTranscript(finalTranscript);
      } else if (interimTranscript) {
        setCurrentTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsProcessing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);

    if (currentTranscript) {
      setIsProcessing(true);
      const parsed = parseVoiceTranscript(currentTranscript, currentLanguage);
      onTaskParsed(parsed);
      setCurrentTranscript('');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {isRecording && (
          <div
            className="absolute inset-0 rounded-lg border-2 border-white animate-ping opacity-75"
            style={{ animation: 'pulse-ring 1.5s linear infinite' }}
          />
        )}

        <button
          onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isProcessing ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'
          }`}
          style={
            isRecording
              ? { backgroundColor: '#ef4444', color: '#ffffff', border: '1px solid #ef4444' }
              : {
                  backgroundColor: 'var(--secondary-button-bg)',
                  color: 'var(--secondary-button-text)',
                  border: '1px solid var(--secondary-button-border)',
                }
          }
          aria-label={buttonLabel}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          <span className={buttonTextClass}>{buttonLabel}</span>
        </button>
      </div>

      {currentTranscript && (
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {currentTranscript}
        </span>
      )}
    </div>
  );
}
