import { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckSquare, Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const UpcomingTasksModal = ({ isOpen, onClose, tasks = [] }) => {
    const { t } = useLanguage();
    const [selectedFilter, setSelectedFilter] = useState('today');
    const [filteredTasks, setFilteredTasks] = useState([]);

    const filters = [
        { id: 'today', label: t('today'), days: 0 },
        { id: 'next3days', label: t('next3Days'), days: 3 },
        { id: 'nextWeek', label: t('nextWeek'), days: 7 }
    ];

    useEffect(() => {
        if (!tasks.length) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let endDate = new Date(today);
        
        if (selectedFilter === 'today') {
            endDate.setDate(today.getDate() + 1);
        } else if (selectedFilter === 'next3days') {
            endDate.setDate(today.getDate() + 3);
        } else if (selectedFilter === 'nextWeek') {
            endDate.setDate(today.getDate() + 7);
        }

        const filtered = tasks.filter(task => {
            if (!task.dueDate) return false;
            
            const taskDate = new Date(task.dueDate);
            const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            
            return taskDateOnly >= today && taskDateOnly < endDate;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        setFilteredTasks(filtered);
    }, [tasks, selectedFilter]);

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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div 
                className="w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                {/* Header */}
                <div 
                    className="flex justify-between items-center p-6 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <div className="flex items-center gap-3">
                        <CheckSquare size={24} style={{ color: 'var(--text-secondary)' }} />
                        <h2 
                            className="text-xl font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
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
                    className="p-6 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
                        <span 
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {t('filterBy')}
                        </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {filters.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setSelectedFilter(filter.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedFilter === filter.id 
                                        ? 'text-white' 
                                        : 'hover:opacity-70'
                                }`}
                                style={{
                                    backgroundColor: selectedFilter === filter.id 
                                        ? 'var(--accent-color)' 
                                        : 'var(--bg-secondary)',
                                    color: selectedFilter === filter.id 
                                        ? 'white' 
                                        : 'var(--text-primary)'
                                }}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto max-h-96 p-6">
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
                                {selectedFilter === 'next3days' && t('noTasksNext3Days')}
                                {selectedFilter === 'nextWeek' && t('noTasksNextWeek')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    className="p-4 rounded-lg border transition-colors"
                                    style={{ 
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-color)'
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 
                                                    className="font-medium"
                                                    style={{ color: 'var(--text-primary)' }}
                                                >
                                                    {task.text}
                                                </h3>
                                                {task.priority && (
                                                    <span 
                                                        className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                                                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                                    >
                                                        {t(task.priority)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        {formatDate(task.dueDate)}
                                                    </span>
                                                </div>
                                                
                                                {task.dueTime && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            {task.dueTime}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {task.description && (
                                                <p 
                                                    className="text-sm mt-2"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div 
                    className="p-6 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <div className="flex justify-between items-center">
                        <span 
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {filteredTasks.length} {filteredTasks.length === 1 ? t('task') : t('tasks')}
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg transition-colors hover:opacity-80"
                            style={{ 
                                backgroundColor: 'var(--accent-color)',
                                color: 'white'
                            }}
                        >
                            {t('close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpcomingTasksModal;