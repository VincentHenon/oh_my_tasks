'use client'

import { useState, useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useDeviceDetection } from '../hooks/useDeviceDetection'
import { Calendar, ChevronLeft, ChevronRight, Plus, ArrowLeft } from 'lucide-react'
import CrossIcon from './CrossIcon'

export default function CalendarModal({ isOpen = false, onClose = () => {}, tasks = [] }) {
  const { t } = useLanguage()
  const device = useDeviceDetection()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayViewAnimating, setDayViewAnimating] = useState(false)
  const [animationState, setAnimationState] = useState('hidden') // 'hidden', 'sliding-in', 'visible', 'sliding-out'

  // Get tasks with due dates (support both 'date' and 'dueDate' fields)
  const tasksWithDates = useMemo(() => {
    return tasks.filter(task => (task.date || task.dueDate) && !task.completed).map(task => ({
      ...task,
      date: new Date(task.date || task.dueDate)
    }))
  }, [tasks])

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getMonthName = (date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const getTasksForDate = (day) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return tasksWithDates.filter(task => 
      task.date.toDateString() === targetDate.toDateString()
    )
  }

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const openDayView = (day) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDay(selectedDate)
    setAnimationState('hidden')
    
    // Animation sequence - démarrer depuis hidden puis animer
    requestAnimationFrame(() => {
      setAnimationState('sliding-in')
      setTimeout(() => {
        setAnimationState('visible')
      }, 400)
    })
  }

  const closeDayView = () => {
    setAnimationState('sliding-out')
    
    setTimeout(() => {
      setAnimationState('hidden')
      setSelectedDay(null)
    }, 400)
  }

  const getTasksForSelectedDay = () => {
    if (!selectedDay) return []
    return tasksWithDates.filter(task => 
      task.date.toDateString() === selectedDay.toDateString()
    )
  }

  const generateHourSlots = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: i,
        label: i === 0 ? '00:00' : i < 10 ? `0${i}:00` : `${i}:00`,
        displayLabel: i === 0 ? 'Minuit' : 
                    i === 12 ? 'Midi' : 
                    i < 12 ? `${i}h` : `${i}h`
      })
    }
    return hours
  }

  const getTasksForHour = (hour) => {
    const dayTasks = getTasksForSelectedDay()
    return dayTasks.filter(task => {
      if (task.isFullDay) return hour === 0 // Full day tasks appear at midnight
      if (!task.time) return false
      
      const taskHour = parseInt(task.time.split(':')[0])
      return taskHour === hour
    })
  }

  const getFullDayTasks = () => {
    const dayTasks = getTasksForSelectedDay()
    return dayTasks.filter(task => task.isFullDay)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border" style={{ borderColor: 'var(--border-primary)' }}>
        </div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDate(day)
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
      
      days.push(
        <div 
          key={day} 
          className="h-24 border p-1 relative hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          style={{ borderColor: 'var(--border-primary)' }}
          onClick={() => openDayView(day)}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`} 
               style={{ color: isToday ? undefined : 'var(--text-primary)' }}>
            {day}
          </div>
          
          {dayTasks.length > 0 && (
            <div className="mt-1 space-y-1">
              {dayTasks.slice(0, 2).map((task, index) => {
                // Calculate priority color like other components
                const priorityColor = (() => {
                  const slug = (task.priority || 'medium').toLowerCase();
                  switch (slug) {
                    case 'top':
                    case 'high':
                      return '#ef4444';
                    case 'low':
                      return '#22c55e';
                    default:
                      return '#facc15';
                  }
                })();

                return (
                  <div 
                    key={task.id}
                    className="text-xs p-1 rounded truncate flex items-center gap-1"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)'
                    }}
                    title={`${task.text || task.name} - ${task.priority || 'medium'} priority`}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: priorityColor }}
                    />
                    <span className="truncate">{task.text || task.name}</span>
                  </div>
                );
              })}
              {dayTasks.length > 2 && (
                <div className="text-xs px-1" style={{ color: 'var(--text-secondary)' }}>
                  +{dayTasks.length - 2} plus
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return days
  }

  const upcomingTasks = useMemo(() => {
    // Get first and last day of the current month being displayed
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    lastDayOfMonth.setHours(23, 59, 59, 999)
    
    return tasksWithDates
      .filter(task => task.date >= firstDayOfMonth && task.date <= lastDayOfMonth)
      .sort((a, b) => a.date - b.date)
      .slice(0, 10) // Show more tasks since it's for the whole month
  }, [tasksWithDates, currentDate])

  return (
    <>
      {/* Calendar Drawer - Always rendered for animation */}
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
            <Calendar size={24} style={{ color: 'var(--text-primary)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('calendar')}
            </h2>
          </div>
          <CrossIcon
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onClose}
            size={28}
          />
        </div>

        {/* Calendar Content */}
        <div 
          className={device.isMobile ? 'p-4' : 'p-6'}
          style={{ 
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          
          {/* Day View - Expanded view when a day is selected */}
          {selectedDay && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'var(--bg-secondary)',
                transform: animationState === 'hidden' ? 'translateX(100%) scale(0.7)' : 
                          animationState === 'sliding-in' ? 'translateX(0) scale(1)' :
                          animationState === 'visible' ? 'translateX(0) scale(1)' :
                          'translateX(100%) scale(0.8)',
                opacity: animationState === 'hidden' ? 0 : 
                        animationState === 'sliding-in' ? 1 :
                        animationState === 'visible' ? 1 :
                        0,
                transition: animationState === 'hidden' ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease',
                zIndex: 10,
                pointerEvents: animationState === 'hidden' ? 'none' : 'auto'
              }}
            >
              <div 
                className={device.isMobile ? 'p-4' : 'p-6'}
                style={{ height: '100%', overflowY: 'auto' }}
              >
              {/* Day View Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeDayView}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedDay.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                </div>
              </div>

              {/* Full Day Tasks */}
              {getFullDayTasks().length > 0 && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Toute la journée
                  </h4>
                  <div className="space-y-2">
                    {getFullDayTasks().map(task => {
                      const priorityColor = (() => {
                        const slug = (task.priority || 'medium').toLowerCase();
                        switch (slug) {
                          case 'top':
                          case 'high':
                            return '#ef4444';
                          case 'low':
                            return '#22c55e';
                          default:
                            return '#facc15';
                        }
                      })();

                      return (
                        <div 
                          key={task.id}
                          className="flex items-center gap-2 p-2 rounded"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: priorityColor }}
                          />
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {task.text || task.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hour by Hour Schedule */}
              <div className="space-y-0 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
                {generateHourSlots().map(hourSlot => {
                  const tasksForHour = getTasksForHour(hourSlot.hour)
                  
                  return (
                    <div 
                      key={hourSlot.hour}
                      className="flex border-b last:border-b-0"
                      style={{ borderColor: 'var(--border-primary)' }}
                    >
                      {/* Hour Label */}
                      <div 
                        className="w-16 p-2 text-right border-r flex-shrink-0"
                        style={{ 
                          borderColor: 'var(--border-primary)',
                          backgroundColor: 'var(--bg-tertiary)'
                        }}
                      >
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {hourSlot.displayLabel}
                        </span>
                      </div>
                      
                      {/* Tasks for this hour */}
                      <div className="flex-1 min-h-[2.5rem] p-2">
                        {tasksForHour.length > 0 ? (
                          <div className="space-y-1">
                            {tasksForHour.map(task => {
                              const priorityColor = (() => {
                                const slug = (task.priority || 'medium').toLowerCase();
                                switch (slug) {
                                  case 'top':
                                  case 'high':
                                    return '#ef4444';
                                  case 'low':
                                    return '#22c55e';
                                  default:
                                    return '#facc15';
                                }
                              })();

                              return (
                                <div 
                                  key={task.id}
                                  className="flex items-center gap-2 p-1.5 rounded text-sm"
                                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                >
                                  <span
                                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: priorityColor }}
                                  />
                                  <span style={{ color: 'var(--text-primary)' }}>
                                    {task.text || task.name}
                                  </span>
                                  {task.time && (
                                    <span className="text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
                                      {task.time}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex items-center">
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {/* Empty hour slot */}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          )}

          {/* Regular Calendar View - Hidden when day view is active */}
          <div 
            style={{
              transform: selectedDay && (animationState === 'sliding-in' || animationState === 'visible') ? 'translateX(-50%) scale(0.85)' : 'translateX(0) scale(1)',
              opacity: selectedDay && (animationState === 'sliding-in' || animationState === 'visible') ? 0.3 : 1,
              transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease',
              pointerEvents: selectedDay && (animationState === 'sliding-in' || animationState === 'visible') ? 'none' : 'auto'
            }}
          >
            {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
              {getMonthName(currentDate)}
            </h3>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid - Compact version for drawer */}
          <div className="mb-6">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days - Smaller grid for drawer */}
            <div className="grid grid-cols-7 text-xs">
              {renderCalendarDays()}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold" style={{ color: 'var(--text-primary)' }}>
                Tâches de {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h4>
              {upcomingTasks.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  color: 'var(--text-secondary)' 
                }}>
                  {upcomingTasks.length} tâche{upcomingTasks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.map(task => {
                  // Calculate priority info like other components
                  const priorityInfo = (() => {
                    const slug = (task.priority || 'medium').toLowerCase();
                    switch (slug) {
                      case 'top':
                      case 'high':
                        return { color: '#ef4444', label: 'Haute' };
                      case 'low':
                        return { color: '#22c55e', label: 'Basse' };
                      default:
                        return { color: '#facc15', label: 'Moyenne' };
                    }
                  })();

                  return (
                    <div 
                      key={task.id}
                      className="p-3 rounded-lg border"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0"
                          style={{ backgroundColor: priorityInfo.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {task.text || task.name}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {task.date.toLocaleDateString('fr-FR', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Aucune tâche pour {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  )
}