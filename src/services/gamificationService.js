import { BADGES } from '../constants';
import { RevisionAlgorithm } from './revisionAlgorithm';
import Database from './database';

export class GamificationService {
  constructor() {
    this.db = new Database();
    this.algorithm = new RevisionAlgorithm();
  }

  async calculateStats(userId = 1) {
    try {
      // Récupérer toutes les révisions complétées
      const revisions = await this.db.db.executeSql(
        'SELECT * FROM revisions WHERE is_completed = 1 ORDER BY completed_date DESC'
      );
      
      const completedRevisions = revisions[0].rows.raw();
      
      // Calculer les statistiques
      const stats = {
        totalRevisions: completedRevisions.length,
        streak: await this.calculateStreak(),
        perfectScores: completedRevisions.filter(r => r.grade === 20).length,
        averageGrade: this.calculateAverageGrade(completedRevisions),
        averageImprovement: await this.calculateAverageImprovement(),
        weeklyRevisions: this.getWeeklyRevisions(completedRevisions),
        monthlyRevisions: this.getMonthlyRevisions(completedRevisions),
        gradeDistribution: this.calculateGradeDistribution(completedRevisions),
        bestStreak: await this.getBestStreak(),
        totalPoints: await this.getTotalPoints(),
        currentLevel: await this.getCurrentLevel(),
        nextLevelProgress: await this.getNextLevelProgress()
      };

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return null;
    }
  }

  async calculateStreak() {
    try {
      const today = new Date();
      let streak = 0;
      let currentDate = new Date(today);

      while (true) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        const result = await this.db.db.executeSql(
          'SELECT COUNT(*) as count FROM revisions WHERE completed_date = ? AND is_completed = 1',
          [dateString]
        );
        
        const count = result[0].rows.item(0).count;
        
        if (count === 0) {
          // Si c'est aujourd'hui et qu'il n'y a pas de révision, on continue
          if (currentDate.toDateString() === today.toDateString()) {
            currentDate.setDate(currentDate.getDate() - 1);
            continue;
          }
          break;
        }
        
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return streak;
    } catch (error) {
      console.error('Erreur lors du calcul du streak:', error);
      return 0;
    }
  }

  calculateAverageGrade(revisions) {
    if (revisions.length === 0) return 0;
    const sum = revisions.reduce((acc, revision) => acc + revision.grade, 0);
    return (sum / revisions.length).toFixed(1);
  }

  async calculateAverageImprovement() {
    try {
      const result = await this.db.db.executeSql(`
        SELECT c.id, 
               AVG(r.grade) as avg_grade,
               COUNT(r.id) as revision_count
        FROM courses c
        LEFT JOIN revisions r ON c.id = r.course_id AND r.is_completed = 1
        GROUP BY c.id
        HAVING revision_count > 1
      `);
      
      const courses = result[0].rows.raw();
      let totalImprovement = 0;
      let courseCount = 0;

      for (const course of courses) {
        const revisions = await this.db.db.executeSql(
          'SELECT grade FROM revisions WHERE course_id = ? AND is_completed = 1 ORDER BY completed_date ASC',
          [course.id]
        );
        
        const grades = revisions[0].rows.raw();
        if (grades.length >= 2) {
          const firstGrade = grades[0].grade;
          const lastGrade = grades[grades.length - 1].grade;
          totalImprovement += (lastGrade - firstGrade);
          courseCount++;
        }
      }

      return courseCount > 0 ? (totalImprovement / courseCount).toFixed(1) : 0;
    } catch (error) {
      console.error('Erreur lors du calcul de l\'amélioration moyenne:', error);
      return 0;
    }
  }

