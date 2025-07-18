export const UE_COLORS = [
  '#FF6B6B', // Rouge corail
  '#4ECDC4', // Turquoise
  '#45B7D1', // Bleu ciel
  '#96CEB4', // Vert menthe
  '#FFEAA7', // Jaune doux
  '#DDA0DD', // Prune
  '#FFA07A', // Saumon
  '#20B2AA', // Bleu-vert
  '#87CEEB', // Bleu ciel léger
  '#98FB98', // Vert pâle
  '#F0E68C', // Kaki
  '#DEB887', // Beige
  '#FFA500', // Orange
  '#FF69B4', // Rose vif
  '#8A2BE2', // Violet
  '#DC143C', // Cramoisi
  '#00CED1', // Turquoise foncé
  '#FF1493', // Rose profond
  '#32CD32', // Vert lime
  '#FF4500', // Orange rouge
  '#9370DB', // Violet moyen
  '#3CB371', // Vert de mer
  '#FF6347', // Tomate
  '#4682B4', // Bleu acier
  '#D2691E', // Chocolat
  '#FF8C00', // Orange foncé
  '#9932CC', // Orchidée foncée
  '#8FBC8F', // Gris-vert foncé
  '#FF00FF', // Magenta
  '#1E90FF'  // Bleu dodger
];

export const THEME_COLORS = {
  // Couleurs principales
  primary: '#1A1A1A',
  secondary: '#2D2D2D',
  accent: '#4ECDC4',
  
  // Arrière-plans
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2D2D2D',
  
  // Texte
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#808080',
  
  // États
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Grades
  gradeExcellent: '#4CAF50',  // Vert pour 16-20
  gradeGood: '#8BC34A',       // Vert clair pour 13-15
  gradeAverage: '#FFC107',    // Jaune pour 10-12
  gradePoor: '#FF9800',       // Orange pour 7-9
  gradeVeryPoor: '#F44336',   // Rouge pour 0-6
  
  // Interface
  border: '#404040',
  placeholder: '#666666',
  disabled: '#555555',
  
  // Gamification
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  
  // Progression
  progressBackground: '#333333',
  progressFill: '#4ECDC4',
  
  // Notifications
  notificationBackground: '#2D2D2D',
  notificationBorder: '#4ECDC4',
  
  // Boutons
  buttonPrimary: '#4ECDC4',
  buttonSecondary: '#2D2D2D',
  buttonDisabled: '#555555',
  
  // Calendrier
  calendarBackground: '#1E1E1E',
  calendarToday: '#4ECDC4',
  calendarSelected: '#45B7D1',
  calendarRevision: '#FF6B6B',
  
  // Graphiques
  chartPrimary: '#4ECDC4',
  chartSecondary: '#45B7D1',
  chartTertiary: '#96CEB4',
  chartQuaternary: '#FFEAA7',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  modalBackground: '#1E1E1E',
  
  // Shadows
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

export const getGradeColor = (grade) => {
  if (grade >= 16) return THEME_COLORS.gradeExcellent;
  if (grade >= 13) return THEME_COLORS.gradeGood;
  if (grade >= 10) return THEME_COLORS.gradeAverage;
  if (grade >= 7) return THEME_COLORS.gradePoor;
  return THEME_COLORS.gradeVeryPoor;
};

export const getBadgeColor = (type) => {
  switch (type) {
    case 'gold': return THEME_COLORS.gold;
    case 'silver': return THEME_COLORS.silver;
    case 'bronze': return THEME_COLORS.bronze;
    default: return THEME_COLORS.accent;
  }
};

export const getUEColor = (index) => {
  return UE_COLORS[index % UE_COLORS.length];
};