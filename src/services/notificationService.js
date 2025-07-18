import PushNotification from 'react-native-push-notification';
import { NOTIFICATION_TYPES } from '../constants';

export class NotificationService {
  constructor() {
    this.configure();
  }

  configure() {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        // Gérer les actions de notification
        notification.finish(PushNotification.FetchResult.NoData);
      },
      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);
      },
      onRegistrationError: function (err) {
        console.error(err.message, err);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Créer le canal de notification pour Android
    PushNotification.createChannel(
      {
        channelId: 'methode-j-channel',
        channelName: 'Méthode J Notifications',
        channelDescription: 'Notifications pour les révisions et rappels',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  scheduleDailyReminder(time = '07:30') {
    const [hours, minutes] = time.split(':');
    const reminderDate = new Date();
    reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Si l'heure est déjà passée aujourd'hui, programmer pour demain
    if (reminderDate.getTime() <= Date.now()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    PushNotification.localNotificationSchedule({
      id: 'daily-reminder',
      title: '📚 Méthode J - Révisions',
      message: 'Il est temps de faire vos révisions quotidiennes!',
      date: reminderDate,
      channelId: 'methode-j-channel',
      repeatType: 'day',
      actions: ['Voir', 'Plus tard'],
      category: 'DAILY_REMINDER',
      userInfo: {
        type: NOTIFICATION_TYPES.DAILY_REMINDER,
        action: 'open_app'
      }
    });

    console.log(`Daily reminder scheduled for ${time}`);
  }

  scheduleExamReminder(examDate, ueName, daysBefore = 7) {
    const exam = new Date(examDate);
    const reminderDate = new Date(exam);
    reminderDate.setDate(exam.getDate() - daysBefore);
    reminderDate.setHours(8, 0, 0, 0); // 8h00 du matin

    if (reminderDate.getTime() > Date.now()) {
      PushNotification.localNotificationSchedule({
        id: `exam-reminder-${ueName}-${daysBefore}`,
        title: `🎯 Examen approchant - ${ueName}`,
        message: `Votre examen de ${ueName} a lieu dans ${daysBefore} jour${daysBefore > 1 ? 's' : ''}!`,
        date: reminderDate,
        channelId: 'methode-j-channel',
        actions: ['Réviser', 'Voir planning'],
        category: 'EXAM_REMINDER',
        userInfo: {
          type: NOTIFICATION_TYPES.EXAM_APPROACHING,
          ue_name: ueName,
          exam_date: examDate,
          days_before: daysBefore
        }
      });

      console.log(`Exam reminder scheduled for ${ueName} - ${daysBefore} days before`);
    }
  }

  scheduleStreakMilestone(streakCount) {
    const milestones = [7, 30, 50, 100, 200, 365];
    
    if (milestones.includes(streakCount)) {
      PushNotification.localNotification({
        id: `streak-milestone-${streakCount}`,
        title: '🔥 Félicitations!',
        message: `Incroyable! Vous avez maintenu votre streak ${streakCount} jours!`,
        channelId: 'methode-j-channel',
        priority: 'high',
        actions: ['Continuer', 'Partager'],
        category: 'STREAK_MILESTONE',
        userInfo: {
          type: NOTIFICATION_TYPES.STREAK_MILESTONE,
          streak_count: streakCount
        }
      });
    }
  }

  scheduleAchievementNotification(achievement) {
    PushNotification.localNotification({
      id: `achievement-${achievement.id}`,
      title: '🏆 Nouveau badge débloqué!',
      message: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
      channelId: 'methode-j-channel',
      priority: 'high',
      actions: ['Voir badges', 'OK'],
      category: 'ACHIEVEMENT',
      userInfo: {
        type: NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
        achievement_id: achievement.id
      }
    });
  }

  scheduleOverdueReminder(overdueCount) {
    if (overdueCount > 0) {
      PushNotification.localNotification({
        id: 'overdue-reminder',
        title: '⚠️ Révisions en retard',
        message: `Vous avez ${overdueCount} révision${overdueCount > 1 ? 's' : ''} en retard. Rattrapez-vous!`,
        channelId: 'methode-j-channel',
        priority: 'high',
        actions: ['Rattraper', 'Voir tout'],
        category: 'OVERDUE_REMINDER',
        userInfo: {
          type: 'overdue_reminder',
          overdue_count: overdueCount
        }
      });
    }
  }

  scheduleMotivationalMessage() {
    const messages = [
      'Continuez comme ça! Chaque révision vous rapproche de votre objectif 💪',
      'La constance est la clé du succès! Excellent travail 🌟',
      'Vous progressez bien! Gardez cette motivation 🚀',
      'Bravo pour votre régularité! Vous êtes sur la bonne voie 📈',
      'Excellent travail! Vos efforts portent leurs fruits 🎯'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    PushNotification.localNotification({
      id: 'motivational-message',
      title: '🌟 Message de motivation',
      message: randomMessage,
      channelId: 'methode-j-channel',
      actions: ['Merci', 'Continuer'],
      category: 'MOTIVATION',
      userInfo: {
        type: 'motivational_message'
      }
    });
  }

  cancelNotification(id) {
    PushNotification.cancelLocalNotification(id);
    console.log(`Notification ${id} cancelled`);
  }

  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
    console.log('All notifications cancelled');
  }

  updateDailyReminderTime(newTime) {
    // Annuler l'ancien rappel
    this.cancelNotification('daily-reminder');
    
    // Programmer le nouveau
    this.scheduleDailyReminder(newTime);
  }

  checkAndScheduleUpcomingExams(ues) {
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    ues.forEach(ue => {
      if (ue.exam_date) {
        const examDate = new Date(ue.exam_date);
        const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        
        // Programmer des rappels à différents intervalles
        if (daysUntilExam > 0 && daysUntilExam <= 14) {
          if (daysUntilExam === 7) {
            this.scheduleExamReminder(ue.exam_date, ue.name, 7);
          }
          if (daysUntilExam === 3) {
            this.scheduleExamReminder(ue.exam_date, ue.name, 3);
          }
          if (daysUntilExam === 1) {
            this.scheduleExamReminder(ue.exam_date, ue.name, 1);
          }
        }
      }
    });
  }

  async getScheduledNotifications() {
    return new Promise((resolve) => {
      PushNotification.getScheduledLocalNotifications((notifications) => {
        resolve(notifications);
      });
    });
  }

  async getDeliveredNotifications() {
    return new Promise((resolve) => {
      PushNotification.getDeliveredNotifications((notifications) => {
        resolve(notifications);
      });
    });
  }

  setNotificationBadge(count) {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  clearNotificationBadge() {
    PushNotification.setApplicationIconBadgeNumber(0);
  }

  async requestPermissions() {
    return new Promise((resolve) => {
      PushNotification.requestPermissions().then(resolve);
    });
  }

  async checkPermissions() {
    return new Promise((resolve) => {
      PushNotification.checkPermissions(resolve);
    });
  }

  // Méthodes d'analyse pour optimiser les notifications
  logNotificationInteraction(notificationId, action) {
    const interaction = {
      notification_id: notificationId,
      action: action,
      timestamp: new Date().toISOString()
    };
    
    // Stocker en base pour analyser l'efficacité
    console.log('Notification interaction:', interaction);
  }

  async getNotificationStats() {
    // Récupérer les statistiques d'interaction avec les notifications
    // Utile pour optimiser les heures et types de notifications
    
    return {
      total_sent: 0,
      total_opened: 0,
      open_rate: 0,
      best_time: '07:30',
      most_effective_type: NOTIFICATION_TYPES.DAILY_REMINDER
    };
  }
}