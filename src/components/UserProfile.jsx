import { User, Settings, LogOut, Mail, Phone, Clock, LogIn, Calendar, CheckSquare } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import CrossIcon from './CrossIcon';
import TaskHistory from './TaskHistory';
import SettingsModal from './SettingsModal';
import ContactModal from './ContactModal';
import CalendarModal from './CalendarModal';
import UpcomingTasksDrawer from './UpcomingTasksDrawer';

const styles = `
.profile-button-line {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0px;
    height: 3px;
    background-color: var(--text-secondary);
    border-radius: 9999px;
    transform: translateX(-50%);
    transition: width 0.3s ease-out;
}

.profile-button:hover .profile-button-line {
    width: 60%;
}
`;

export const UserProfile = ({ tasks = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showUpcomingTasks, setShowUpcomingTasks] = useState(false);
    const [settingsData, setSettingsData] = useState(null);
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();
    const device = useDeviceDetection();

    const completedTasks = useMemo(
        () => tasks.filter((task) => task?.completed),
        [tasks]
    );

    // Preload settings data when UserProfile opens
    useEffect(() => {
        const loadSettingsData = async () => {
            if (status === 'authenticated' && isOpen && !settingsData) {
                try {
                    // Try to load from localStorage first
                    const cachedSettings = localStorage.getItem('userSettings');
                    if (cachedSettings) {
                        setSettingsData(JSON.parse(cachedSettings));
                    }

                    // Always fetch fresh data from API
                    const res = await fetch('/api/settings', { cache: 'no-store' });
                    if (res.ok) {
                        const data = await res.json();
                        const loadedSettings = {
                            language: typeof data.language === 'string' ? data.language : 'en',
                            notifyUpcoming: Boolean(data.notifyUpcoming),
                            notifyOverdue: Boolean(data.notifyOverdue),
                        };
                        setSettingsData(loadedSettings);
                        // Cache in localStorage
                        localStorage.setItem('userSettings', JSON.stringify(loadedSettings));
                    }
                } catch (error) {
                    console.error('[UserProfile] Failed to preload settings:', error);
                }
            }
        };

        loadSettingsData();
    }, [status, isOpen, settingsData]);

    const toggleProfile = () => setIsOpen(true);
    const closeProfile = () => {
        setIsOpen(false);
        // Also close any open child drawers
        setShowHistory(false);
        setShowSettings(false);
        setShowContact(false);
        setShowCalendar(false);
    };
    
    const openHistory = () => {
        setShowHistory(true);
        // Keep profile open - history drawer will slide over it
    };
    
    const closeHistory = () => setShowHistory(false);
    
    const openSettings = () => {
        setShowSettings(true);
        // Keep profile open - settings drawer will slide over it
    };
    
    const closeSettings = () => {
        setShowSettings(false);
        // Profile remains open when closing settings
    };
    
    const openContact = () => {
        setShowContact(true);
        // Keep profile open - contact drawer will slide over it
    };
    
    const closeContact = () => {
        setShowContact(false);
        // Profile remains open when closing contact
    };
    
    const openCalendar = () => {
        setShowCalendar(true);
        // Keep profile open - calendar drawer will slide over it
    };
    
    const closeCalendar = () => {
        setShowCalendar(false);
        // Profile remains open when closing calendar
    };

    const openUpcomingTasks = () => {
        setShowUpcomingTasks(true);
        // Keep profile open - upcoming tasks drawer will slide over it
    };

    const closeUpcomingTasks = () => {
        setShowUpcomingTasks(false);
        // Profile remains open when closing upcoming tasks
    };

    const handleLogout = () => {
        signOut({ callbackUrl: '/signin' });
    };

    const handleSignInClick = () => {
        router.push('/signin');
    };



    // Si l'utilisateur n'est pas connecté, afficher le bouton de connexion
    if (!session) {
        return (
            <button
                onClick={handleSignInClick}
                className="p-2 rounded-lg transition-colors duration-300 hover:opacity-70"
                style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                }}
                title={t('signIn')}
            >
                <LogIn size={20} />
            </button>
        );
    }

    return (
        <>
            <style>{styles}</style>
            {/* Profile Button */}
            <button
                onClick={toggleProfile}
                className="p-2 rounded-lg transition-colors duration-300 hover:opacity-70"
                style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                }}
                title={t('profile')}
            >
                <User size={20} />
            </button>

            {/* Backdrop - Always rendered for smooth animation */}
            <div 
                className="fixed inset-0 z-[9998]"
                style={{ 
                    backgroundColor: `rgba(0, 0, 0, ${isOpen ? 0.5 : 0})`,
                    transition: 'background-color 0.6s ease-in-out',
                    pointerEvents: isOpen ? 'auto' : 'none',
                    willChange: 'background-color'
                }}
                onClick={isOpen ? closeProfile : undefined}
            />

            {/* Sidebar - Always rendered for animation */}
            <div 
                className={`fixed top-0 h-full z-[9999]`}
                style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    right: '0px',
                    width: device.isMobile ? '100vw' : '640px',
                    transform: isOpen ? 'translateX(0px)' : `translateX(${device.isMobile ? '100vw' : '640px'})`,
                    transition: 'transform 0.6s ease-in-out, box-shadow 0.6s ease-in-out',
                    willChange: 'transform',
                    boxShadow: isOpen ? '-8px 0 32px rgba(0, 0, 0, 0.15)' : 'none'
                }}
            >
                {/* Header */}
                <div className={`flex items-center justify-between border-b ${device.isMobile ? 'p-4' : 'p-6'}`} style={{ borderColor: 'var(--border-primary)' }}>
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {t('profile')}
                    </h2>
                    <CrossIcon
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={closeProfile}
                        size={28}
                    />
                </div>

                {/* Profile Content */}
                <div className={device.isMobile ? 'p-4' : 'p-6'}>
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-6">
                        {session?.user?.image ? (
                            <img 
                                src={session.user.image} 
                                alt={session.user.name || 'User'}
                                className="w-20 h-20 rounded-full mb-3 object-cover"
                            />
                        ) : (
                            <div 
                                className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <User size={32} style={{ color: 'var(--text-secondary)' }} />
                            </div>
                        )}
                        <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                            {session?.user?.name || 'User'}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {session?.user?.email || 'No email'}
                        </p>
                        {status === 'loading' && (
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {t('loading')}...
                            </p>
                        )}
                    </div>

                    {/* Profile Options */}
                    <div className={device.isMobile ? "space-y-2" : "grid grid-cols-3 gap-3"}>
                        {/* 1. Upcoming Tasks */}
                        <button 
                            onClick={openUpcomingTasks}
                            className={`profile-button w-full flex items-center gap-3 rounded-lg transition-colors cursor-pointer relative ${device.isMobile ? 'p-3' : 'p-4 flex-col text-center min-h-[80px] justify-center'}`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <CheckSquare size={device.isMobile ? 18 : 24} style={{ color: 'var(--text-secondary)' }} />
                            <span className={device.isMobile ? '' : 'text-sm mt-2'}>{t('upcomingTasks')}</span>
                            <div className="profile-button-line"></div>
                        </button>

                        {/* 2. Calendar */}
                        <button 
                            onClick={openCalendar}
                            className={`profile-button w-full flex items-center gap-3 rounded-lg transition-colors cursor-pointer relative ${device.isMobile ? 'p-3' : 'p-4 flex-col text-center min-h-[80px] justify-center'}`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Calendar size={device.isMobile ? 18 : 24} style={{ color: 'var(--text-secondary)' }} />
                            <span className={device.isMobile ? '' : 'text-sm mt-2'}>{t('calendar')}</span>
                            <div className="profile-button-line"></div>
                        </button>

                        {/* 3. History */}
                        <button 
                            onClick={openHistory}
                            className={`profile-button w-full flex items-center gap-3 rounded-lg transition-colors cursor-pointer relative ${device.isMobile ? 'p-3' : 'p-4 flex-col text-center min-h-[80px] justify-center'}`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Clock size={device.isMobile ? 18 : 24} style={{ color: 'var(--text-secondary)' }} />
                            <span className={device.isMobile ? '' : 'text-sm mt-2'}>{t('taskHistory')}</span>
                            <div className="profile-button-line"></div>
                        </button>

                        {/* 4. Contact */}
                        <button 
                            onClick={openContact}
                            className={`profile-button w-full flex items-center gap-3 rounded-lg transition-colors cursor-pointer relative ${device.isMobile ? 'p-3' : 'p-4 flex-col text-center min-h-[80px] justify-center'}`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Mail size={device.isMobile ? 18 : 24} style={{ color: 'var(--text-secondary)' }} />
                            <span className={device.isMobile ? '' : 'text-sm mt-2'}>{t('contact')}</span>
                            <div className="profile-button-line"></div>
                        </button>

                        {/* 5. Settings */}
                        <button 
                            className={`profile-button w-full flex items-center gap-3 rounded-lg transition-colors cursor-pointer relative ${device.isMobile ? 'p-3' : 'p-4 flex-col text-center min-h-[80px] justify-center'}`}
                            style={{ color: 'var(--text-primary)' }}
                            onClick={openSettings}
                        >
                            <Settings size={device.isMobile ? 18 : 24} style={{ color: 'var(--text-secondary)' }} />
                            <span className={device.isMobile ? '' : 'text-sm mt-2'}>{t('settings')}</span>
                            <div className="profile-button-line"></div>
                        </button>

                        {/* 6. Support */}
                        <button 
                            className={`profile-button w-full flex items-center gap-3 rounded-lg transition-colors cursor-pointer relative ${device.isMobile ? 'p-3' : 'p-4 flex-col text-center min-h-[80px] justify-center'}`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Phone size={device.isMobile ? 18 : 24} style={{ color: 'var(--text-secondary)' }} />
                            <span className={device.isMobile ? '' : 'text-sm mt-2'}>{t('support')}</span>
                            <div className="profile-button-line"></div>
                        </button>

                    </div>
                    
                    <hr className="my-4" style={{ borderColor: 'var(--border-primary)' }} />

                    <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 cursor-pointer ${device.isMobile ? '' : 'justify-center'}`}
                    >
                        <LogOut size={device.isMobile ? 18 : 20} />
                        <span>{t('logout')}</span>
                    </button>
                </div>
            </div>

            {/* Task History Modal */}
            <TaskHistory tasks={completedTasks} isOpen={showHistory} onClose={closeHistory} isLoading={false} />
            
            {/* Calendar Modal */}
            <CalendarModal tasks={tasks} isOpen={showCalendar} onClose={closeCalendar} />
            
            {/* Settings Modal */}
            <SettingsModal 
                isOpen={showSettings} 
                onClose={closeSettings} 
                preloadedData={settingsData}
                onSettingsUpdate={(newSettings) => {
                    setSettingsData(newSettings);
                    localStorage.setItem('userSettings', JSON.stringify(newSettings));
                }}
            />
            
            {/* Contact Modal */}
            <ContactModal isOpen={showContact} onClose={closeContact} />
            
            {/* Upcoming Tasks Drawer */}
            <UpcomingTasksDrawer 
                isOpen={showUpcomingTasks} 
                onClose={closeUpcomingTasks}
                tasks={tasks}
            />
        </>
    );
};

export default UserProfile;