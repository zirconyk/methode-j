export class RevisionAlgorithm {
  constructor() {
    this.baseIntervals = [1, 7, 14, 30, 90, 180, 365]; // Intervalles de base en jours
    this.eliminationThreshold = 9;
    this.baseThreshold = 12;
  }

  setThresholds(elimination, base) {
    this.eliminationThreshold = elimination;
    this.baseThreshold = base;
  }

  calculateCoefficient(grade) {
    if (grade < 0 || grade > 20) {
      throw new Error('La note doit être entre 0 et 20');
    }

    // Coefficient exponentiel basé sur la note
    if (grade <= this.eliminationThreshold) {
      // Notes éliminatoires : coefficient très faible (0.2 - 0.4)
      return 0.2 + (grade / this.eliminationThreshold) * 0.2;
    } else if (grade < this.baseThreshold) {
      // Notes sous la moyenne : coefficient réduit (0.4 - 1.0)
      const normalizedGrade = (grade - this.eliminationThreshold) / (this.baseThreshold - this.eliminationThreshold);
      return 0.4 + normalizedGrade * 0.6;
    } else {
      // Notes au-dessus de la moyenne : coefficient augmenté (1.0 - 2.5)
      const normalizedGrade = (grade - this.baseThreshold) / (20 - this.baseThreshold);
      return 1.0 + Math.pow(normalizedGrade, 1.5) * 1.5;
    }
  }

  calculateNextInterval(currentInterval, grade, revisionHistory = []) {
    const coefficient = this.calculateCoefficient(grade);
    
    // Calculer l'intervalle de base suivant
    const currentIndex = this.baseIntervals.indexOf(currentInterval);
    let nextBaseInterval;
    
    if (currentIndex === -1) {
      // Si l'intervalle actuel n'est pas dans la liste de base, trouver le plus proche
      nextBaseInterval = this.baseIntervals.find(interval => interval > currentInterval) || this.baseIntervals[this.baseIntervals.length - 1];
    } else if (currentIndex < this.baseIntervals.length - 1) {
      nextBaseInterval = this.baseIntervals[currentIndex + 1];
    } else {
      nextBaseInterval = this.baseIntervals[this.baseIntervals.length - 1];
    }

    // Appliquer le coefficient
    let calculatedInterval = Math.round(nextBaseInterval * coefficient);
    
    // Prendre en compte l'historique si disponible
    if (revisionHistory.length > 0) {
      const weightedAverage = this.calculateWeightedAverage(revisionHistory, grade);
      const historyCoefficient = this.calculateCoefficient(weightedAverage);
      calculatedInterval = Math.round(nextBaseInterval * historyCoefficient);
    }

    // Contraintes min/max
    return Math.max(1, Math.min(calculatedInterval, 365));
  }

  calculateWeightedAverage(revisionHistory, currentGrade) {
    if (revisionHistory.length === 0) return currentGrade;
    
    // Note actuelle 70% + moyenne des 3 dernières 30%
    const recentRevisions = revisionHistory.slice(-3);
    const historicalAverage = recentRevisions.reduce((sum, rev) => sum + rev.grade, 0) / recentRevisions.length;
    
    return currentGrade * 0.7 + historicalAverage * 0.3;
  }

  calculateNextRevisionDate(lastDate, interval) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + interval);
    return date.toISOString().split('T')[0];
  }

  shouldPrioritizeForExam(examDate, courseGrade, preExamPeriod = 7) {
    const today = new Date();
    const exam = new Date(examDate);
    const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
    
    // Si on est dans la période pré-examen
    if (daysUntilExam <= preExamPeriod && daysUntilExam > 0) {
      return true;
    }
    
    return false;
  }

  generatePreExamSchedule(examDate, courseGrade, preExamPeriod = 7) {
    const schedule = [];
    const exam = new Date(examDate);
    
    // Révisions intensives: J-7, J-3, J-1 (ajustable selon la période)
    const revisionDays = [];
    if (preExamPeriod >= 7) {
      revisionDays.push(7, 3, 1);
    } else if (preExamPeriod >= 3) {
      revisionDays.push(3, 1);
    } else {
      revisionDays.push(1);
    }

    revisionDays.forEach(daysBefore => {
      const revisionDate = new Date(exam);
      revisionDate.setDate(exam.getDate() - daysBefore);
      
      schedule.push({
        date: revisionDate.toISOString().split('T')[0],
        type: 'pre_exam',
        priority: 'high',
        daysBefore: daysBefore
      });
    });

    return schedule;
  }

  prioritizeRevisions(revisions) {
    return revisions.sort((a, b) => {
      // 1. Révisions en retard (priorité absolue)
      const today = new Date().toISOString().split('T')[0];
      const aOverdue = a.scheduled_date < today;
      const bOverdue = b.scheduled_date < today;
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // 2. Révisions pré-examen
      if (a.type === 'pre_exam' && b.type !== 'pre_exam') return -1;
      if (a.type !== 'pre_exam' && b.type === 'pre_exam') return 1;
      
      // 3. Note la plus faible en premier
      if (a.grade !== b.grade) return a.grade - b.grade;
      
      // 4. Date de révision la plus ancienne
      return a.scheduled_date.localeCompare(b.scheduled_date);
    });
  }

  calculateDailyProgress(completedRevisions, totalRevisions) {
    if (totalRevisions === 0) return 0;
    return (completedRevisions / totalRevisions) * 100;
  }

  calculatePoints(grade, previousGrade = null, streak = 0) {
    let points = 0;
    
    // Points de base selon la note
    if (grade >= 18) points += 10;
    else if (grade >= 15) points += 7;
    else if (grade >= 12) points += 5;
    else if (grade >= 9) points += 3;
    else points += 1;
    
    // Bonus d'amélioration
    if (previousGrade && grade > previousGrade) {
      const improvement = grade - previousGrade;
      points += Math.round(improvement * 2);
    }
    
    // Bonus de streak
    if (streak > 0) {
      points += Math.floor(streak / 7) * 5; // 5 points par semaine de streak
    }
    
    return points;
  }

  checkAchievements(stats) {
    const achievements = [];
    
    // Streak achievements
    if (stats.streak >= 7) achievements.push('STREAK_7');
    if (stats.streak >= 30) achievements.push('STREAK_30');
    if (stats.streak >= 100) achievements.push('STREAK_100');
    
    // Grade achievements
    if (stats.perfectScores >= 1) achievements.push('PERFECT_SCORE');
    if (stats.perfectScores >= 10) achievements.push('PERFECTIONIST');
    
    // Consistency achievements
    if (stats.totalRevisions >= 50) achievements.push('DEDICATED');
    if (stats.totalRevisions >= 200) achievements.push('SCHOLAR');
    
    // Improvement achievements
    if (stats.averageImprovement >= 3) achievements.push('IMPROVER');
    if (stats.averageImprovement >= 5) achievements.push('EXCELLENCE');
    
    return achievements;
  }

  exportData(revisions, courses, ues, settings) {
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: {
        revisions: revisions,
        courses: courses,
        ues: ues,
        settings: settings
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.version || !data.data) {
        throw new Error('Format de données invalide');
      }
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}