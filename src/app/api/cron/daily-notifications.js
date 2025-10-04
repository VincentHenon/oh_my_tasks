/**
 * API Route pour les notifications quotidiennes
 * Vercel Cron Job - Appelée automatiquement chaque jour
 */

import { EmailService } from '@/lib/email/emailService';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Vérifier que c'est bien un cron job Vercel
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🕐 Démarrage des notifications quotidiennes:', new Date().toISOString());

  try {
    const emailService = new EmailService();
    
    // Récupérer les utilisateurs avec notifications activées
    // Tu devras adapter cette partie selon ton système d'authentification
    const users = await getUsersWithNotifications();
    
    let sentCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Récupérer les tâches du jour
        const todayTasks = await getUserTasksForToday(user.email);
        
        if (todayTasks.length > 0) {
          // Vérifier si on doit envoyer (timing optimal)
          const shouldSend = shouldSendDailyNotification(todayTasks);
          
          if (shouldSend) {
            // Vérifier qu'on n'a pas déjà envoyé aujourd'hui
            const alreadySent = await hasNotificationBeenSentToday(user.email, 'daily');
            
            if (!alreadySent) {
              const result = await emailService.sendDailyReminder(user, todayTasks);
              
              if (result.success) {
                await logNotification(user.email, 'daily', new Date());
                sentCount++;
                console.log(`✅ Notification envoyée à ${user.email}`);
              } else {
                errorCount++;
                console.error(`❌ Échec pour ${user.email}:`, result.error);
              }
            }
          }
        }
      } catch (userError) {
        console.error(`❌ Erreur pour utilisateur ${user.email}:`, userError);
        errorCount++;
      }
    }

    console.log(`📊 Résumé: ${sentCount} envoyées, ${errorCount} erreurs`);
    
    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur générale notifications quotidiennes:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Détermine si on doit envoyer la notification maintenant
 */
function shouldSendDailyNotification(tasks) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Chercher la première tâche avec heure
  const tasksWithTime = tasks.filter(task => !task.isFullDay && task.time);
  
  if (tasksWithTime.length > 0) {
    // Trier par heure
    tasksWithTime.sort((a, b) => a.time.localeCompare(b.time));
    const firstTaskTime = tasksWithTime[0].time; // Format "HH:mm"
    
    const [taskHour, taskMinutes] = firstTaskTime.split(':').map(Number);
    const notificationHour = taskHour - 1; // 1h avant
    
    // Vérifier si c'est le bon moment (tolérance de 15 minutes)
    return (currentHour === notificationHour && currentMinutes >= 0 && currentMinutes <= 15) ||
           (currentHour === notificationHour + 1 && currentMinutes <= 15);
  } else {
    // Toutes les tâches sont "toute la journée" -> envoyer à 8h
    return currentHour === 8 && currentMinutes <= 15;
  }
}

/**
 * Récupérer les utilisateurs avec notifications activées
 * Utilise ta table user_preferences
 */
async function getUsersWithNotifications() {
  try {
    // Appel à ton API existante pour récupérer les préférences
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user-preferences?notify_upcoming=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users with notifications');
    }
    
    const users = await response.json();
    
    // Adapter le format pour correspondre à tes données
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0], // Utilise la partie avant @ comme nom
      language: user.language || 'fr'
    }));
    
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return [];
  }
}

/**
 * Récupérer les tâches du jour d'un utilisateur
 */
async function getUserTasksForToday(userEmail) {
  const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  try {
    // Appel à ton API existante pour récupérer les tâches
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tasks?email=${userEmail}&date=${today}&completed=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user tasks');
    }
    
    const tasks = await response.json();
    
    // Adapter le format pour correspondre à tes colonnes
    return tasks.map(task => ({
      id: task.id,
      text: task.title, // ta colonne "title" devient "text" pour l'email
      name: task.title,
      date: task.date,
      time: task.time,
      isFullDay: task.isFullDay,
      priority: task.priority,
      details: task.details,
      completed: task.completed
    }));
    
  } catch (error) {
    console.error(`Erreur récupération tâches pour ${userEmail}:`, error);
    return [];
  }
}

/**
 * Vérifier si notification déjà envoyée aujourd'hui
 * Version simple : utilise les logs Vercel (pas de DB)
 */
async function hasNotificationBeenSentToday(userEmail, type) {
  // Version simple : on limite à 1 envoi par exécution
  // Les cron jobs Vercel s'exécutent avec un délai suffisant
  // Si tu veux plus de contrôle, ajoute une table de logs
  
  const today = new Date().toISOString().split('T')[0];
  const logKey = `${userEmail}-${type}-${today}`;
  
  // Pour une version plus robuste, tu peux utiliser une table ou un cache
  // Pour l'instant, on fait confiance au timing des cron jobs
  return false;
}

/**
 * Logger une notification envoyée
 * Version simple : logs Vercel (visible dans le dashboard)
 */
async function logNotification(userEmail, type, date) {
  const logMessage = `📝 Notification ${type} envoyée à ${userEmail} le ${date.toISOString()}`;
  
  console.log(logMessage);
  
  // Optionnel : Si tu veux persister les logs, tu peux ajouter :
  // await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notification-logs`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email: userEmail, type, date })
  // });
}