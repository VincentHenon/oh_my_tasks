'use client';                     // ⚠️ obligatoire si on utilise useState
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import TaskList from '../../components/TaskList';
import ThemeToggle from '../../components/ThemeToggle';
import VoiceInput from '../../components/VoiceInput';
import LanguageToggle from '../../components/LanguageToggle';
import CrossIcon from '../../components/CrossIcon';
import UserProfile from '../../components/UserProfile';
import TaskHistory from '../../components/TaskHistory';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TodoPage() {
    const { t } = useLanguage();
    const { data: session } = useSession();
    
    // Form states for task creation
    const [taskName, setTaskName] = useState("");
    const [taskDetails, setTaskDetails] = useState("");
    const [taskDate, setTaskDate] = useState("");
    const [taskTime, setTaskTime] = useState("");
    const [isFullDay, setIsFullDay] = useState(false);
    
    // Main tasks state - this will hold data from the API
    const [tasks, setTasks] = useState([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [apiError, setApiError] = useState(null);
    
    // UI states
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Split tasks into active and completed for display
    const activeTasks = tasks.filter((task) => !task.completed);
    const completedTasks = tasks.filter((task) => task.completed);

    // Fetch tasks from API when component mounts or user changes
    useEffect(() => {
        const fetchTasksFromApi = async () => {
            // Only fetch if user is logged in and has an email
            if (!session?.user?.email) {
                console.log('No user email available, skipping task fetch');
                return;
            }

            setIsLoadingTasks(true);
            setApiError(null);

            try {
                console.log('Fetching tasks for user:', session.user.email);
                
                const apiUrl = `${process.env.NEXT_PUBLIC_TASKS_API_ENDPOINT}?email=${encodeURIComponent(session.user.email)}`;
                console.log('API URL:', apiUrl);

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.NEXT_PUBLIC_TASKS_API_KEY,
                    },
                });

                console.log('API Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const responseData = await response.json();
                console.log('API Response data:', responseData);

                // Handle the response structure from your PHP API
                if (responseData.success && Array.isArray(responseData.tasks)) {
                    console.log('Setting tasks:', responseData.tasks);
                    setTasks(responseData.tasks);
                } else {
                    console.warn('Unexpected API response structure:', responseData);
                    setTasks([]);
                }

            } catch (error) {
                console.error('Error fetching tasks from API:', error);
                setApiError(error.message);
                // Keep existing tasks on error, don't reset to empty array
            } finally {
                setIsLoadingTasks(false);
            }
        };

        fetchTasksFromApi();
    }, [session?.user?.email]); // Re-fetch when user email changes

    // Function to create a new task via API
    const createTaskInApi = async (taskData) => {
        if (!session?.user?.email) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(process.env.NEXT_PUBLIC_TASKS_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_TASKS_API_KEY,
            },
            body: JSON.stringify({
                ...taskData,
                email: session.user.email,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        
        if (!responseData.success) {
            throw new Error(responseData.error || 'Failed to create task');
        }

        return responseData.task;
    };

    // Function to update a task via API
    const updateTaskInApi = async (taskId, updates) => {
        if (!session?.user?.email) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_TASKS_API_ENDPOINT}?id=${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_TASKS_API_KEY,
            },
            body: JSON.stringify({
                ...updates,
                email: session.user.email,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        
        if (!responseData.success) {
            throw new Error(responseData.error || 'Failed to update task');
        }

        return responseData.task;
    };

    // Function to delete a task via API
    const deleteTaskFromApi = async (taskId) => {
        if (!session?.user?.email) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_TASKS_API_ENDPOINT}?id=${taskId}&email=${encodeURIComponent(session.user.email)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_TASKS_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        
        if (!responseData.success) {
            throw new Error(responseData.error || 'Failed to delete task');
        }

        return true;
    };

    // Event handlers for form inputs
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

    // Add task function - now integrates with API
    const addTask = async () => {
        if (taskName.trim() === '') {
            return;
        }

        // Prepare task data for API
        const newTaskData = {
            name: taskName.trim(),
            title: taskName.trim(), // Your API expects 'title' field
            details: taskDetails.trim(),
            date: taskDate.trim() || null,
            time: isFullDay ? null : taskTime,
            isFullDay: isFullDay,
            completed: false,
        };

        try {
            console.log('Creating new task:', newTaskData);
            
            // Create task via API
            const createdTask = await createTaskInApi(newTaskData);
            console.log('Task created successfully:', createdTask);

            // Add the new task to local state
            setTasks(prevTasks => [createdTask, ...prevTasks]);

            // Clear the form
            clearTaskForm();
            
            // Hide the form after adding
            setShowAddForm(false);

        } catch (error) {
            console.error('Error creating task:', error);
            setApiError(`Failed to create task: ${error.message}`);
            
            // Optionally, still add to local state as fallback
            const fallbackTask = {
                id: Date.now(), // Temporary ID for local state
                ...newTaskData,
                createdAt: new Date(),
            };
            
            setTasks(prevTasks => [fallbackTask, ...prevTasks]);
            clearTaskForm();
            setShowAddForm(false);
        }
    };

    // Helper function to clear the task form
    const clearTaskForm = () => {
        setTaskName('');
        setTaskDetails('');
        setTaskDate('');
        setTaskTime('');
        setIsFullDay(false);
    };

    // Toggle add form visibility
    const toggleAddForm = () => {
        setShowAddForm(!showAddForm);
        // Clear form when closing
        if (showAddForm) {
            clearTaskForm();
        }
    };

    // Delete task function - now integrates with API
    const deleteTask = async (taskIndex) => {
        const taskToDelete = tasks[taskIndex];
        
        if (!taskToDelete) {
            console.error('Task not found at index:', taskIndex);
            return;
        }

        try {
            console.log('Deleting task:', taskToDelete.id);
            
            // Delete from API first
            await deleteTaskFromApi(taskToDelete.id);
            console.log('Task deleted successfully from API');

            // Remove from local state
            const newTasksList = tasks.filter((task, i) => i !== taskIndex);
            setTasks(newTasksList);

        } catch (error) {
            console.error('Error deleting task:', error);
            setApiError(`Failed to delete task: ${error.message}`);
            
            // Optionally, still remove from local state as fallback
            const newTasksList = tasks.filter((task, i) => i !== taskIndex);
            setTasks(newTasksList);
        }
    };

    // Function to toggle task completion status
    const toggleTaskCompletion = async (taskIndex) => {
        const taskToUpdate = tasks[taskIndex];
        
        if (!taskToUpdate) {
            console.error('Task not found at index:', taskIndex);
            return;
        }

        const updatedCompletionStatus = !taskToUpdate.completed;

        try {
            console.log('Updating task completion:', taskToUpdate.id, 'to', updatedCompletionStatus);
            
            // Update via API
            const updatedTask = await updateTaskInApi(taskToUpdate.id, {
                completed: updatedCompletionStatus
            });
            
            console.log('Task updated successfully:', updatedTask);

            // Update local state
            const updatedTasks = tasks.map((task, i) => 
                i === taskIndex 
                    ? { ...task, completed: updatedCompletionStatus }
                    : task
            );
            setTasks(updatedTasks);

        } catch (error) {
            console.error('Error updating task:', error);
            setApiError(`Failed to update task: ${error.message}`);
            
            // Fallback: update local state anyway
            const updatedTasks = tasks.map((task, i) => 
                i === taskIndex 
                    ? { ...task, completed: updatedCompletionStatus }
                    : task
            );
            setTasks(updatedTasks);
        }
    };

    // Handle Enter key press in form inputs
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
                    {/* User Profile à droite - pass tasks and completedTasks as props */}
                    <UserProfile tasks={tasks} completedTasks={completedTasks} />
                </div>
            </div>
            
            <main className="pt-20 p-8">
                <h1 className="text-4xl font-light mb-8 lowercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    oh my tasks
                </h1>

                {/* Display API error if there is one */}
                {apiError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700">
                        <strong>API Error:</strong> {apiError}
                        <button 
                            onClick={() => setApiError(null)}
                            className="ml-2 text-red-500 hover:text-red-700"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Loading indicator */}
                {isLoadingTasks && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-100 border border-blue-300 text-blue-700">
                        Loading tasks...
                    </div>
                )}

                {/* Display authentication status */}
                {!session?.user?.email && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-700">
                        Please sign in to view and manage your tasks.
                    </div>
                )}

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
                        
                        <h2 className="text-lg font-semibold mb-4 pr-8" style={{ color: 'var(--text-primary)' }}>
                            {t('addNewTask')}
                        </h2>
                        
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

                {/* Display task list with API-fetched data */}
                <TaskList 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    onDeleteTask={deleteTask}
                    onToggleComplete={toggleTaskCompletion}
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