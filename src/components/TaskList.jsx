'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, GripVertical, Pencil, SquareCheckBig } from 'lucide-react';
import CrossIcon from './CrossIcon';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const formatDateLabel = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '0000-00-00') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeLabel = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '00:00:00' || trimmed === '00:00') return '';
  const [hours, minutes] = value.split(':');
  if (hours === undefined || minutes === undefined) return '';
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

function SortableItem({
  id,
  task,
  displayIndex,
  originalIndex,
  onToggleDetails,
  isExpanded,
  onToggleCompleted,
  onEdit,
  onRequestDelete,
  labels,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const dragHandleListeners = React.useMemo(() => {
    const { onPointerDown, ...rest } = listeners;
    return {
      ...rest,
      onPointerDown: (event) => {
        event.stopPropagation();
        onPointerDown?.(event);
      },
    };
  }, [listeners]);

  const showCompletedControl = typeof onToggleCompleted === 'function';
  const showEditControl = typeof onEdit === 'function';

  const cardStyle = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: 'var(--bg-secondary)',
    border: `1px solid ${isExpanded ? 'var(--border-hover)' : 'var(--border-primary)'}`,
    boxShadow: isExpanded ? '0 0 0 2px var(--border-hover)' : 'none',
  }), [transform, transition, isDragging, isExpanded]);

  const formattedDate = formatDateLabel(task.date);
  const formattedTime = task.isFullDay ? '' : formatTimeLabel(task.time);
  const metaParts = [];
  if (formattedDate) metaParts.push(formattedDate);
  if (task.isFullDay) metaParts.push(labels.allDayLabel);
  else if (formattedTime) metaParts.push(formattedTime);
  const topMetaVisible = metaParts.length > 0;

  const tagList = React.useMemo(() => {
    if (!task.tags) return [];
    return String(task.tags)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [task.tags]);

  const priorityInfo = React.useMemo(() => {
    const slug = (task.priority || 'medium').toLowerCase();
    switch (slug) {
      case 'top':
      case 'high':
        return { color: '#ef4444', label: labels.priorityTop, slug: 'top' };
      case 'low':
        return { color: '#22c55e', label: labels.priorityLow, slug: 'low' };
      default:
        return { color: '#facc15', label: labels.priorityMedium, slug: 'medium' };
    }
  }, [task.priority, labels.priorityTop, labels.priorityMedium, labels.priorityLow]);

  const dragButton = (extraClasses) => (
    <button
      type="button"
      className={`flex items-center justify-center p-1 rounded hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing ${extraClasses}`}
      aria-label={labels.dragTask}
      title={labels.dragTask}
      {...dragHandleListeners}
      style={{ color: 'var(--text-secondary)' }}
    >
      <GripVertical size={18} />
    </button>
  );

  const renderActionButtons = (extraClasses) => (
    <div className={`flex items-center gap-2 ${extraClasses}`}>
      {showCompletedControl && (
        <button
          type="button"
          className="flex items-center gap-2 rounded px-2 py-1 text-xs min-[600px]:text-sm transition-colors border"
          onClick={(event) => {
            event.stopPropagation();
            onToggleCompleted(task, originalIndex, !task.completed);
          }}
          aria-pressed={task.completed}
          aria-label={task.completed ? labels.markAsTodo : labels.markAsDone}
          style={{
            color: 'var(--text-primary)',
            borderColor: 'var(--border-primary)'
          }}
        >
          <SquareCheckBig
            size={18}
            strokeWidth={task.completed ? 2.5 : 1.5}
            style={{
              color: task.completed ? 'var(--accent)' : 'var(--text-secondary)',
              fill: 'transparent'
            }}
          />
          <span className="hidden min-[600px]:inline" style={{ color: 'var(--text-primary)' }}>
            {task.completed ? labels.completed : labels.notCompleted}
          </span>
        </button>
      )}

      <button
        type="button"
        className="p-1 rounded hover:bg-white/10 transition-colors"
        aria-label={isExpanded ? labels.hideDetails : labels.showDetails}
        onClick={(event) => {
          event.stopPropagation();
          onToggleDetails?.(task.id);
        }}
        style={{ color: 'var(--text-secondary)' }}
      >
        {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>

      <CrossIcon
        className="hover:text-red-500 transition-colors duration-300 flex-shrink-0"
        style={{ color: 'var(--text-secondary)' }}
        strokeWidth={1}
        absoluteStrokeWidth
        size={20}
        onClick={(event) => {
          event.stopPropagation();
          onRequestDelete?.(originalIndex);
        }}
      />
    </div>
  );

  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes} className="p-4 rounded shadow-sm border">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between min-[600px]:hidden">
          {dragButton('')}
          {renderActionButtons('')}
        </div>

        <div className="min-[600px]:hidden space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-semibold">{displayIndex + 1}</span>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: priorityInfo.color }}
            />
            <span className="font-medium capitalize break-words" style={{ color: 'var(--text-primary)' }}>
              {task.name}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {topMetaVisible ? metaParts.join(' · ') : '\u00A0'}
          </span>
        </div>

        <div className="hidden min-[600px]:flex items-center gap-3 min-w-0">
          {dragButton('hidden min-[600px]:flex')}

          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {displayIndex + 1}
          </span>

          <span
            className="flex items-center gap-2 text-xs"
            title={priorityInfo.label}
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: priorityInfo.color }}
            />
          </span>

          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-medium capitalize truncate" style={{ color: 'var(--text-primary)' }}>
              {task.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {topMetaVisible ? metaParts.join(' · ') : '\u00A0'}
            </span>
          </div>

          {renderActionButtons('hidden min-[600px]:flex ml-auto')}
        </div>
      </div>

      {isExpanded && (
        <div
          className="mt-4 pt-4 space-y-3 text-sm"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          <div>
            <p className="uppercase text-xs tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            </p>
            <p style={{ color: 'var(--text-primary)' }}>{task.details || labels.none}</p>
          </div>

          {(task.isFullDay || formattedTime) && (
            <div className="flex flex-wrap gap-4" style={{ color: 'var(--text-secondary)' }}>
              <span>
                <strong>{labels.time}:</strong> {task.isFullDay ? labels.allDayLabel : formattedTime}
              </span>
            </div>
          )}

          {tagList.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-2"
              style={{
                color: 'var(--text-secondary)',
                alignSelf: 'flex-start',
              }}
            >
              {tagList.map((tag, tagIndex) => (
                <span
                  key={`${tag}-${tagIndex}`}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {showEditControl && (
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
              }}
              onClick={(event) => {
                event.stopPropagation();
                onEdit(task, originalIndex);
              }}
            >
              <Pencil size={16} />
              {labels.editTask}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DroppableTasksContainer({ children }) {
  const { setNodeRef } = useDroppable({ id: 'tasks-container' });
  return (
    <div ref={setNodeRef} className="space-y-2 w-full max-w-[800px]">
      {children}
    </div>
  );
}

export default function TaskList({
  tasks,
  setTasks,
  onDeleteTask,
  onToggleTaskDetails,
  selectedTaskId,
  onToggleCompleted,
  onEditTask,
}) {
  const [activeId, setActiveId] = React.useState(null);
  const [internalExpandedId, setInternalExpandedId] = React.useState(null);
  const [pendingDeleteIndex, setPendingDeleteIndex] = React.useState(null);
  const [isBrowser, setIsBrowser] = React.useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
    setIsBrowser(true);
  }, []);

  const labels = React.useMemo(() => ({
    details: t('details'),
    date: t('date'),
    time: t('time'),
    taskCompleted: t('taskCompleted'),
    editTask: t('editTask'),
    completed: t('completed') || 'Done',
    notCompleted: t('notCompleted') || 'To do',
    yes: t('yes') || 'Yes',
    no: t('no') || 'No',
    none: ' ',
    noDate: t('noDate') || '—',
    noTime: t('noTime') || '—',
    allDayLabel: t('allDayLabel') || 'All day',
    showDetails: t('showDetails') || 'Show details',
    hideDetails: t('hideDetails') || 'Hide details',
    dragTask: t('dragTask') || 'Drag to reorder',
    confirmDeleteTitle: t('confirmDeleteTitle') || 'Delete task',
    confirmDeleteMessage: t('confirmDeleteMessage') || 'Are you sure you want to delete this task?',
    confirmDelete: t('confirmDelete') || 'Delete',
    cancel: t('cancel') || 'Cancel',
  }), [t]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayItems = React.useMemo(
    () => tasks
      .map((taskObj, originalIndex) => ({ task: taskObj, originalIndex }))
      .filter(({ task }) => !task.completed),
    [tasks]
  );

  const effectiveExpandedId = selectedTaskId ?? internalExpandedId;

  const handleToggleDetails = React.useCallback((taskId) => {
    if (onToggleTaskDetails) {
      onToggleTaskDetails(taskId);
    } else {
      setInternalExpandedId((prev) => (prev === taskId ? null : taskId));
    }
  }, [onToggleTaskDetails]);

  const handleRequestDelete = React.useCallback((taskIndex) => {
    setPendingDeleteIndex(taskIndex);
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (pendingDeleteIndex === null) return;
    onDeleteTask(pendingDeleteIndex);
    setPendingDeleteIndex(null);
  }, [pendingDeleteIndex, onDeleteTask]);

  const handleCancelDelete = React.useCallback(() => {
    setPendingDeleteIndex(null);
  }, []);

  const pendingDeleteTask = pendingDeleteIndex !== null ? tasks[pendingDeleteIndex] : null;

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      const taskIndex = tasks.findIndex((task, index) => `task-${index}` === active.id);
      if (taskIndex !== -1) onDeleteTask(taskIndex);
      return;
    }

    if (over.id === 'tasks-container') {
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task, index) => `task-${index}` === active.id);
      const newIndex = tasks.findIndex((task, index) => `task-${index}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setTasks(arrayMove(tasks, oldIndex, newIndex));
      }
    }
  };

  const activeTask = activeId ? tasks.find((task, index) => `task-${index}` === activeId) : null;

  // Handler to mark a task as completed
  const handleToggleCompleted = React.useCallback((task, originalIndex, completed) => {
    if (typeof onToggleCompleted === 'function') {
      onToggleCompleted(task, originalIndex, completed);
    } else {
      setTasks((prevTasks) =>
        prevTasks.map((t, i) => (i === originalIndex ? { ...t, completed } : t))
      );
    }
  }, [onToggleCompleted, setTasks]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={displayItems.map(({ originalIndex }) => `task-${originalIndex}`)}
        strategy={verticalListSortingStrategy}
      >
        <DroppableTasksContainer>
          {displayItems.map(({ task: taskObj, originalIndex }, displayIndex) => (
            <SortableItem
              key={`task-${originalIndex}`}
              id={`task-${originalIndex}`}
              task={taskObj}
              displayIndex={displayIndex}
              originalIndex={originalIndex}
              onToggleDetails={handleToggleDetails}
              isExpanded={effectiveExpandedId === taskObj.id}
              onToggleCompleted={handleToggleCompleted}
              onEdit={onEditTask}
              onRequestDelete={handleRequestDelete}
              labels={labels}
            />
          ))}
        </DroppableTasksContainer>
      </SortableContext>

      <DragOverlay>
        {activeId && activeTask ? (
          <div
            className="p-4 rounded shadow-lg border-2 opacity-80"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-hover)',
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                  {activeTask.name}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatDateLabel(activeTask.date) || labels.noDate}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {activeTask.isFullDay
                    ? labels.allDayLabel
                    : (activeTask.time ? (formatTimeLabel(activeTask.time) || labels.noTime) : '\u00A0')}
                </span>
              </div>
              <CrossIcon style={{ color: 'var(--text-secondary)' }} size={20} />
            </div>
          </div>
        ) : null}

      </DragOverlay>
      {isBrowser && pendingDeleteIndex !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div
              className="w-full max-w-sm rounded-lg p-6 space-y-4"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
              }}
            >
              <div className="space-y-1">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{labels.confirmDeleteTitle}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {labels.confirmDeleteMessage}
                  {pendingDeleteTask?.name ? ` "${pendingDeleteTask.name}"` : ''}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded border text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-primary)',
                  }}
                  onClick={handleCancelDelete}
                >
                  {labels.cancel}
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                  }}
                  onClick={handleConfirmDelete}
                >
                  {labels.confirmDelete}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </DndContext>
  );
}
