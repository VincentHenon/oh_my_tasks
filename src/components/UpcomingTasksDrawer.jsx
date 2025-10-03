import { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckSquare, Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

const UpcomingTasksDrawer = ({ isOpen, onClose, tasks = [] }) => {
    const { t } = useLanguage();
    const device = useDeviceDetection();
    const [selectedFilter, setSelectedFilter] = useState('today');
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [expandedTasks, setExpandedTasks] = useState(new Set());
    const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'priority'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc' (descendant par défaut)
    const [arrowRotation, setArrowRotation] = useState({}); // Track rotation for each sort option



    const toggleTaskExpansion = (taskId) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const sortOptions = [
        { id: 'date', label: t('sortByDate') },
        { id: 'name', label: t('sortByName') },
        { id: 'priority', label: t('sortByPriority') }
    ];

    const handleSortClick = (sortType) => {
        if (sortBy === sortType) {
            // Si on clique sur le tri actif, on toggle l'ordre et on fait tourner la flèche
            const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            setSortOrder(newOrder);
            
            // Incrémenter la rotation de 180° pour une animation fluide
            setArrowRotation(prev => ({
                ...prev,
                [sortType]: (prev[sortType] || 0) + 180
            }));
        } else {
            // Si on clique sur un nouveau tri, on l'active en descendant
            setSortBy(sortType);
            setSortOrder('desc');
            
            // Initialiser la rotation à 0° pour le nouveau tri actif
            setArrowRotation(prev => ({
                ...prev,
                [sortType]: 0
            }));
        }
    };

    const sortTasks = (tasks, sortType, order) => {
        const sorted = [...tasks].sort((a, b) => {
            let comparison = 0;
            
            switch (sortType) {
                case 'name':
                    const nameA = (a.text || a.name || '').toLowerCase();
                    const nameB = (b.text || b.name || '').toLowerCase();
                    comparison = nameA.localeCompare(nameB);
                    break;
                
                case 'priority':
                    const priorityOrder = { 'high': 3, 'top': 3, 'medium': 2, 'low': 1 };
                    const priorityA = priorityOrder[(a.priority || 'medium').toLowerCase()] || 2;
                    const priorityB = priorityOrder[(b.priority || 'medium').toLowerCase()] || 2;
                    comparison = priorityB - priorityA; // Higher priority first naturellement
                    break;
                
                case 'date':
                default:
                    // Tri principal par date
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    comparison = dateA - dateB;
                    
                    // Si les dates sont identiques, tri secondaire par heure
                    if (comparison === 0) {
                        const getTimeValue = (task) => {
                            if (task.isFullDay) return 0; // Full day tasks first
                            if (!task.time) return 1440; // Tasks without time last (1440 minutes = end of day)
                            
                            const [hours, minutes] = task.time.split(':').map(Number);
                            return hours * 60 + minutes; // Convert to minutes for comparison
                        };
                        
                        const timeA = getTimeValue(a);
                        const timeB = getTimeValue(b);
                        comparison = timeA - timeB;
                    }
                    break;
            }
            
            // Appliquer l'ordre (desc par défaut, asc si demandé)
            return order === 'asc' ? comparison : -comparison;
        });
        
        return sorted;
    };

    const filters = [
        { id: 'today', label: t('today'), days: 0 },
        { id: 'tomorrow', label: t('tomorrow'), days: 1 },
        { id: 'thisWeek', label: t('thisWeek'), days: 7 },
        { id: 'thisMonth', label: t('thisMonth'), days: 'month' }
    ];

    useEffect(() => {
        if (!tasks.length) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let endDate = new Date(today);
        
        let filtered;

        if (selectedFilter === 'thisMonth') {
            // Filter for current month
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            lastDayOfMonth.setHours(23, 59, 59, 999);

            filtered = tasks.filter(task => {
                if (!task.date) return false;
                
                const taskDate = new Date(task.date);
                const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
                
                return taskDateOnly >= firstDayOfMonth && taskDateOnly <= lastDayOfMonth;
            });
        } else {
            // Existing logic for other filters
            if (selectedFilter === 'today') {
                endDate.setDate(today.getDate() + 1);
            } else if (selectedFilter === 'tomorrow') {
                // Tomorrow only
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                endDate.setDate(today.getDate() + 2); // End date is exclusive, so +2 to include tomorrow
                
                // Also filter to only show tomorrow's tasks
                filtered = tasks.filter(task => {
                    if (!task.date) return false;
                    
                    const taskDate = new Date(task.date);
                    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
                    
                    return taskDateOnly.getTime() === tomorrow.getTime();
                });
            } else if (selectedFilter === 'thisWeek') {
                // This week - from Monday to Sunday
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
                startOfWeek.setDate(today.getDate() + mondayOffset);
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (next Monday)
                
                filtered = tasks.filter(task => {
                    if (!task.date) return false;
                    
                    const taskDate = new Date(task.date);
                    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
                    
                    return taskDateOnly >= startOfWeek && taskDateOnly < endOfWeek;
                });
            }

            if (selectedFilter !== 'tomorrow' && selectedFilter !== 'thisWeek') {
                filtered = tasks.filter(task => {
                    if (!task.date) return false;
                    
                    const taskDate = new Date(task.date);
                    const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
                    
                    return taskDateOnly >= today && taskDateOnly < endDate;
                });
            }
        }

        const sortedFiltered = sortTasks(filtered, sortBy, sortOrder);

        setFilteredTasks(sortedFiltered);
    }, [tasks, selectedFilter, sortBy, sortOrder]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return t('today');
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return t('tomorrow');
        } else {
            return date.toLocaleDateString();
        }
    };



    return (
        <>
            {/* Upcoming Tasks Drawer - Always rendered for animation */}
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
                        <CheckSquare size={24} style={{ color: 'var(--text-primary)' }} />
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {t('upcomingTasks')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors hover:opacity-70"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div 
                    className={`border-b ${device.isMobile ? 'p-4' : 'p-6'}`}
                    style={{ borderColor: 'var(--border-primary)' }}
                >
                        <div className="flex items-center justify-between">
                            <span 
                                className="text-xs font-medium"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {t('filterBy')}
                            </span>
                            <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {filters.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedFilter(filter.id)}
                                    className={`flex-shrink-0 px-2 py-1 text-xs transition-all duration-200 whitespace-nowrap filter-button ${
                                        selectedFilter === filter.id 
                                            ? 'font-medium' 
                                            : 'hover:opacity-70'
                                    }`}
                                    style={{
                                        color: selectedFilter === filter.id 
                                            ? 'white' 
                                            : 'var(--text-secondary)',
                                        minWidth: 'fit-content',
                                        maxWidth: device.isMobile ? '100px' : 'none',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                    title={filter.label}
                                >
                                    {filter.label}
                                </button>
                            ))}
                            </div>
                        </div>
                        <style jsx>{`
                            div::-webkit-scrollbar {
                                display: none;
                            }
                            
                            .filter-button {
                                position: relative;
                                overflow: visible;
                            }
                        `}</style>
                    </div>

                {/* Sort Options */}
                <div 
                    className={`border-b ${device.isMobile ? 'px-4 py-2' : 'px-6 py-3'}`}
                    style={{ borderColor: 'var(--border-primary)' }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {t('sortBy')}
                        </span>
                        <div className="flex gap-1">
                            {sortOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSortClick(option.id)}
                                    className={`px-2 py-1 text-xs transition-all duration-200 whitespace-nowrap flex items-center gap-1 ${
                                        sortBy === option.id 
                                            ? 'font-medium' 
                                            : 'hover:opacity-70'
                                    }`}
                                    style={{
                                        color: sortBy === option.id 
                                            ? 'white' 
                                            : 'var(--text-secondary)'
                                    }}
                                >
                                    {sortBy === option.id && (
                                        <span 
                                            className="sort-arrow"
                                            style={{ 
                                                fontSize: '12px',
                                                transform: `rotate(${arrowRotation[option.id] || 0}deg)`,
                                                transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                                display: 'inline-block',
                                                transformOrigin: 'center'
                                            }}
                                        >
                                            ↓
                                        </span>
                                    )}
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className={`flex-1 overflow-y-auto ${device.isMobile ? 'p-4' : 'p-6'}`}>
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckSquare 
                                    size={48} 
                                    className="mx-auto mb-4 opacity-50"
                                    style={{ color: 'var(--text-secondary)' }}
                                />
                                <p 
                                    className="text-lg mb-2"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {t('noUpcomingTasks')}
                                </p>
                                <p 
                                    className="text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {selectedFilter === 'today' && t('noTasksToday')}
                                    {selectedFilter === 'tomorrow' && t('noTasksTomorrow')}
                                    {selectedFilter === 'thisWeek' && t('noTasksThisWeek')}
                                    {selectedFilter === 'thisMonth' && t('noTasksThisMonth')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTasks.map((task, index) => {
                                    // Calculate priority info like TaskList
                                    const priorityInfo = (() => {
                                        const slug = (task.priority || 'medium').toLowerCase();
                                        switch (slug) {
                                            case 'top':
                                            case 'high':
                                                return { color: '#ef4444', label: t('high') };
                                            case 'low':
                                                return { color: '#22c55e', label: t('low') };
                                            default:
                                                return { color: '#facc15', label: t('medium') };
                                        }
                                    })();

                                    // Format meta parts like TaskList
                                    const metaParts = [];
                                    if (task.date) metaParts.push(formatDate(task.date));
                                    if (task.isFullDay) metaParts.push(t('allDayLabel'));
                                    else if (task.time) metaParts.push(task.time);

                                    const isExpanded = expandedTasks.has(task.id);
                                    

                                    
                                    return (
                                        <div
                                            key={task.id}
                                            className="p-4 rounded shadow-sm border"
                                            style={{ 
                                                backgroundColor: 'var(--bg-secondary)',
                                                borderColor: 'var(--border-primary)'
                                            }}
                                        >
                                            <div className="flex flex-col gap-3">
                                                {/* Mobile layout - controls and task info */}
                                                <div className="min-[600px]:hidden">
                                                    {/* Controls */}
                                                    <div className="flex items-center justify-end mb-2">
                                                        <button
                                                            onClick={() => toggleTaskExpansion(task.id)}
                                                            className="p-2 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                                            title={isExpanded ? t('hideDetails') : t('showDetails')}
                                                            style={{ color: 'var(--text-secondary)' }}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Task info */}
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            <span className="font-semibold">{index + 1}</span>
                                                            <span
                                                                className="inline-block w-2.5 h-2.5 rounded-full"
                                                                style={{ backgroundColor: priorityInfo.color }}
                                                            />
                                                            <span className="font-medium capitalize break-words" style={{ color: 'var(--text-primary)' }}>
                                                                {task.text || task.name || '—'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                            {metaParts.length > 0 ? metaParts.join(' · ') : '\u00A0'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Desktop layout - single row */}
                                                <div className="hidden min-[600px]:flex items-center gap-3 min-w-0">
                                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                        {index + 1}
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
                                                            {task.text || task.name || '—'}
                                                        </span>
                                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                            {metaParts.length > 0 ? metaParts.join(' · ') : '\u00A0'}
                                                        </span>
                                                    </div>

                                                    {/* Desktop Eye button */}
                                                    <button
                                                        onClick={() => toggleTaskExpansion(task.id)}
                                                        className="p-2 rounded hover:bg-white/10 transition-colors cursor-pointer"
                                                        title={isExpanded ? t('hideDetails') : t('showDetails')}
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>

                                                {/* Expanded details section */}
                                                {isExpanded && (
                                                    <div
                                                        className="mt-4 pt-4 space-y-3 text-sm"
                                                        style={{ borderTop: '1px solid var(--border-primary)' }}
                                                    >


                                                        {/* Description */}
                                                        <div>
                                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {t('details')}:
                                                            </span>
                                                            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                                {task.description || 'Aucune description'}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Tags */}
                                                        <div>
                                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                Tags:
                                                            </span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {task.tags ? (
                                                                    String(task.tags).split(',').map((tag, tagIndex) => (
                                                                        <span
                                                                            key={tagIndex}
                                                                            className="px-2 py-1 rounded-full text-xs"
                                                                            style={{ 
                                                                                backgroundColor: 'var(--bg-tertiary)',
                                                                                color: 'var(--text-secondary)'
                                                                            }}
                                                                        >
                                                                            {tag.trim()}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                                        Aucun tag
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Priority details */}
                                                        <div>
                                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {t('priority')}:
                                                            </span>
                                                            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                                                                {priorityInfo.label}
                                                            </span>
                                                        </div>

                                                        {/* Date and time */}
                                                        <div>
                                                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                Date:
                                                            </span>
                                                            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
                                                                {task.date} {task.time && `à ${task.time}`}
                                                                {task.isFullDay && ' (Toute la journée)'}
                                                            </span>
                                                        </div>


                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                {/* Footer */}
                <div 
                    className={`border-t ${device.isMobile ? 'p-4' : 'p-6'}`}
                    style={{ borderColor: 'var(--border-primary)' }}
                >
                    <span 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {filteredTasks.length} {filteredTasks.length === 1 ? t('task') : t('tasks')}
                    </span>
                </div>
            </div>
        </>
    );
};

export default UpcomingTasksDrawer;