'use client';                     // ⚠️ obligatoire si on utilise useState
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import TaskList from '../components/TaskList';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';
import DashboardHeader from '../components/DashboardHeader';
import TaskForm from '../components/TaskForm';
import TaskActionBar from '../components/TaskActionBar';
import { fetchTasks as fetchRemoteTasks, createTask as createRemoteTask, updateTask as updateRemoteTask, deleteTask as deleteRemoteTask } from '../lib/tasksClient';

export default function HomePage() {
    const { t } = useLanguage();
    const { data: session, status } = useSession();
    const [taskName, setTaskName] = useState('');
    const [taskDetails, setTaskDetails] = useState('');
    const [taskDate, setTaskDate] = useState('');
    const [taskTime, setTaskTime] = useState('');
    const [isFullDay, setIsFullDay] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [taskTags, setTaskTags] = useState('');
    const [taskPriority, setTaskPriority] = useState('medium');
    const [isTagHintVisible, setIsTagHintVisible] = useState(false);

    const resetForm = () => {
        setTaskName('');
        setTaskDetails('');
        setTaskDate('');
        setTaskTime('');
        setIsFullDay(false);
        setIsUrgent(false);
        setFormMode('add');
        setEditingTaskId(null);
        setTaskTags('');
        setTaskPriority('medium');
        setIsTagHintVisible(false);
    };

    const loadTasksFromAPI = useCallback(async ({ useCache = true } = {}) => {
        if (status !== 'authenticated' || !session?.user?.email) {
            setTasks([]);
            return;
        }

        try {
            const { tasks: fetchedTasks, source } = await fetchRemoteTasks({
                email: session.user.email,
                cache: useCache,
            });

            console.log('[HomePage] tasks fetched from', source);
            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Erreur lors du chargement des tâches:', error);
            setTasks([]);
        }
    }, [session?.user?.email, status]);

    const addTaskToAPI = async (newTask) => {
        if (status !== 'authenticated' || !session?.user?.email) return;
        try {
            const createdTask = await createRemoteTask({
                email: session.user.email,
                task: {
                    name: newTask.name,
                    details: newTask.details,
                    date: newTask.date,
                    time: newTask.time,
                    isFullDay: newTask.isFullDay,
                    isUrgent: newTask.isUrgent,
                    completed: newTask.completed ?? false,
                    tags: newTask.tags ?? '',
                    priority: newTask.priority ?? 'medium',
                },
            });

            setTasks((prev) => [createdTask, ...prev]);
            await loadTasksFromAPI({ useCache: false });
        } catch (error) {
            console.error('Erreur lors de l'ajout de la tâche:', error);
        }
    };

    const updateTaskInAPI = async (taskId, updatedFields) => {
        if (status !== 'authenticated' || !session?.user?.email) return;

        const body = {};

        if (updatedFields.name !== undefined) {
            body.name = updatedFields.name;
        }
        if (updatedFields.details !== undefined) {
            body.details = updatedFields.details;
        }
        if (updatedFields.date !== undefined) {
            body.date = updatedFields.date;
        }
        if (updatedFields.time !== undefined) {
            body.time = updatedFields.time;
        }
        if (updatedFields.isFullDay !== undefined) {
            body.isFullDay = updatedFields.isFullDay;
        }
        if (updatedFields.isUrgent !== undefined) {
            body.isUrgent = updatedFields.isUrgent;
        }
        if (updatedFields.completed !== undefined) {
            body.completed = updatedFields.completed;
        }
        if (updatedFields.tags !== undefined) {
            body.tags = updatedFields.tags;
        }
        if (updatedFields.priority !== undefined) {
            body.priority = updatedFields.priority;
        }

        try {
            const updatedTask = await updateRemoteTask({
                email: session.user.email,
                id: taskId,
                updates: body,
            });

            setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
            await loadTasksFromAPI({ useCache: false });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la tâche:', error);
        }
    };

    const deleteTaskFromAPI = async (taskId) => {
        if (status !== 'authenticated' || !session?.user?.email) return;
        try {
            await deleteRemoteTask({
                email: session.user.email,
                id: String(taskId),
            });
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
            await loadTasksFromAPI({ useCache: false });
        } catch (error) {
            console.error('Erreur lors de la suppression de la tâche:', error);
        }
    };

    useEffect(() => {
        loadTasksFromAPI({ useCache: true });

        if (status === 'unauthenticated') {
            setTasks([]);
        }
    }, [status, session?.user?.email, loadTasksFromAPI]);

    const updateTasks = (newTasks) => {
        setTasks(newTasks);
    };

    const handleNameChange = (e) => setTaskName(e.target.value);
    const handleDetailsChange = (e) => setTaskDetails(e.target.value);
    const handleTagsChange = (e) => setTaskTags(e.target.value);
    const handleToggleTagHint = () => setIsTagHintVisible((prev) => !prev);
    const handlePriorityChange = (e) => setTaskPriority(e.target.value);
    const handleDateChange = (e) => setTaskDate(e.target.value);
    const handleTimeChange = (e) => setTaskTime(e.target.value);

    const openNativePicker = (event) => {
        const target = event?.target;
        if (!target || target.disabled || typeof target.showPicker !== 'function') {
            return;
        }

        if (event.type === 'keydown') {
            const validKeys = ['Enter', ' ', 'Spacebar', 'Space'];
            if (!validKeys.includes(event.key)) {
                return;
            }
        }

        event.preventDefault();
        target.showPicker();
    };

    const handleFullDayChange = (e) => {
        const checked = e.target.checked;
        setIsFullDay(checked);
        if (checked) {
            setTaskTime('');
        }
    };

    const saveTask = async () => {
        if (taskName.trim() === '') {
            return;
        }

        const payload = {
            name: taskName.trim(),
            details: taskDetails.trim(),
            date: taskDate.trim() || '',
            time: isFullDay ? '' : taskTime,
            isFullDay,
            isUrgent,
            tags: taskTags.trim(),
            priority: taskPriority,
        };

        if (formMode === 'edit' && editingTaskId) {
            await updateTaskInAPI(editingTaskId, payload);
        } else {
            await addTaskToAPI(payload);
        }

        resetForm();
        setShowAddForm(false);
    };

    const toggleAddForm = () => {
        const next = !showAddForm;
        setShowAddForm(next);
        if (!next) {
            resetForm();
        } else {
            setFormMode('add');
            setEditingTaskId(null);
        }
    };

    const deleteTask = async (index) => {
        const taskToDelete = tasks[index];
        if (taskToDelete && taskToDelete.id) {
            await deleteTaskFromAPI(taskToDelete.id);
            if (taskToDelete.id === editingTaskId) {
                resetForm();
                setShowAddForm(false);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveTask();
        }
    };

    const handleToggleCompleted = async (task, index, checked) => {
        if (!task?.id) return;

        setTasks(prev => {
            const updated = [...prev];
            if (updated[index]) {
                updated[index] = { ...updated[index], completed: checked };
            }
            return updated;
        });

        await updateTaskInAPI(task.id, { completed: checked });
    };

    const handleEditTask = (task) => {
        if (!task) return;
        setTaskName(task.name || '');
        setTaskDetails(task.details || '');
        setTaskDate(task.date || '');
        if (task.isFullDay) {
            setIsFullDay(true);
            setTaskTime('');
        } else {
            setIsFullDay(false);
            setTaskTime(task.time || '');
        }
        setIsUrgent(!!task.isUrgent);
        setTaskTags(task.tags || '');
        setTaskPriority(task.priority || 'medium');
        setFormMode('edit');
        setEditingTaskId(task.id);
        setShowAddForm(true);
    };

    const handleVoiceTaskParsed = (parsedTask) => {
        if (!parsedTask) return;

        setTaskName(parsedTask.name || '');
        setTaskDetails(parsedTask.details || '');
        setTaskDate(parsedTask.date || '');

        if (parsedTask.isFullDay) {
            setIsFullDay(true);
            setTaskTime('');
        } else {
            setIsFullDay(false);
            setTaskTime(parsedTask.time || '');
        }

        setIsUrgent(!!parsedTask.isUrgent);
        setFormMode('add');
        setEditingTaskId(null);
        setTaskTags(parsedTask.tags || '');
        setTaskPriority(parsedTask.priority || 'medium');

        if (!showAddForm) {
            setShowAddForm(true);
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <DashboardHeader tasks={tasks} />
            
            <main className="pt-20 p-8">
                <h1 className="text-4xl font-light mb-8 lowercase tracking-wider" style={{ color: 'var(--text-primary)' }}>oh my tasks</h1>

                <TaskForm
                    visible={showAddForm}
                    t={t}
                    formMode={formMode}
                    taskName={taskName}
                    taskDetails={taskDetails}
                    taskTags={taskTags}
                    taskPriority={taskPriority}
                    taskDate={taskDate}
                    taskTime={taskTime}
                    isFullDay={isFullDay}
                    isTagHintVisible={isTagHintVisible}
                    onNameChange={handleNameChange}
                    onDetailsChange={handleDetailsChange}
                    onTagsChange={handleTagsChange}
                    onPriorityChange={handlePriorityChange}
                    onDateChange={handleDateChange}
                    onTimeChange={handleTimeChange}
                    onFullDayChange={handleFullDayChange}
                    onToggleTagHint={handleToggleTagHint}
                    onClose={toggleAddForm}
                    onSubmit={saveTask}
                    onKeyDown={handleKeyDown}
                    openNativePicker={openNativePicker}
                />

                <TaskList 
                    tasks={tasks} 
                    setTasks={updateTasks} 
                    onDeleteTask={deleteTask}
                    onToggleCompleted={handleToggleCompleted}
                    onEditTask={handleEditTask}
                />

                {!showAddForm && (
                    <TaskActionBar
                        t={t}
                        onAddClick={toggleAddForm}
                        onVoiceTask={handleVoiceTaskParsed}
                    />
                )}

                <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
                    <strong>{t('tips')}</strong> {t('tipsText')}
                </p>
                
                <ThemeToggle />
            </main>
        </div>
    );
}
