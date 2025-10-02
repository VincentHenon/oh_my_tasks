import { User, Settings, LogOut, Mail, Phone, Clock, LogIn } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import CrossIcon from './CrossIcon';
import TaskHistory from './TaskHistory';

export const UserProfile = ({ tasks = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const { data: session, status } = useSession();
    const router = useRouter();
    const { t } = useLanguage();

    const completedTasks = useMemo(
        () => tasks.filter((task) => task?.completed),
        [tasks]
    );

    const toggleProfile = () => setIsOpen(true);
    const closeProfile = () => setIsOpen(false);
    
    const openHistory = () => {
        setShowHistory(true);
        setIsOpen(false); // Close profile when opening history
    };
    
    const closeHistory = () => setShowHistory(false);

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
                className="fixed top-0 h-full w-80 z-[9999] shadow-2xl"
                style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    right: '0px',
                    transform: isOpen ? 'translateX(0px)' : 'translateX(320px)',
                    transition: 'transform 0.6s ease-in-out',
                    willChange: 'transform'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
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
                <div className="p-6">
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
                    <div className="space-y-2">
                        <button 
                            onClick={openHistory}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Clock size={18} style={{ color: 'var(--text-secondary)' }} />
                            <span>{t('taskHistory')}</span>
                        </button>

                        <button 
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
                            <span>{t('settings')}</span>
                        </button>

                        <button 
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                            <span>{t('contact')}</span>
                        </button>

                        <button 
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Phone size={18} style={{ color: 'var(--text-secondary)' }} />
                            <span>{t('support')}</span>
                        </button>

                        <hr className="my-4" style={{ borderColor: 'var(--border-primary)' }} />

                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                        >
                            <LogOut size={18} />
                            <span>{t('logout')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Task History Modal */}
            <TaskHistory tasks={completedTasks} isOpen={showHistory} onClose={closeHistory} />
        </>
    );
};

export default UserProfile;
