export const BADGES = {
  STREAK_7: {
    id: 'STREAK_7',
    name: '7 Jours',
    description: 'Révision 7 jours consécutifs',
    icon: '🔥',
    type: 'bronze'
  },
  STREAK_30: {
    id: 'STREAK_30',
    name: '30 Jours',
    description: 'Révision 30 jours consécutifs',
    icon: '🔥',
    type: 'silver'
  },
  STREAK_100: {
    id: 'STREAK_100',
    name: '100 Jours',
    description: 'Révision 100 jours consécutifs',
    icon: '🔥',
    type: 'gold'
  },
  PERFECT_SCORE: {
    id: 'PERFECT_SCORE',
    name: 'Parfait',
    description: 'Première note parfaite (20/20)',
    icon: '⭐',
    type: 'gold'
  },
  PERFECTIONIST: {
    id: 'PERFECTIONIST',
    name: 'Perfectionniste',
    description: '10 notes parfaites',
    icon: '👑',
    type: 'gold'
  },
  DEDICATED: {
    id: 'DEDICATED',
    name: 'Dévoué',
    description: '50 révisions complétées',
    icon: '📚',
    type: 'bronze'
  },
  SCHOLAR: {
    id: 'SCHOLAR',
    name: 'Érudit',
    description: '200 révisions complétées',
    icon: '🎓',
    type: 'gold'
  },
  IMPROVER: {
    id: 'IMPROVER',
    name: 'Progressiste',
    description: 'Amélioration moyenne de 3 points',
    icon: '📈',
    type: 'silver'
  },
  EXCELLENCE: {
    id: 'EXCELLENCE',
    name: 'Excellence',
    description: 'Amélioration moyenne de 5 points',
    icon: '🏆',
    type: 'gold'
  }
};

export const COURSE_TYPES = {
  COURSE: 'course',
  SYNTHESIS: 'synthesis',
  EXAM_PREP: 'exam_prep'
};

export const REVISION_TYPES = {
  NORMAL: 'normal',
  PRE_EXAM: 'pre_exam',
  OVERDUE: 'overdue'
};

export const SEMESTERS = {
  AUTUMN: 'autumn',
  SPRING: 'spring'
};

export const YEARS = [
  '1A', '2A', '3A', '4A', '5A', '6A'
];

export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: 'daily_reminder',
  EXAM_APPROACHING: 'exam_approaching',
  STREAK_MILESTONE: 'streak_milestone',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked'
};

export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie'
};

export const STATISTICS_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  SEMESTER: 'semester',
  YEAR: 'year'
};

export const DEFAULT_SETTINGS = {
  ELIMINATION_THRESHOLD: 9,
  BASE_THRESHOLD: 12,
  NOTIFICATION_TIME: '07:30',
  MAX_DAILY_REVISIONS: 8,
  AUTO_BACKUP_FREQUENCY: 7, // jours
  THEME: 'dark'
};

export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv'
};

export const ANIMATION_DURATIONS = {
  SHORT: 200,
  MEDIUM: 400,
  LONG: 600
};

export const PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

export const INTERVALS = [1, 7, 14, 30, 90, 180, 365]; // jours

export const GRADE_RANGES = {
  EXCELLENT: { min: 16, max: 20, label: 'Excellent' },
  GOOD: { min: 13, max: 15, label: 'Bien' },
  AVERAGE: { min: 10, max: 12, label: 'Moyen' },
  POOR: { min: 7, max: 9, label: 'Faible' },
  VERY_POOR: { min: 0, max: 6, label: 'Très faible' }
};