'use client';

import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const translations = {
    en: {
        // Page title and main elements
        todoList: 'oh my tasks',
        addTaskManually: 'Add Task Manually',
        addVocalTask: 'Add a vocal task',
        stop: 'Stop',
        
        // Form fields
        addNewTask: 'Add New Task',
        taskName: 'Task Name',
        taskNameRequired: 'Task Name *',
        details: 'Details',
        detailsPlaceholder: 'Add additional details (optional)...',
        taskNamePlaceholder: 'Enter task name or use voice input above...',
        date: 'Date',
        dateRequired: 'Date *',
        time: 'Time',
        fullDay: 'Full Day',
        noDate: 'No date',
        noTime: 'No time',
        addTask: 'Add Task',
        cancel: 'Cancel',
        confirmDeleteTitle: 'Delete task',
        confirmDeleteMessage: 'Are you sure you want to delete this task?',
        confirmDelete: 'Delete',
        
        // Voice input
        speakNow: 'Speak now...',
        processing: 'Processing...',
        clickToAddVoice: 'Click to add a task with your voice',
        clickToStop: 'Click to stop',
        addByVoice: 'Add by voice',
        
        // Tips and messages
        tips: '💡 Tips:',
        tipsText: 'Fill in task name (date and time optional). Drag and drop to reorder. Drag outside the list to delete.',
        
        // Language
        language: 'Language',
        english: 'English',
        french: 'Français',
        
        // Profile
        profile: 'Profile',
        settings: 'Settings',
        settingsTitle: 'Notification settings',
        settingsDescription: 'Manage your default language and reminders for upcoming tasks.',
        languageLabel: 'Default language',
        notificationPreferences: 'Notifications',
        notifyUpcoming: 'Notify me when a task is due soon',
        notifyUpcomingHelper: 'Receive an email reminder shortly before a task is due.',
        notifyOverdue: 'Notify me when a task is overdue',
        notifyOverdueHelper: 'Receive an email reminder when a due date has passed and the task is not completed.',
        saveChanges: 'Save changes',
        saving: 'Saving…',
        saved: 'Preferences updated',
        errorLoadingSettings: 'Unable to load your settings right now.',
        errorSavingSettings: 'Unable to save your settings. Please try again later.',
        contact: 'Contact',
        support: 'Support',
        logout: 'Logout'
    },
    fr: {
        // Page title and main elements
        todoList: 'oh mes tâches',
        addTaskManually: 'Ajouter manuellement',
        addVocalTask: 'Ajouter une tâche vocale',
        stop: 'Arrêter',
        
        // Form fields
        addNewTask: 'Ajouter une nouvelle tâche',
        taskName: 'Nom de la tâche',
        taskNameRequired: 'Nom de la tâche *',
        details: 'Détails',
        detailsPlaceholder: 'Ajouter des détails supplémentaires (optionnel)...',
        taskNamePlaceholder: 'Entrez le nom de la tâche ou utilisez la saisie vocale...',
        date: 'Date',
        dateRequired: 'Date *',
        time: 'Heure',
        fullDay: 'Journée complète',
        noDate: 'Aucune date',
        noTime: 'Aucune heure',
        addTask: 'Ajouter la tâche',
        cancel: 'Annuler',
        confirmDeleteTitle: 'Supprimer la tâche',
        confirmDeleteMessage: 'Êtes-vous sûr de vouloir supprimer cette tâche ?',
        confirmDelete: 'Supprimer',
        
        // Voice input
        speakNow: 'Parlez maintenant...',
        processing: 'Traitement...',
        clickToAddVoice: 'Cliquez pour ajouter une tâche avec votre voix',
        clickToStop: 'Cliquez pour arrêter',
        addByVoice: 'Ajouter par voix',
        
        // Tips and messages
        tips: '💡 Conseils :',
        tipsText: 'Remplissez le nom de la tâche (date et heure optionnelles). Glissez-déposez pour réorganiser. Glissez en dehors de la liste pour supprimer.',
        
        // Language
        language: 'Langue',
        english: 'English',
        french: 'Français',
        
        // Profile
        profile: 'Profil',
        settings: 'Paramètres',
        settingsTitle: 'Paramètres de notification',
        settingsDescription: 'Gérez votre langue par défaut ainsi que les rappels des tâches.',
        languageLabel: 'Langue par défaut',
        notificationPreferences: 'Notifications',
        notifyUpcoming: 'Me prévenir quand une tâche arrive à échéance',
        notifyUpcomingHelper: 'Recevoir un e-mail peu avant la date limite de la tâche.',
        notifyOverdue: 'Me prévenir quand une tâche est en retard',
        notifyOverdueHelper: 'Recevoir un e-mail lorsqu’une tâche non terminée dépasse sa date.',
        saveChanges: 'Enregistrer',
        saving: 'Enregistrement…',
        saved: 'Préférences mises à jour',
        errorLoadingSettings: 'Impossible de charger vos paramètres pour le moment.',
        errorSavingSettings: 'Impossible d’enregistrer vos paramètres. Réessayez plus tard.',
        contact: 'Contact',
        support: 'Support',
        logout: 'Déconnexion'
    }
};

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState('en');
    
    const t = (key) => {
        return translations[currentLanguage][key] || key;
    };
    
    const toggleLanguage = () => {
        setCurrentLanguage(prev => prev === 'en' ? 'fr' : 'en');
    };
    
    const getSpeechLang = () => {
        return currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    };
    
    return (
        <LanguageContext.Provider value={{
            currentLanguage,
            setCurrentLanguage,
            toggleLanguage,
            t,
            getSpeechLang
        }}>
            {children}
        </LanguageContext.Provider>
    );
};
