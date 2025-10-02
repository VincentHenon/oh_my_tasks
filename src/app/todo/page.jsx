'use client';                     // ⚠️ obligatoire si on utilise useState
import React, { useState } from 'react'
import { Plus } from 'lucide-react';
import TaskList from '../../components/TaskList';
import ThemeToggle from '../../components/ThemeToggle';
import VoiceInput from '../../components/VoiceInput';
import LanguageToggle from '../../components/LanguageToggle';
import CrossIcon from '../../components/CrossIcon';
import UserProfile from '../../components/UserProfile';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TodoPage() {
    const { t } = useLanguage();
    const [taskName, setTaskName] = useState("");
    const [taskDetails, setTaskDetails] = useState("");
    const [taskDate, setTaskDate] = useState("");
    const [taskTime, setTaskTime] = useState("");
    const [isFullDay, setIsFullDay] = useState(false);
    const [tasks, setTasks] = useState([]);
    // Split tasks into active and completed
    const completedTasks = tasks.filter((task) => task.completed);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleNameChange = (e) => {
        setTaskName(e.target.value);
    };

    const handleDetailsChange = (e) => {
        setTaskDetails(e.target.value);
    };

    const handleDateChange = (e) => {
        setTaskDate(e.target.value);
    };

    const handleTimeChange = (e) => {
        setTaskTime(e.target.value);
    };

    const handleFullDayChange = (e) => {
        setIsFullDay(e.target.checked);
        if (e.target.checked) {
            setTaskTime(""); // Clear time when full day is selected
        }
    };

    const addTask = () => {
        if (taskName.trim() !== '') {
            const newTask = {
                id: Date.now(), // Simple ID generation
                name: taskName.trim(),
                details: taskDetails.trim(),
                date: taskDate.trim() || null, // Allow empty date
                time: isFullDay ? null : taskTime,
                isFullDay: isFullDay,
                createdAt: new Date(),
                completed: false
            };
            setTasks([...tasks, newTask]);
            // Clear the form
            setTaskName('');
            setTaskDetails('');
            setTaskDate('');
            setTaskTime('');
            setIsFullDay(false);
            // Hide the form after adding
            setShowAddForm(false);
        }
    };

    const toggleAddForm = () => {
        setShowAddForm(!showAddForm);
        // Clear form when closing
        if (showAddForm) {
            setTaskName('');
            setTaskDate('');
            setTaskTime('');
            setIsFullDay(false);
        }
    };

    const deleteTask = (index) => {
        const newTasksList = tasks.filter((task, i) => {
            return i !== index;
        });
        setTasks(newTasksList);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    };

    // Handle parsed task from VoiceInput component
    const handleVoiceTaskParsed = (parsedTask) => {
        setTaskName(parsedTask.name);
        setTaskDate(parsedTask.date);
        if (parsedTask.time) {
            setTaskTime(parsedTask.time);
            setIsFullDay(false);
        }
        // Show the form if it's not already visible
        if (!showAddForm) {
            setShowAddForm(true);
        }
    };



    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {/* Fixed header with controls */}
            <div className="fixed top-0 left-0 right-0 z-10 p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="flex justify-between items-center w-full">
                    {/* Language à gauche */}
                    <LanguageToggle />
                    {/* User Profile à droite */}
                    <UserProfile tasks={tasks} />
                </div>
            </div>
            
            <main className="pt-20 p-8">
                <h1 className="text-4xl font-light mb-8 lowercase tracking-wider" style={{ color: 'var(--text-primary)' }}>oh my tasks</h1>

            {/* Task Creation Form - Only show when toggled */}
            {showAddForm && (
                <div className="mb-6 p-4 rounded-lg w-full max-w-[800px] relative" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                    {/* Close button in top right corner */}
                    <CrossIcon
                        className="absolute top-3 right-3 hover:text-red-500 transition-colors duration-300"
                        style={{ color: 'var(--text-secondary)' }}
                        strokeWidth={1} 
                        absoluteStrokeWidth
                        size={20}
                        onClick={toggleAddForm}
                    />
                    
                    <h2 className="text-lg font-semibold mb-4 pr-8" style={{ color: 'var(--text-primary)' }}>{t('addNewTask')}</h2>
                    

                    
                    {/* Task Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            {t('taskNameRequired')}
                        </label>
                        <input
                            type="text"
                            placeholder={t('taskNamePlaceholder')}
                            value={taskName}
                            onChange={handleNameChange}
                            onKeyDown={handleKeyDown}
                            className="w-full rounded p-3 transition-colors"
                            style={{ 
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)'
                            }}
                        />
                    </div>

                    {/* Task Details */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                            {t('details')}
                        </label>
                        <textarea
                            placeholder={t('detailsPlaceholder')}
                            value={taskDetails}
                            onChange={handleDetailsChange}
                            rows={3}
                            className="w-full rounded p-3 transition-colors resize-vertical"
                            style={{ 
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)'
                            }}
                        />
                    </div>

                    {/* Date and Time Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                {t('date')}
                            </label>
                            <input
                                type="date"
                                value={taskDate && taskDate !== "0000-00-00" ? taskDate : ""}
                                onChange={handleDateChange}
                                className="w-full rounded p-3 transition-colors"
                                style={{ 
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)'
                                }}
                            />
                        </div>

                        {/* Time */}
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                {t('time')}
                            </label>
                            <input
                                type="time"
                                value={taskTime}
                                onChange={handleTimeChange}
                                disabled={isFullDay}
                                className="w-full rounded p-3 transition-colors"
                                style={{ 
                                    backgroundColor: isFullDay ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                                    color: isFullDay ? 'var(--text-secondary)' : 'var(--text-primary)',
                                    border: '1px solid var(--border-primary)',
                                    opacity: isFullDay ? 0.5 : 1
                                }}
                            />
                        </div>
                    </div>

                    {/* Full Day Checkbox */}
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="fullDay"
                            checked={isFullDay}
                            onChange={handleFullDayChange}
                            className="mr-2"
                            style={{ accentColor: 'var(--accent)' }}
                        />
                        <label htmlFor="fullDay" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {t('fullDay')}
                        </label>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={addTask}
                        disabled={!taskName.trim()}
                        className="w-full p-3 rounded font-medium transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                        style={{
                            backgroundColor: '#4a5568',
                            color: 'white'
                        }}
                    >
                        <Plus className="inline mr-2" size={20} />
                        {t('addTask')}
                    </button>
                </div>
            )}

            {/* Affichage de la liste des tâches avec drag and drop */}
            <TaskList 
                tasks={tasks} 
                setTasks={setTasks} 
                onDeleteTask={deleteTask} 
            />

            {/* Task History for completed tasks */}
            <TaskHistory tasks={completedTasks} />

            {/* Action Buttons - Add Task and Voice Input */}
            <div className="mt-6 w-full max-w-[800px] flex items-center gap-3">
                <button
                    onClick={toggleAddForm}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80"
                    style={{
                        backgroundColor: '#4a5568',
                        color: 'white'
                    }}
                >
                    <Plus size={20} />
                    <span className="hidden min-[600px]:inline">{t('addTaskManually')}</span>
                </button>
                
                <VoiceInput onTaskParsed={handleVoiceTaskParsed} />
            </div>

                <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
                    <strong>{t('tips')}</strong> {t('tipsText')}
                </p>
                
                <ThemeToggle />
            </main>
        </div>
    );
}
