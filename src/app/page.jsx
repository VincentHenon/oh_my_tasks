'use client';                     // ⚠️ obligatoire si on utilise useState
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import TaskList from '../components/TaskList';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';
import DashboardHeader from '../components/DashboardHeader';
import TaskForm from '../components/TaskForm';
import TaskActionBar from '../components/TaskActionBar';

const TASKS_API_ENDPOINT = process.env.NEXT_PUBLIC_TASKS_API_ENDPOINT ?? '/api/tasks';
const TASKS_API_KEY = process.env.NEXT_PUBLIC_TASKS_API_KEY ?? '';

const buildUrl = (queryString = '') => (
    queryString ? `${TASKS_API_ENDPOINT}?${queryString}` : TASKS_API_ENDPOINT
);

const defaultFetchOptions = {
    headers: {
        'Content-Type': 'application/json',
        ...(TASKS_API_KEY ? { 'X-API-KEY': TASKS_API_KEY } : {}),
    },
};

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

    const loadTasksFromAPI = async () => {
        if (status !== 'authenticated' || !session?.user?.email) {
            setTasks([]);
            return;
        }

        try {
            const query = new URLSearchParams({ email: session.user.email });
            const res = await fetch(buildUrl(query.toString()), {
                ...defaultFetchOptions,
                cache: 'no-store',
            });
            if (!res.ok) throw new Error('Erreur API');
            const data = await res.json();

            if (!Array.isArray(data)) {
                setTasks([]);
                return;
            }

            setTasks(data.map(task => ({
                id: task.id,
                name: task.title,
                details: task.details || '',
                date: task.date || '',
                time: task.time || '',
                isFullDay: task.isFullDay === 1 || task.isFullDay === true,
                isUrgent: task.urgent === 1 || task.urgent === true,
                completed: task.completed === 1 || task.completed === true,
                createdAt: task.created_at || '',
                tags: task.tags || '',
                priority: task.priority || 'medium',
            })));
        } catch (error) {
            console.error('Erreur lors du chargement des tâches:', error);
            setTasks([]);
        }
    };

    const addTaskToAPI = async (newTask) => {
        if (status !== 'authenticated' || !session?.user?.email) return;
        try {
            const res = await fetch(buildUrl(), {
                method: 'POST',
                ...defaultFetchOptions,
                body: JSON.stringify({
                    name: newTask.name,
                    details: newTask.details,
                    date: newTask.date,
                    time: newTask.time,
                    isFullDay: newTask.isFullDay,
                    isUrgent: newTask.isUrgent,
                    completed: newTask.completed ?? false,
                    tags: newTask.tags ?? '',
                    priority: newTask.priority ?? 'medium',
                    email: session.user.email,
                })
            });
            if (!res.ok) throw new Error('Erreur API');
            await loadTasksFromAPI();
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la tâche:', error);
        }
    };

    const updateTaskInAPI = async (taskId, updatedFields) => {
        if (status !== 'authenticated' || !session?.user?.email) return;

        const body = {};

        if (updatedFields.name !== undefined) {
            body.title = updatedFields.name;
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
            body.isFullDay = updatedFields.isFullDay ? 1 : 0;
        }
        if (updatedFields.isUrgent !== undefined) {
            body.urgent = updatedFields.isUrgent ? 1 : 0;
        }
        if (updatedFields.completed !== undefined) {
            body.completed = updatedFields.completed ? 1 : 0;
        }
        if (updatedFields.tags !== undefined) {
            body.tags = updatedFields.tags;
        }
        if (updatedFields.priority !== undefined) {
            body.priority = updatedFields.priority;
        }

        body.email = session.user.email;

        try {
            const res = await fetch(buildUrl(new URLSearchParams({ id: String(taskId) }).toString()), {
                method: 'PUT',
                ...defaultFetchOptions,
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Erreur API');
            await loadTasksFromAPI();
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la tâche:', error);
        }
    };

    const deleteTaskFromAPI = async (taskId) => {
        if (status !== 'authenticated' || !session?.user?.email) return;
        try {
            const query = new URLSearchParams({ id: String(taskId), email: session.user.email });
            const res = await fetch(buildUrl(query.toString()), {
                method: 'DELETE',
                ...defaultFetchOptions,
            });
            if (!res.ok) throw new Error('Erreur API');
            await loadTasksFromAPI();
        } catch (error) {
            console.error('Erreur lors de la suppression de la tâche:', error);
        }
    };

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            loadTasksFromAPI();
        }

        if (status === 'unauthenticated') {
            setTasks([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, session?.user?.email]);

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
