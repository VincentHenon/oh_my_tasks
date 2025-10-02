'use client';

import { Plus } from 'lucide-react';
import CrossIcon from './CrossIcon';

const TaskForm = ({
  visible,
  t,
  formMode,
  taskName,
  taskDetails,
  taskTags,
  taskPriority,
  taskDate,
  taskTime,
  isFullDay,
  isTagHintVisible,
  onNameChange,
  onDetailsChange,
  onTagsChange,
  onPriorityChange,
  onDateChange,
  onTimeChange,
  onFullDayChange,
  onToggleTagHint,
  onClose,
  onSubmit,
  onKeyDown,
  openNativePicker,
}) => {
  if (!visible) return null;

  return (
    <div
      className="mb-6 p-4 rounded-lg w-full max-w-[800px] relative"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
    >
      <CrossIcon
        className="absolute top-3 right-3 hover:text-red-500 transition-colors duration-300"
        style={{ color: 'var(--text-secondary)' }}
        strokeWidth={1}
        absoluteStrokeWidth
        size={20}
        onClick={onClose}
      />

      <h2 className="text-lg font-semibold mb-4 pr-8" style={{ color: 'var(--text-primary)' }}>
        {formMode === 'edit' ? t('editTask') : t('addNewTask')}
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('taskNameRequired')}
        </label>
        <input
          type="text"
          placeholder={t('taskNamePlaceholder')}
          value={taskName}
          onChange={onNameChange}
          onKeyDown={onKeyDown}
          className="w-full rounded p-3 transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('details')}
        </label>
        <textarea
          placeholder={t('detailsPlaceholder')}
          value={taskDetails}
          onChange={onDetailsChange}
          rows={3}
          className="w-full rounded p-3 transition-colors resize-vertical"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="taskTags"
          className="flex items-center gap-2 text-sm font-medium mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('tags')}
          <button
            type="button"
            onClick={onToggleTagHint}
            aria-label={t('tagsHint')}
            aria-expanded={isTagHintVisible}
            aria-controls="tags-hint"
            className="px-1 text-sm font-semibold leading-none transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            ?
          </button>
        </label>
        <input
          type="text"
          id="taskTags"
          placeholder={t('tagsPlaceholder')}
          value={taskTags}
          onChange={onTagsChange}
          className="w-full rounded p-3 transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
        />
        {isTagHintVisible && (
          <p id="tags-hint" className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('tagsHint')}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('priority')}
        </label>
        <select
          value={taskPriority}
          onChange={onPriorityChange}
          className="w-full rounded p-3 transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <option value="top">{t('priorityTop')}</option>
          <option value="medium">{t('priorityMedium')}</option>
          <option value="low">{t('priorityLow')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('date')}
          </label>
          <input
            type="date"
            value={taskDate}
            onChange={onDateChange}
            onClick={openNativePicker}
            onKeyDown={openNativePicker}
            className="w-full rounded p-3 transition-colors text-sm sm:text-base"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('time')}
          </label>
          <input
            type="time"
            value={taskTime}
            onChange={onTimeChange}
            disabled={isFullDay}
            onClick={openNativePicker}
            onKeyDown={openNativePicker}
            className="w-full rounded p-3 transition-colors text-sm sm:text-base"
            style={{
              backgroundColor: isFullDay ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
              color: isFullDay ? 'var(--text-secondary)' : 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              opacity: isFullDay ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="fullDay"
          checked={isFullDay}
          onChange={onFullDayChange}
          className="mr-2"
          style={{ accentColor: 'var(--accent)' }}
        />
        <label htmlFor="fullDay" className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {t('fullDay')}
        </label>
      </div>

      <button
        onClick={onSubmit}
        disabled={!taskName.trim()}
        className="w-full p-3 rounded font-medium transition-all duration-200 hover:opacity-80 disabled:opacity-50"
        style={{
          backgroundColor: '#4a5568',
          color: 'white',
        }}
      >
        <Plus className="inline mr-2" size={20} />
        {formMode === 'edit' ? t('saveChanges') : t('addTask')}
      </button>
    </div>
  );
};

export default TaskForm;
