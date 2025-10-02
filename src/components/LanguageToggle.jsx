'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageToggle() {
    const { currentLanguage, toggleLanguage, t } = useLanguage();
    
    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 max-[499px]:gap-0 px-3 max-[499px]:px-2 py-2 rounded-lg border border-[var(--border-primary)] transition-all duration-200 hover:opacity-80"
            style={{ 
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
            }}
            title={t('language')}
        >
            <Globe size={16} />
            <span className="text-sm font-medium max-[499px]:hidden">
                {currentLanguage === 'fr' ? 'FR' : 'EN'}
            </span>
        </button>
    );
}