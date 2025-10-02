'use client';

import { Plus } from 'lucide-react';
import VoiceInput from './VoiceInput';

const TaskActionBar = ({ t, onAddClick, onVoiceTask }) => (
  <div className="mt-6 w-full max-w-[800px] flex items-center gap-3">
    <button
      onClick={onAddClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
      style={{
        backgroundColor: 'var(--secondary-button-bg)',
        color: 'var(--secondary-button-text)',
        border: '1px solid var(--secondary-button-border)',
      }}
    >
      <Plus size={20} />
      <span className="hidden min-[600px]:inline">{t('addTaskManually')}</span>
    </button>

    <VoiceInput onTaskParsed={onVoiceTask} />
  </div>
);

export default TaskActionBar;