  getWeeklyRevisions(revisions) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return revisions.filter(r => {
      const completedDate = new Date(r.completed_date);
      return completedDate >= oneWeekAgo;
    }).length;
  }

  getMonthlyRevisions(revisions) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return revisions.filter(r => {
      const completedDate = new Date(r.completed_date);
      return completedDate >= oneMonthAgo;
    }).length;
  }

  calculateGradeDistribution(revisions) {
    const distribution = {
      excellent: 0, // 16-20
      good: 0,      // 13-15
      average: 0,   // 10-12
      poor: 0,      // 7-9
      veryPoor: 0   // 0-6
    };

    revisions.forEach(revision => {
      const grade = revision.grade;
      if (grade >= 16) distribution.excellent++;
      else if (grade >= 13) distribution.good++;
      else if (grade >= 10) distribution.average++;
      else if (grade >= 7) distribution.poor++;
      else distribution.veryPoor++;
    });

    return distribution;
  }

  async getBestStreak() {
    try {
      const result = await this.db.db.executeSql(
        'SELECT MAX(streak_days) as best_streak FROM gamification'
      );
      
      return result[0].rows.item(0).best_streak || 0;
    } catch (error) {
      console.error('Erreur lors de la récupération du meilleur streak:', error);
      return 0;
    }
  }

  async getTotalPoints() {
    try {
      const result = await this.db.db.executeSql(
        'SELECT user_points FROM gamification WHERE id = 1'
      );
      
      return result[0].rows.item(0)?.user_points || 0;
    } catch (error) {
      console.error('Erreur lors de la récupération des points:', error);
      return 0;
    }
  }

  async getCurrentLevel() {
    const points = await this.getTotalPoints();
    return Math.floor(points / 1000) + 1; // 1000 points par niveau
  }

  async getNextLevelProgress() {
    const points = await this.getTotalPoints();
    const currentLevelPoints = (await this.getCurrentLevel() - 1) * 1000;
    const nextLevelPoints = currentLevelPoints + 1000;
    const progress = ((points - currentLevelPoints) / 1000) * 100;
    
    return {
      current: points - currentLevelPoints,
      required: 1000,
      percentage: Math.min(progress, 100)
    };
  }

  async updateStreak(isConsecutive = true) {
    try {
      const gamificationData = await this.db.getGamificationData();
      if (!gamificationData) return;

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = gamificationData.last_activity_date;
      
      let newStreak = gamificationData.streak_days;
      
      if (isConsecutive && lastActivity) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        if (lastActivity === yesterdayString) {
          newStreak += 1;
        } else if (lastActivity !== today) {
          newStreak = 1; // Reset streak
        }
      } else if (!lastActivity) {
        newStreak = 1;
      }

      await this.db.updateGamificationData({
        ...gamificationData,
        streak_days: newStreak,
        last_activity_date: today
      });

      return newStreak;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du streak:', error);
      return 0;
    }
  }

  async awardPoints(points, reason = '') {
    try {
      const gamificationData = await this.db.getGamificationData();
      if (!gamificationData) return;

      const newPoints = gamificationData.user_points + points;
      
      await this.db.updateGamificationData({
        ...gamificationData,
        user_points: newPoints
      });

      console.log(`Points awarded: ${points} (${reason})`);
      return newPoints;
    } catch (error) {
      console.error('Erreur lors de l\'attribution des points:', error);
      return 0;
    }
  }

  async checkAndAwardBadges(stats) {
    try {
      const gamificationData = await this.db.getGamificationData();
      if (!gamificationData) return [];

      const currentBadges = JSON.parse(gamificationData.badges || '[]');
      const newBadges = [];

      // Vérifier chaque badge
      Object.keys(BADGES).forEach(badgeId => {
        if (currentBadges.includes(badgeId)) return; // Déjà obtenu

        let shouldAward = false;

        switch (badgeId) {
          case 'STREAK_7':
            shouldAward = stats.streak >= 7;
            break;
          case 'STREAK_30':
            shouldAward = stats.streak >= 30;
            break;
          case 'STREAK_100':
            shouldAward = stats.streak >= 100;
            break;
          case 'PERFECT_SCORE':
            shouldAward = stats.perfectScores >= 1;
            break;
          case 'PERFECTIONIST':
            shouldAward = stats.perfectScores >= 10;
            break;
          case 'DEDICATED':
            shouldAward = stats.totalRevisions >= 50;
            break;
          case 'SCHOLAR':
            shouldAward = stats.totalRevisions >= 200;
            break;
          case 'IMPROVER':
            shouldAward = stats.averageImprovement >= 3;
            break;
          case 'EXCELLENCE':
            shouldAward = stats.averageImprovement >= 5;
            break;
        }

        if (shouldAward) {
          newBadges.push(badgeId);
          currentBadges.push(badgeId);
        }
      });

      // Sauvegarder les nouveaux badges
      if (newBadges.length > 0) {
        await this.db.updateGamificationData({
          ...gamificationData,
          badges: JSON.stringify(currentBadges)
        });

        // Attribuer des points bonus pour les badges
        const bonusPoints = newBadges.length * 100;
        await this.awardPoints(bonusPoints, 'Bonus badges');
      }

      return newBadges;
    } catch (error) {
      console.error('Erreur lors de la vérification des badges:', error);
      return [];
    }
  }

  async getLeaderboardData() {
    try {
      // Pour une future version multi-utilisateurs
      const stats = await this.calculateStats();
      
      return {
        currentUser: {
          rank: 1,
          points: stats.totalPoints,
          level: stats.currentLevel,
          streak: stats.streak
        },
        topUsers: [
          {
            rank: 1,
            name: 'Vous',
            points: stats.totalPoints,
            level: stats.currentLevel,
            streak: stats.streak
          }
        ]
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du classement:', error);
      return null;
    }
  }

  async resetGamification() {
    try {
      await this.db.updateGamificationData({
        user_points: 0,
        streak_days: 0,
        last_activity_date: null,
        badges: '[]',
        achievements: '[]'
      });
      
      console.log('Gamification reset successfully');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  }

  async exportGamificationData() {
    try {
      const stats = await this.calculateStats();
      const gamificationData = await this.db.getGamificationData();
      
      return {
        stats: stats,
        gamification: gamificationData,
        exported_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      return null;
    }
  }
}