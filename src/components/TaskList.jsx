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

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', ''].includes(normalized)) return false;
  }
  return Boolean(value);
};

/**
 * Formats a date value into a readable label
 * Handles various date formats and edge cases from the PHP API
 */
const formatDateLabel = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  // Handle the specific "0000-00-00" value from your PHP API
  if (!trimmed || trimmed === '0000-00-00') return '';
  
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.warn('Error formatting date:', value, error);
    return '';
  }
};

/**
 * Formats a time value into a readable label
 * Handles various time formats from PHP API and converts to 12-hour format
 */
const formatTimeLabel = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  // Handle the specific "00:00:00" value from your PHP API
  if (!trimmed || trimmed === '00:00:00' || trimmed === '00:00') return '';
  
  try {
    const [hours, minutes] = value.split(':');
    if (hours === undefined || minutes === undefined) return '';
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.warn('Error formatting time:', value, error);
    return '';
  }
};

/**
 * Individual sortable task item component
 * Handles display, interaction, and drag/drop functionality for a single task
 */
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

  // Create drag handle listeners that prevent event bubbling
  const dragHandleListeners = React.useMemo(() => {
    if (!listeners) return {};
    const { onPointerDown, ...rest } = listeners;
    return {
      ...rest,
      onPointerDown: (event) => {
        event.stopPropagation();
        onPointerDown?.(event);
      },
    };
  }, [listeners]);

  // Check which controls should be shown based on available props
  const showCompletedControl = typeof onToggleCompleted === 'function';
  const showEditControl = typeof onEdit === 'function';

  // Memoized card styling for drag animations
  const cardStyle = React.useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: 'var(--bg-secondary)',
    border: `1px solid ${isExpanded ? 'var(--border-hover)' : 'var(--border-primary)'}`,
    boxShadow: isExpanded ? '0 0 0 2px var(--border-hover)' : 'none',
  }), [transform, transition, isDragging, isExpanded]);

  // Format date and time for display with proper handling of API data
  const formattedDate = React.useMemo(() => formatDateLabel(task.date), [task.date]);
  const formattedTime = React.useMemo(() => 
    task.isFullDay ? '' : formatTimeLabel(task.time), [task.time, task.isFullDay]);
  
  // Build metadata parts for display
  const metaParts = React.useMemo(() => {
    const parts = [];
    if (formattedDate) parts.push(formattedDate);
    if (task.isFullDay) parts.push(labels.allDayLabel);
    else if (formattedTime) parts.push(formattedTime);
    return parts;
  }, [formattedDate, formattedTime, task.isFullDay, labels.allDayLabel]);
  
  const topMetaVisible = metaParts.length > 0;

  // Parse and prepare tags for display with error handling
  const tagList = React.useMemo(() => {
    if (!task.tags) return [];
    try {
      return String(task.tags)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    } catch (error) {
      console.warn('Error parsing tags:', task.tags, error);
      return [];
    }
  }, [task.tags]);

  // Determine priority information for display
  const priorityInfo = React.useMemo(() => {
    const slug = (task.priority || 'medium').toLowerCase();
    switch (slug) {
      case 'top':
      case 'high':
        return { color: '#ef4444', label: labels.priorityTop || 'High', slug: 'top' };
      case 'low':
        return { color: '#22c55e', label: labels.priorityLow || 'Low', slug: 'low' };
      default:
        return { color: '#facc15', label: labels.priorityMedium || 'Medium', slug: 'medium' };
    }
  }, [task.priority, labels.priorityTop, labels.priorityMedium, labels.priorityLow]);

  /**
   * Renders the drag handle button with proper event handling
   */
  const renderDragButton = React.useCallback((extraClasses) => (
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
  ), [dragHandleListeners, labels.dragTask]);

  /**
   * Renders the action buttons (complete, details, delete) with proper event handling
   */
  const renderActionButtons = React.useCallback((extraClasses) => (
    <div className={`flex items-center gap-2 ${extraClasses}`}>
      {showCompletedControl && (
        <button
          type="button"
          className="flex items-center gap-2 rounded px-2 py-1 text-xs min-[600px]:text-sm transition-colors border"
          onClick={(event) => {
            event.stopPropagation();
            // Pass the original index (position in the full tasks array) instead of task object
            onToggleCompleted(originalIndex);
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
  ), [showCompletedControl, task.completed, task.id, originalIndex, isExpanded, labels, onToggleCompleted, onToggleDetails, onRequestDelete]);

  // Get the task name from either 'name' or 'title' field (API compatibility)
  const taskDisplayName = task.name || task.title || 'Untitled Task';

  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes} className="p-4 rounded shadow-sm border">
      <div className="flex flex-col gap-3">
        {/* Mobile layout - controls on top */}
        <div className="flex items-center justify-between min-[600px]:hidden">
          {renderDragButton('')}
          {renderActionButtons('')}
        </div>

        {/* Mobile layout - task info */}
        <div className="min-[600px]:hidden space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="font-semibold">{displayIndex + 1}</span>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: priorityInfo.color }}
            />
            <span className="font-medium capitalize break-words" style={{ color: 'var(--text-primary)' }}>
              {taskDisplayName}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {topMetaVisible ? metaParts.join(' · ') : '\u00A0'}
          </span>
        </div>

        {/* Desktop layout - single row */}
        <div className="hidden min-[600px]:flex items-center gap-3 min-w-0">
          {renderDragButton('hidden min-[600px]:flex')}

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

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="font-medium capitalize truncate" style={{ color: 'var(--text-primary)' }}>
              {taskDisplayName}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {topMetaVisible ? metaParts.join(' · ') : '\u00A0'}
            </span>
          </div>

          {renderActionButtons('hidden min-[600px]:flex ml-auto')}
        </div>
      </div>

      {/* Expanded details section */}
      {isExpanded && (
        <div
          className="mt-4 pt-4 space-y-3 text-sm"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          {/* Task details */}
          <div>
            <p className="uppercase text-xs tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              {labels.details}
            </p>
            <p style={{ color: 'var(--text-primary)' }}>{task.details || labels.none}</p>
          </div>

          {/* Time information */}
          {(task.isFullDay || formattedTime) && (
            <div className="flex flex-wrap gap-4" style={{ color: 'var(--text-secondary)' }}>
              <span>
                <strong>{labels.time}:</strong> {task.isFullDay ? labels.allDayLabel : formattedTime}
              </span>
            </div>
          )}

          {/* Tags display */}
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

          {/* Edit button */}
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

/**
 * Droppable container for the task list
 * Provides the drop zone for drag and drop operations
 */
function DroppableTasksContainer({ children }) {
  const { setNodeRef } = useDroppable({ id: 'tasks-container' });
  return (
    <div ref={setNodeRef} className="space-y-2 w-full max-w-[800px]">
      {children}
    </div>
  );
}

/**
 * Main TaskList component
 * Displays and manages a list of tasks with drag-and-drop, filtering, and CRUD operations
 * Enhanced with debugging to identify data flow issues
 */
export default function TaskList({
  tasks,
  setTasks,
  onDeleteTask,
  onToggleTaskDetails,
  selectedTaskId,
  onToggleComplete,
  onEditTask,
}) {
  const [activeId, setActiveId] = React.useState(null);
  const [internalExpandedId, setInternalExpandedId] = React.useState(null);
  const [pendingDeleteIndex, setPendingDeleteIndex] = React.useState(null);
  const [isBrowser, setIsBrowser] = React.useState(false);
  const { t } = useLanguage();

  // Enhanced debugging to track data flow and identify issues
  React.useEffect(() => {
    console.log('===== TaskList Component Debug =====');
    console.log('Received tasks prop:', tasks);
    console.log('Tasks type:', typeof tasks);
    console.log('Is tasks an array?', Array.isArray(tasks));
    
    if (Array.isArray(tasks)) {
      console.log('Tasks array length:', tasks.length);
      console.log('All tasks:', tasks);
      
      // Log each task with its completion status
      tasks.forEach((task, index) => {
        console.log(`Task ${index + 1}:`, {
          id: task.id,
          name: task.name || task.title,
          completed: task.completed,
          isFullDay: task.isFullDay,
          date: task.date,
          time: task.time
        });
      });

      // Check filtering logic
      const nonCompletedTasks = tasks.filter(task => !task.completed);
      console.log('Non-completed tasks count:', nonCompletedTasks.length);
      console.log('Non-completed tasks:', nonCompletedTasks);
    } else {
      console.error('Tasks is not an array! This will prevent rendering.');
    }
    console.log('=====================================');
  }, [tasks]);

  // Set browser flag for portal rendering
  React.useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Memoized labels for internationalization with comprehensive fallbacks
  const labels = React.useMemo(() => ({
    details: t('details') || 'Details',
    date: t('date') || 'Date',
    time: t('time') || 'Time',
    taskCompleted: t('taskCompleted') || 'Task completed',
    editTask: t('editTask') || 'Edit task',
    completed: t('completed') || 'Done',
    notCompleted: t('notCompleted') || 'To do',
    markAsDone: t('markAsDone') || 'Mark as done',
    markAsTodo: t('markAsTodo') || 'Mark as to do',
    yes: t('yes') || 'Yes',
    no: t('no') || 'No',
    none: t('none') || 'None',
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
    priorityTop: t('priorityTop') || 'High',
    priorityMedium: t('priorityMedium') || 'Medium',
    priorityLow: t('priorityLow') || 'Low',
  }), [t]);

  // Configure drag and drop sensors with better activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Enhanced filtering and preparation logic with comprehensive error handling
  const displayItems = React.useMemo(() => {
    console.log('=== displayItems calculation ===');
    
    // Validate that tasks is an array
    if (!Array.isArray(tasks)) {
      console.warn('Tasks is not an array in displayItems calculation:', tasks);
      return [];
    }

    // Filter for non-completed tasks and prepare for display
    const filteredItems = tasks
      .map((taskObj, originalIndex) => {
        // Ensure task object has required properties with defaults
        const normalizedTask = {
          id: taskObj.id || `temp-${originalIndex}`,
          name: taskObj.name || taskObj.title || 'Untitled Task',
          title: taskObj.title || taskObj.name || 'Untitled Task',
          details: taskObj.details || '',
          date: taskObj.date || '0000-00-00',
          time: taskObj.time || '00:00:00',
          isFullDay: toBoolean(taskObj.isFullDay),
          urgent: toBoolean(taskObj.urgent ?? taskObj.isUrgent),
          completed: toBoolean(taskObj.completed),
          tags: taskObj.tags || '',
          priority: taskObj.priority || 'medium',
          email: taskObj.email || '',
          ...taskObj // Preserve any additional properties
        };
        
        return { task: normalizedTask, originalIndex };
      })
      .filter(({ task }) => !task.completed);

    console.log('Filtered display items:', filteredItems);
    console.log('Display items count:', filteredItems.length);
    
    return filteredItems;
  }, [tasks]);

  // Determine which task should be expanded
  const effectiveExpandedId = selectedTaskId ?? internalExpandedId;

  /**
   * Handles toggling task details (expand/collapse)
   */
  const handleToggleDetails = React.useCallback((taskId) => {
    console.log('Toggling details for task ID:', taskId);
    if (onToggleTaskDetails) {
      onToggleTaskDetails(taskId);
    } else {
      setInternalExpandedId((prev) => (prev === taskId ? null : taskId));
    }
  }, [onToggleTaskDetails]);

  /**
   * Handles request to delete a task (shows confirmation dialog)
   */
  const handleRequestDelete = React.useCallback((taskIndex) => {
    console.log('Delete request for task at index:', taskIndex);
    setPendingDeleteIndex(taskIndex);
  }, []);

  /**
   * Confirms and executes task deletion
   */
  const handleConfirmDelete = React.useCallback(() => {
    if (pendingDeleteIndex === null) return;
    console.log('Confirming delete for task at index:', pendingDeleteIndex);
    onDeleteTask(pendingDeleteIndex);
    setPendingDeleteIndex(null);
  }, [pendingDeleteIndex, onDeleteTask]);

  /**
   * Cancels task deletion
   */
  const handleCancelDelete = React.useCallback(() => {
    console.log('Canceling task deletion');
    setPendingDeleteIndex(null);
  }, []);

  // Get the task that's pending deletion for confirmation dialog
  const pendingDeleteTask = React.useMemo(() => {
    if (pendingDeleteIndex === null || !Array.isArray(tasks)) return null;
    return tasks[pendingDeleteIndex] || null;
  }, [pendingDeleteIndex, tasks]);

  /**
   * Handles drag start event
   */
  const handleDragStart = React.useCallback((event) => {
    console.log('Drag started for item:', event.active.id);
    setActiveId(event.active.id);
  }, []);

  /**
   * Handles drag end event and reordering
   */
  const handleDragEnd = React.useCallback((event) => {
    const { active, over } = event;
    console.log('Drag ended:', { activeId: active.id, overId: over?.id });
    setActiveId(null);

    if (!Array.isArray(tasks)) {
      console.warn('Cannot handle drag end: tasks is not an array');
      return;
    }

    // If dropped outside of a valid drop zone, treat as delete request
    if (!over) {
      const taskIndex = tasks.findIndex((task, index) => `task-${index}` === active.id);
      if (taskIndex !== -1) {
        console.log('Deleting task dropped outside zone, index:', taskIndex);
        onDeleteTask(taskIndex);
      }
      return;
    }

    // If dropped on the container but not on another task, do nothing
    if (over.id === 'tasks-container') {
      console.log('Dropped on container, no reordering');
      return;
    }

    // Handle reordering if dropped on another task
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task, index) => `task-${index}` === active.id);
      const newIndex = tasks.findIndex((task, index) => `task-${index}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log('Reordering tasks from index', oldIndex, 'to', newIndex);
        setTasks(arrayMove(tasks, oldIndex, newIndex));
      }
    }
  }, [tasks, onDeleteTask, setTasks]);

  // Find the task being dragged for the drag overlay
  const activeTask = React.useMemo(() => {
    if (!activeId || !Array.isArray(tasks)) return null;
    return tasks.find((task, index) => `task-${index}` === activeId) || null;
  }, [activeId, tasks]);

  /**
   * Handles toggling task completion status
   * Uses proper callback pattern and fallback to direct state manipulation
   */
  const handleToggleCompleted = React.useCallback((originalIndex) => {
    console.log('Toggling completion for task at index:', originalIndex);
    
    if (typeof onToggleComplete === 'function') {
      // Call the parent's toggle function with the task index
      onToggleComplete(originalIndex);
    } else {
      console.log('Using fallback completion toggle');
      // Fallback to direct state manipulation if no callback provided
      setTasks((prevTasks) => {
        if (!Array.isArray(prevTasks)) {
          console.warn('Cannot toggle completion: prevTasks is not an array');
          return prevTasks;
        }
        
        return prevTasks.map((task, i) => 
          i === originalIndex 
            ? { ...task, completed: !task.completed } 
            : task
        );
      });
    }
  }, [onToggleComplete, setTasks]);

  // Handle loading state
  if (tasks === null || tasks === undefined) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Loading tasks...
      </div>
    );
  }

  // Handle invalid data type
  if (!Array.isArray(tasks)) {
    console.error('TaskList received invalid tasks data:', tasks);
    return (
      <div className="text-center py-8 text-sm" style={{ color: '#ef4444' }}>
        Error: Invalid tasks data format. Expected array, received: {typeof tasks}
      </div>
    );
  }

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
          {displayItems.length === 0 ? (
            // Show message when no active tasks
            <div 
              className="text-center py-8 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {tasks.length === 0 
                ? "No tasks found. Add a new task to get started!" 
                : "All tasks are completed! Add a new task or check your completed tasks."}
            </div>
          ) : (
            displayItems.map(({ task: taskObj, originalIndex }, displayIndex) => (
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
            ))
          )}
        </DroppableTasksContainer>
      </SortableContext>

      {/* Drag overlay - shows the dragged item */}
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
                  {activeTask.name || activeTask.title || 'Untitled Task'}
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

      {/* Delete confirmation modal */}
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
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {labels.confirmDeleteTitle}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {labels.confirmDeleteMessage}
                  {pendingDeleteTask?.name || pendingDeleteTask?.title ? 
                    ` "${pendingDeleteTask.name || pendingDeleteTask.title}"` : ''}
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
