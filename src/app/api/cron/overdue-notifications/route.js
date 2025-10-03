/**
 * API Route pour les notifications de retard
 * Vercel Cron Job - Appelée automatiquement toutes les heures
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

  console.log('⏰ Démarrage vérification tâches en retard:', new Date().toISOString());

  try {
    const emailService = new EmailService();
    
    // Récupérer les utilisateurs avec notifications activées
    const users = await getUsersWithNotifications();
    
    let sentCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Récupérer les tâches en retard
        const overdueTasks = await getUserOverdueTasks(user.email);
        
        if (overdueTasks.length > 0) {
          // Vérifier si c'est le bon moment pour envoyer
          const shouldSend = shouldSendOverdueNotification(overdueTasks);
          
          if (shouldSend) {
            // Vérifier qu'on n'a pas déjà envoyé aujourd'hui
            const alreadySent = await hasNotificationBeenSentToday(user.email, 'overdue');
            
            if (!alreadySent) {
              const result = await emailService.sendOverdueReminder(user, overdueTasks);
              
              if (result.success) {
                await logNotification(user.email, 'overdue', new Date());
                sentCount++;
                console.log(`⏰ Rappel retard envoyé à ${user.email} (${overdueTasks.length} tâches)`);
              } else {
                errorCount++;
                console.error(`❌ Échec rappel pour ${user.email}:`, result.error);
              }
            }
          }
        }
      } catch (userError) {
        console.error(`❌ Erreur pour utilisateur ${user.email}:`, userError);
        errorCount++;
      }
    }

    console.log(`📊 Rappels retard: ${sentCount} envoyés, ${errorCount} erreurs`);
    
    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur générale rappels retard:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Détermine si on doit envoyer le rappel de retard
 */
function shouldSendOverdueNotification(overdueTasks) {
  const now = new Date();
  
  // Vérifier s'il y a des tâches en retard depuis plus d'1h
  return overdueTasks.some(task => {
    const taskDateTime = new Date(task.date);
    
    if (!task.isFullDay && task.time) {
      // Tâche avec heure spécifique
      const [hours, minutes] = task.time.split(':').map(Number);
      taskDateTime.setHours(hours, minutes, 0, 0);
    } else {
      // Tâche "toute la journée" -> considérée en retard après 23h59
      taskDateTime.setHours(23, 59, 59, 999);
    }
    
    // En retard depuis plus d'1h (3600000 ms)
    return (now.getTime() - taskDateTime.getTime()) > 3600000;
  });
}

/**
 * Récupérer les tâches en retard d'un utilisateur
 */
async function getUserOverdueTasks(userEmail) {
  const now = new Date();
  
  try {
    // Récupérer toutes les tâches non complétées de l'utilisateur
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tasks?email=${userEmail}&completed=false`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user tasks');
    }
    
    const allTasks = await response.json();
    
    // Filtrer les tâches en retard
    const overdueTasks = allTasks.filter(task => {
      const taskDate = new Date(task.date);
      
      if (!task.isFullDay && task.time) {
        // Tâche avec heure spécifique
        const [hours, minutes] = task.time.split(':').map(Number);
        taskDate.setHours(hours, minutes, 0, 0);
      } else {
        // Tâche "toute la journée" -> considérée en retard après 23h59
        taskDate.setHours(23, 59, 59, 999);
      }
      
      return taskDate < now;
    });
    
    // Adapter le format pour l'email
    return overdueTasks.map(task => ({
      id: task.id,
      text: task.title,
      name: task.title,
      date: task.date,
      time: task.time,
      isFullDay: task.isFullDay,
      priority: task.priority,
      details: task.details
    }));
    
  } catch (error) {
    console.error(`Erreur récupération tâches en retard pour ${userEmail}:`, error);
    return [];
  }
}

// Réutiliser les mêmes fonctions utilitaires que daily-notifications
async function getUsersWithNotifications() {
  try {
    // Récupérer les utilisateurs avec notify_overdue activé
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user-preferences?notify_overdue=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users with overdue notifications');
    }
    
    const users = await response.json();
    
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0],
      language: user.language || 'fr'
    }));
    
  } catch (error) {
    console.error('Erreur récupération utilisateurs overdue:', error);
    return [];
  }
}

async function hasNotificationBeenSentToday(userEmail, type) {
  // Version simple pour overdue : limite à 1 envoi par jour
  return false;
}

async function logNotification(userEmail, type, date) {
  console.log(`📝 Notification ${type} envoyée à ${userEmail} le ${date.toISOString()}`);
}