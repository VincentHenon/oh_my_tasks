'use client';

import React, { createContext, useContext, useState } from 'react';

const TaskContext = createContext();

export const useTask = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTask must be used within a TaskProvider');
    }
    return context;
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};

export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);

    const addTask = (newTask) => {
        setTasks(prevTasks => [...prevTasks, newTask]);
    };

    const updateTask = (taskId, updatedTask) => {
        setTasks(prevTasks => 
            prevTasks.map(task => 
                task.id === taskId ? { ...task, ...updatedTask } : task
            )
        );
    };

    const deleteTask = (taskId) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const reorderTasks = (newTasks) => {
        setTasks(newTasks);
    };

    const toggleTaskCompletion = (taskId) => {
        setTasks(prevTasks => 
            prevTasks.map(task => 
                task.id === taskId 
                    ? { ...task, completed: !task.completed }
                    : task
            )
        );
    };

    const value = {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        toggleTaskCompletion
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};