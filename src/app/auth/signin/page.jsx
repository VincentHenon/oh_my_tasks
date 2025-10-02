'use client';

import { signIn, getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function SignInPage() {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Vérifier si l'utilisateur est déjà connecté
        getSession().then((session) => {
            if (session) {
                router.push('/todo');
            }
        });
    }, [router]);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const result = await signIn('google', {
                callbackUrl: '/todo',
                redirect: false,
            });
            
            if (result?.error) {
                console.error('Erreur de connexion:', result.error);
            } else if (result?.url) {
                router.push(result.url);
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-light mb-2 lowercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        oh my tasks
                    </h1>
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                        {t('welcomeMessage')}
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                        <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
                            {t('signIn')}
                        </h2>
                        
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                            style={{ 
                                backgroundColor: '#ffffff',
                                color: '#374151',
                                border: '1px solid #d1d5db'
                            }}
                        >
                            {/* Google Icon SVG */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span className="font-medium">
                                {isLoading ? t('connecting') : t('signInWithGoogle')}
                            </span>
                        </button>

                        <div className="mt-6 text-center">
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {t('signInDescription')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={() => router.push('/todo')}
                        className="text-sm hover:opacity-80 transition-colors duration-200"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('continueWithoutSignIn')}
                    </button>
                </div>
            </div>
        </div>
    );
}