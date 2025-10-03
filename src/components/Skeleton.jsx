import React from 'react'

export const SkeletonItem = ({ className = '', ...props }) => (
  <div
    className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded ${className}`}
    style={{ backgroundColor: 'var(--skeleton-bg, #e5e7eb)' }}
    {...props}
  />
)

export const TaskSkeleton = () => (
  <div 
    className="p-4 rounded-lg border mb-3 animate-pulse"
    style={{ 
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-primary)'
    }}
  >
    <div className="flex items-start gap-3">
      {/* Checkbox skeleton */}
      <SkeletonItem className="w-4 h-4 rounded mt-1 flex-shrink-0" />
      
      <div className="flex-1 space-y-2">
        {/* Task title skeleton - random width */}
        <SkeletonItem 
          className="h-4"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
        
        {/* Task description skeleton - sometimes present */}
        {Math.random() > 0.5 && (
          <SkeletonItem 
            className="h-3"
            style={{ width: `${Math.random() * 30 + 40}%` }}
          />
        )}
        
        {/* Tags and metadata skeleton */}
        <div className="flex items-center gap-2 mt-2">
          <SkeletonItem className="w-16 h-5 rounded-full" />
          <SkeletonItem className="w-20 h-5 rounded-full" />
          {Math.random() > 0.6 && <SkeletonItem className="w-14 h-5 rounded-full" />}
        </div>
      </div>
      
      {/* Priority/actions skeleton */}
      <div className="flex items-center gap-2">
        <SkeletonItem className="w-6 h-6 rounded" />
        <SkeletonItem className="w-6 h-6 rounded" />
      </div>
    </div>
  </div>
)

export const TaskListSkeleton = ({ count = 6 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, index) => (
      <TaskSkeleton key={index} />
    ))}
  </div>
)

export const TaskHistorySkeleton = ({ count = 8 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }, (_, index) => (
      <div 
        key={index}
        className="p-3 rounded-lg border animate-pulse"
        style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="flex items-start gap-3">
          {/* Completed icon skeleton */}
          <SkeletonItem className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 space-y-2">
            {/* Task title skeleton */}
            <SkeletonItem 
              className="h-4"
              style={{ width: `${Math.random() * 35 + 50}%` }}
            />
            
            {/* Completion date skeleton */}
            <SkeletonItem 
              className="h-3"
              style={{ width: `${Math.random() * 20 + 30}%` }}
            />
            
            {/* Category and priority skeleton */}
            <div className="flex items-center gap-2 mt-1">
              <SkeletonItem className="w-12 h-4 rounded-full" />
              <SkeletonItem className="w-16 h-4 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const CalendarSkeleton = () => (
  <div className="space-y-4">
    {/* Month navigation skeleton */}
    <div className="flex items-center justify-between">
      <SkeletonItem className="w-8 h-8 rounded" />
      <SkeletonItem className="w-32 h-6 rounded" />
      <SkeletonItem className="w-8 h-8 rounded" />
    </div>
    
    {/* Calendar grid skeleton */}
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {Array.from({ length: 7 }, (_, i) => (
        <SkeletonItem key={`header-${i}`} className="h-8 rounded" />
      ))}
      
      {/* Calendar days */}
      {Array.from({ length: 35 }, (_, i) => (
        <div key={`day-${i}`} className="h-20 border rounded" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="p-1">
            <SkeletonItem className="w-6 h-4 rounded mb-1" />
            {Math.random() > 0.7 && (
              <SkeletonItem className="w-full h-3 rounded mb-1" />
            )}
            {Math.random() > 0.8 && (
              <SkeletonItem className="w-3/4 h-3 rounded" />
            )}
          </div>
        </div>
      ))}
    </div>
    
    {/* Upcoming tasks skeleton */}
    <div className="space-y-2">
      <SkeletonItem className="w-32 h-5 rounded" />
      {Array.from({ length: 3 }, (_, i) => (
        <div 
          key={`upcoming-${i}`}
          className="p-3 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}
        >
          <SkeletonItem className="w-3/4 h-4 rounded mb-2" />
          <SkeletonItem className="w-1/2 h-3 rounded" />
        </div>
      ))}
    </div>
  </div>
)

// Settings skeleton for loading state
export const SettingsSkeleton = () => (
  <div className="space-y-6">
    {/* Language Section */}
    <fieldset className="space-y-4">
      <SkeletonItem className="w-20 h-4 rounded mb-4" />
      <SkeletonItem className="w-full h-10 rounded-md" />
    </fieldset>

    {/* Notifications Section */}
    <fieldset className="space-y-4">
      <SkeletonItem className="w-32 h-4 rounded mb-4" />
      
      {/* First notification option */}
      <div className="flex items-start gap-3">
        <SkeletonItem className="w-4 h-4 rounded mt-1" />
        <div className="flex-1 space-y-2">
          <SkeletonItem className="w-3/4 h-4 rounded" />
          <SkeletonItem className="w-full h-3 rounded" />
        </div>
      </div>
      
      {/* Second notification option */}
      <div className="flex items-start gap-3">
        <SkeletonItem className="w-4 h-4 rounded mt-1" />
        <div className="flex-1 space-y-2">
          <SkeletonItem className="w-2/3 h-4 rounded" />
          <SkeletonItem className="w-5/6 h-3 rounded" />
        </div>
      </div>
    </fieldset>

    {/* Button skeleton */}
    <SkeletonItem className="w-full h-10 rounded-md" />
  </div>
)

export default {
  SkeletonItem,
  TaskSkeleton,
  TaskListSkeleton,
  TaskHistorySkeleton,
  CalendarSkeleton,
  SettingsSkeleton
}