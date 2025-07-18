import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { THEME_COLORS } from '../constants/colors';
import { RevisionAlgorithm } from '../services/revisionAlgorithm';
import Database from '../services/database';
import ProgressBar from '../components/ProgressBar';
import RevisionCard from '../components/RevisionCard';
import GradeInput from '../components/GradeInput';

const DashboardScreen = ({ navigation }) => {
  const [todayRevisions, setTodayRevisions] = useState([]);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showGradeInput, setShowGradeInput] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [gamificationData, setGamificationData] = useState(null);

  const db = new Database();
  const algorithm = new RevisionAlgorithm();

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await db.initDB();
      await loadTodayRevisions();
      await loadGamificationData();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    }
  };

  const loadTodayRevisions = async () => {
    try {
      const revisions = await db.getTodayRevisions();
      const prioritized = algorithm.prioritizeRevisions(revisions);
      setTodayRevisions(prioritized);
      
      const completed = revisions.filter(r => r.is_completed).length;
      const total = revisions.length;
      
      setCompletedToday(completed);
      setTotalToday(total);
      setDailyProgress(algorithm.calculateDailyProgress(completed, total));
    } catch (error) {
      console.error('Erreur lors du chargement des révisions:', error);
    }
  };

  const loadGamificationData = async () => {
    try {
      const data = await db.getGamificationData();
      if (data) {
        setGamificationData(data);
        setStreak(data.streak_days);
        setPoints(data.user_points);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la gamification:', error);
    }
  };

  const handleRevisionPress = (revision) => {
    setSelectedRevision(revision);
    setShowGradeInput(true);
  };

  const handleGradeSubmit = async (grade) => {
    if (!selectedRevision) return;

    try {
      // Marquer la révision comme terminée
      await db.completeRevision(selectedRevision.id, grade);
      
      // Récupérer l'historique pour calculer la prochaine révision
      const history = await db.getRevisionHistory(selectedRevision.course_id);
      const nextInterval = algorithm.calculateNextInterval(
        selectedRevision.interval_days,
        grade,
        history
      );
      
      // Programmer la prochaine révision
      const nextDate = algorithm.calculateNextRevisionDate(
        new Date().toISOString().split('T')[0],
        nextInterval
      );
      
      await db.createRevision({
        course_id: selectedRevision.course_id,
        grade: grade,
        scheduled_date: nextDate,
        interval_days: nextInterval
      });

      // Mettre à jour la gamification
      await updateGamification(grade, selectedRevision.grade);
      
      // Recharger les données
      await loadTodayRevisions();
      await loadGamificationData();
      
      // Animation de célébration si bonne note
      if (grade >= 16) {
        showCelebrationAnimation();
      }
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la note');
    }
  };

  const updateGamification = async (newGrade, oldGrade) => {
    try {
      if (!gamificationData) return;

      const newStreak = streak + 1;
      const earnedPoints = algorithm.calculatePoints(newGrade, oldGrade, newStreak);
      const newPoints = points + earnedPoints;

      const updatedData = {
        ...gamificationData,
        user_points: newPoints,
        streak_days: newStreak,
        last_activity_date: new Date().toISOString().split('T')[0],
        badges: gamificationData.badges || '[]',
        achievements: gamificationData.achievements || '[]'
      };

      await db.updateGamificationData(updatedData);
      
      // Vérifier les nouveaux achievements
      const achievements = algorithm.checkAchievements({
        streak: newStreak,
        totalRevisions: completedToday + 1,
        perfectScores: newGrade === 20 ? 1 : 0,
        averageImprovement: newGrade - oldGrade
      });

      if (achievements.length > 0) {
        showAchievementNotification(achievements);
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la gamification:', error);
    }
  };

  const showCelebrationAnimation = () => {
    Alert.alert(
      '🎉 Excellente note!',
      'Félicitations pour cette performance!',
      [{ text: 'Continuer', style: 'default' }]
    );
  };

  const showAchievementNotification = (achievements) => {
    const achievement = achievements[0];
    Alert.alert(
      '🏆 Nouveau badge!',
      `Vous avez débloqué: ${achievement}`,
      [{ text: 'Super!', style: 'default' }]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayRevisions();
    await loadGamificationData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getMotivationalMessage = () => {
    if (dailyProgress === 100) return 'Parfait! Toutes les révisions sont terminées 🎉';
    if (dailyProgress >= 75) return 'Presque fini! Excellent travail 💪';
    if (dailyProgress >= 50) return 'À mi-chemin! Continuez comme ça 📚';
    if (dailyProgress >= 25) return 'Bon début! Restez motivé 🔥';
    return 'Commençons cette journée de révision! 🚀';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLORS.primary} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}!</Text>
          <Text style={styles.motivationalMessage}>{getMotivationalMessage()}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Jours de suite</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedToday}/{totalToday}</Text>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <ProgressBar
            progress={completedToday}
            total={totalToday}
            label="Progression du jour"
            showPercentage={true}
            animated={true}
          />
        </View>

        {/* Revisions */}
        <View style={styles.revisionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Révisions d'aujourd'hui</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddRevision')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {todayRevisions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {completedToday === totalToday && totalToday > 0
                  ? '🎉 Toutes les révisions sont terminées!'
                  : '📚 Aucune révision programmée aujourd\'hui'}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('UEList')}
              >
                <Text style={styles.emptyStateButtonText}>
                  Gérer mes UE
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayRevisions.map((revision) => (
              <RevisionCard
                key={revision.id}
                revision={revision}
                onPress={() => handleRevisionPress(revision)}
                isOverdue={revision.scheduled_date < new Date().toISOString().split('T')[0]}
                isPreExam={revision.type === 'pre_exam'}
              />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={styles.actionButtonText}>📅 Calendrier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Statistics')}
          >
            <Text style={styles.actionButtonText}>📊 Statistiques</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <GradeInput
        visible={showGradeInput}
        onClose={() => setShowGradeInput(false)}
        onSubmit={handleGradeSubmit}
        title={selectedRevision ? `Noter: ${selectedRevision.course_title}` : 'Noter la révision'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 4,
  },
  motivationalMessage: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: THEME_COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
  },
  progressSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  revisionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  addButton: {
    backgroundColor: THEME_COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    color: THEME_COLORS.text,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: THEME_COLORS.card,
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
});

export default DashboardScreen;