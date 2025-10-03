/**
 * Service d'envoi d'emails pour OhMyTasks
 * Utilise Nodemailer pour l'envoi via SMTP
 */

import nodemailer from 'nodemailer';

export class EmailService {
  constructor() {
    // Configuration SMTP pour ton domaine
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.ohmytasks.vincenthenon.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER || 'notifications@ohmytasks.vincenthenon.com',
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Envoie un email de résumé quotidien
   */
  async sendDailyReminder(user, tasks) {
    const subject = "📋 Vos tâches du jour - OhMyTasks";
    const html = this.buildDailyReminderTemplate(user, tasks);
    
    return await this.sendEmail(user.email, user.name, subject, html);
  }

  /**
   * Envoie un rappel pour tâches en retard
   */
  async sendOverdueReminder(user, tasks) {
    const subject = "⏰ Tâches en retard - OhMyTasks";
    const html = this.buildOverdueReminderTemplate(user, tasks);
    
    return await this.sendEmail(user.email, user.name, subject, html);
  }

  /**
   * Template HTML pour notifications quotidiennes
   */
  buildDailyReminderTemplate(user, tasks) {
    const taskCount = tasks.length;
    const date = new Date().toLocaleDateString('fr-FR');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #4f46e5, #7c3aed);
                color: white; 
                padding: 30px 20px; 
                text-align: center;
            }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; }
            .header p { margin: 0; opacity: 0.9; }
            .content { 
                padding: 30px 20px; 
            }
            .task { 
                background: #f9fafb; 
                margin: 15px 0; 
                padding: 20px; 
                border-radius: 8px; 
                border-left: 4px solid #4f46e5;
                transition: transform 0.2s;
            }
            .task:hover { transform: translateX(2px); }
            .priority-high { border-left-color: #ef4444; background: #fef2f2; }
            .priority-medium { border-left-color: #facc15; background: #fffbeb; }
            .priority-low { border-left-color: #22c55e; background: #f0fdf4; }
            .task-time { 
                color: #6b7280; 
                font-size: 14px; 
                margin-top: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .task-name { 
                font-weight: 600; 
                font-size: 16px; 
                margin-bottom: 5px;
            }
            .footer { 
                background: #374151; 
                color: #d1d5db; 
                padding: 20px; 
                text-align: center;
                font-size: 14px;
            }
            .footer a { 
                color: #60a5fa; 
                text-decoration: none;
                font-weight: 500;
            }
            .stats { 
                background: #f0f9ff; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0;
                text-align: center;
                border: 1px solid #e0f2fe;
            }
            @media (max-width: 600px) {
                body { padding: 10px; }
                .header, .content { padding: 20px 15px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌅 Bonjour ${user.name} !</h1>
                <p>Voici vos tâches prévues pour aujourd'hui (${date})</p>
            </div>
            <div class="content">
                <div class="stats">
                    <h2 style="margin: 0 0 10px 0; color: #1e40af;">
                        📋 ${taskCount} tâche${taskCount > 1 ? 's' : ''} au programme
                    </h2>
                    <p style="margin: 0; color: #64748b;">
                        C'est parti pour une journée productive ! 🚀
                    </p>
                </div>
                
                ${tasks.map((task, index) => {
                  const priority = (task.priority || 'medium').toLowerCase();
                  const priorityClass = priority === 'high' || priority === 'top' ? 'priority-high' : 
                                      priority === 'low' ? 'priority-low' : 'priority-medium';
                  
                  const timeInfo = task.isFullDay ? 
                    '<span class="task-time">📅 Toute la journée</span>' :
                    task.time ? `<span class="task-time">🕐 ${task.time}</span>` : '';
                  
                  return `
                    <div class="task ${priorityClass}">
                        <div class="task-name">${index + 1}. ${task.text || task.name}</div>
                        ${timeInfo}
                    </div>
                  `;
                }).join('')}
                
                <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px; border-left: 4px solid #22c55e;">
                    <p style="margin: 0; color: #166534;">
                        💡 <strong>Conseil du jour :</strong> Commencez par votre première tâche pour créer une dynamique positive !
                    </p>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 0 0 10px 0;">
                    OhMyTasks - Votre assistant personnel de productivité
                </p>
                <a href="https://ohmytasks.vincenthenon.com">📱 Ouvrir l'application</a>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Template HTML pour rappels de retard
   */
  buildOverdueReminderTemplate(user, tasks) {
    const taskCount = tasks.length;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 20px;
                background-color: #fef2f2;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                color: white; 
                padding: 30px 20px; 
                text-align: center;
            }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; }
            .content { padding: 30px 20px; }
            .task { 
                background: #fef2f2; 
                margin: 15px 0; 
                padding: 20px; 
                border-radius: 8px; 
                border-left: 4px solid #dc2626;
            }
            .task-time { 
                color: #6b7280; 
                font-size: 14px; 
                margin-top: 8px;
            }
            .footer { 
                background: #374151; 
                color: #d1d5db; 
                padding: 20px; 
                text-align: center;
                font-size: 14px;
            }
            .footer a { color: #60a5fa; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Rappel important !</h1>
                <p>Vous avez ${taskCount} tâche${taskCount > 1 ? 's' : ''} en retard</p>
            </div>
            <div class="content">
                <h2 style="color: #dc2626;">📋 Tâches à rattraper</h2>
                
                ${tasks.map((task, index) => {
                  const taskDate = new Date(task.date).toLocaleDateString('fr-FR');
                  const timeInfo = task.isFullDay ? 
                    `📅 ${taskDate} (Toute la journée)` :
                    task.time ? `🕐 ${taskDate} à ${task.time}` : `📅 ${taskDate}`;
                  
                  return `
                    <div class="task">
                        <strong>${index + 1}. ${task.text || task.name}</strong><br>
                        <span class="task-time">${timeInfo}</span>
                    </div>
                  `;
                }).join('')}
                
                <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;">
                        💪 <strong>Pas de panique !</strong> Il n'est jamais trop tard pour rattraper le retard. 
                        Chaque petite action compte !
                    </p>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 0 0 10px 0;">
                    OhMyTasks - Votre assistant personnel de productivité
                </p>
                <a href="https://ohmytasks.vincenthenon.com">📱 Rattraper maintenant</a>
            </div>
        </div>
    </body>
  </html>`;
  }

  /**
   * Envoie un email
   */
  async sendEmail(toEmail, toName, subject, html) {
    try {
      const mailOptions = {
        from: `"OhMyTasks" <${process.env.SMTP_USER}>`,
        to: toName ? `"${toName}" <${toEmail}>` : toEmail,
        subject,
        html,
        text: this.htmlToText(html) // Version texte automatique
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convertit HTML en texte simple (fallback)
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // Supprime les tags HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}