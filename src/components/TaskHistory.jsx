import { Clock, CheckCircle, Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import CrossIcon from './CrossIcon';

// Mock data for completed tasks
const mockTaskHistory = [
    {
        id: 1,
        text: "Complete project proposal for Q4",
        completedAt: "2024-09-28T14:30:00Z",
        category: "Work",
        priority: "high"
    },
    {
        id: 2,
        text: "Buy groceries for the weekend",
        completedAt: "2024-09-27T10:15:00Z",
        category: "Personal",
        priority: "medium"
    },
    {
        id: 3,
        text: "Call dentist to schedule appointment",
        completedAt: "2024-09-26T16:45:00Z",
        category: "Health",
        priority: "high"
    },
    {
        id: 4,
        text: "Review team performance reports",
        completedAt: "2024-09-25T11:20:00Z",
        category: "Work",
        priority: "medium"
    },
    {
        id: 5,
        text: "Update resume and LinkedIn profile",
        completedAt: "2024-09-24T13:00:00Z",
        category: "Career",
        priority: "medium"
    },
    {
        id: 6,
        text: "Plan birthday party for mom",
        completedAt: "2024-09-23T19:30:00Z",
        category: "Personal",
        priority: "high"
    },
    {
        id: 7,
        text: "Fix leaking kitchen faucet",
        completedAt: "2024-09-22T15:45:00Z",
        category: "Home",
        priority: "high"
    },
    {
        id: 8,
        text: "Read chapter 5-8 of business book",
        completedAt: "2024-09-21T21:15:00Z",
        category: "Learning",
        priority: "low"
    },
    {
        id: 9,
        text: "Organize digital photos from vacation",
        completedAt: "2024-09-20T14:00:00Z",
        category: "Personal",
        priority: "low"
    },
    {
        id: 10,
        text: "Submit monthly expense report",
        completedAt: "2024-09-19T09:30:00Z",
        category: "Work",
        priority: "high"
    }
];

const normalizeHistoryTasks = (tasks) =>
    tasks.map((task, index) => {
        const primaryTag = task.tags ? String(task.tags).split(',')[0]?.trim() : '';
        const category = (task.category || primaryTag || 'General').toLowerCase();

        const derivedDate = (() => {
            if (task.completedAt) return task.completedAt;
            if (task.date) {
                return task.time ? `${task.date}T${task.time}` : task.date;
            }
            if (task.createdAt) return task.createdAt;
            return null;
        })();

        return {
            id: task.id ?? index,
            text: task.text ?? task.name ?? task.details ?? '—',
            completedAt: derivedDate,
            category,
            priority: (task.priority || 'medium').toLowerCase(),
        };
    });

export const TaskHistory = ({ tasks = [], isOpen = false, onClose = () => {} }) => {
    const { t } = useLanguage();
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444'; // red
            case 'medium': return '#f59e0b'; // amber
            case 'low': return '#10b981'; // emerald
            default: return 'var(--text-secondary)';
        }
    };

    // Get category icon
    const getCategoryIcon = (category) => {
        switch (category.toLowerCase()) {
            case 'work': return '💼';
            case 'personal': return '👤';
            case 'health': return '🏥';
            case 'home': return '🏠';
            case 'career': return '📈';
            case 'learning': return '📚';
            default: return '📋';
        }
    };

    const normalizedTasks = useMemo(() => {
        if (Array.isArray(tasks)) {
            return normalizeHistoryTasks(tasks);
        }
        return normalizeHistoryTasks(mockTaskHistory);
    }, [tasks]);

    // Filter tasks by category
    const filteredTasks = selectedFilter === 'all'
        ? normalizedTasks
        : normalizedTasks.filter((task) => task.category === selectedFilter);

    const categories = useMemo(() => (
        ['all', ...new Set(normalizedTasks.map((task) => task.category))]
    ), [normalizedTasks]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-[9998]"
                style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    transition: 'background-color 0.6s ease-in-out'
                }}
                onClick={onClose}
            />

            {/* History Sidebar */}
            <div 
                className="fixed top-0 right-0 h-full w-96 z-[9999] shadow-2xl"
                style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    transform: 'translateX(0px)',
                    transition: 'transform 0.6s ease-in-out'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="flex items-center gap-2">
                        <Clock size={24} style={{ color: 'var(--text-primary)' }} />
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {t('taskHistory')}
                        </h2>
                    </div>
                    <CrossIcon
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                        size={28}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedFilter(category)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    selectedFilter === category 
                                        ? 'bg-blue-500 text-white' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                style={{ 
                                    backgroundColor: selectedFilter === category ? '#3b82f6' : 'var(--bg-tertiary)',
                                    color: selectedFilter === category ? 'white' : 'var(--text-secondary)'
                                }}
                            >
                                {category === 'all' ? t('all') : category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-3">
                        {filteredTasks.map((task) => (
                            <div 
                                key={task.id}
                                className="p-4 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                style={{ 
                                    backgroundColor: 'var(--bg-primary)',
                                    borderColor: 'var(--border-primary)'
                                }}
                            >
                                {/* Task Header */}
                                <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {getCategoryIcon(task.category)} {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                                    </span>
                                    </div>
                                    <div 
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                                        title={`${task.priority} priority`}
                                    />
                                </div>

                                {/* Task Text */}
                                <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                                    {task.text}
                                </p>

                                {/* Completion Date */}
                                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <Calendar size={12} />
                                    <span>{t('completed')} {formatDate(task.completedAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredTasks.length === 0 && (
                        <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                            <Clock size={48} className="mx-auto mb-4 opacity-50" />
                            <p>{t('noCompletedTasks')}</p>
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="border-t p-4" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="text-center">
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {t('totalCompletedTasks')}: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {normalizedTasks.length}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TaskHistory;
