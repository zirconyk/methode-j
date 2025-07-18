import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { THEME_COLORS } from '../constants/colors';
import Database from '../services/database';
import { RevisionAlgorithm } from '../services/revisionAlgorithm';

const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [dayRevisions, setDayRevisions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const db = new Database();
  const algorithm = new RevisionAlgorithm();

  useEffect(() => {
    initializeCalendar();
  }, []);

  const initializeCalendar = async () => {
    try {
      await db.initDB();
      await loadCalendarData();
      await loadDayRevisions(selectedDate);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du calendrier:', error);
    }
  };

  const loadCalendarData = async () => {
    try {
      // Charger toutes les révisions du mois
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const result = await db.db.executeSql(`
        SELECT 
          r.scheduled_date,
          r.is_completed,
          r.grade,
          COUNT(*) as revision_count,
          AVG(r.grade) as avg_grade
        FROM revisions r
        JOIN courses c ON r.course_id = c.id
        JOIN ue u ON c.ue_id = u.id
        WHERE r.scheduled_date BETWEEN ? AND ?
        AND c.is_active = 1 AND u.is_active = 1
        GROUP BY r.scheduled_date
        ORDER BY r.scheduled_date
      `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

      const revisions = result[0].rows.raw();
      const marked = {};
      
      // Marquer les dates avec des révisions
      revisions.forEach(revision => {
        const date = revision.scheduled_date;
        const isCompleted = revision.is_completed;
        const avgGrade = revision.avg_grade;
        const count = revision.revision_count;
        
        marked[date] = {
          marked: true,
          dotColor: isCompleted ? THEME_COLORS.success : THEME_COLORS.warning,
          selectedColor: THEME_COLORS.accent,
          customStyles: {
            container: {
              backgroundColor: isCompleted ? THEME_COLORS.success : THEME_COLORS.warning,
              opacity: 0.3
            },
            text: {
              color: THEME_COLORS.text,
              fontWeight: 'bold'
            }
          }
        };
      });

      // Marquer la date sélectionnée
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: THEME_COLORS.accent,
      };

      setMarkedDates(marked);
    } catch (error) {
      console.error('Erreur lors du chargement des données du calendrier:', error);
    }
  };

  const loadDayRevisions = async (date) => {
    try {
      const result = await db.db.executeSql(`
        SELECT 
          r.*,
          c.title as course_title,
          c.type as course_type,
          u.name as ue_name,
          u.color as ue_color
        FROM revisions r
        JOIN courses c ON r.course_id = c.id
        JOIN ue u ON c.ue_id = u.id
        WHERE r.scheduled_date = ?
        AND c.is_active = 1 AND u.is_active = 1
        ORDER BY r.grade ASC, r.is_completed ASC
      `, [date]);

      const revisions = result[0].rows.raw();
      setDayRevisions(revisions);
    } catch (error) {
      console.error('Erreur lors du chargement des révisions du jour:', error);
    }
  };

  const onDayPress = (day) => {
    const newDate = day.dateString;
    setSelectedDate(newDate);
    loadDayRevisions(newDate);
    
    // Mettre à jour les dates marquées
    const newMarked = { ...markedDates };
    
    // Retirer la sélection précédente
    Object.keys(newMarked).forEach(date => {
      if (newMarked[date].selected) {
        newMarked[date] = {
          ...newMarked[date],
          selected: false
        };
      }
    });
    
    // Ajouter la nouvelle sélection
    newMarked[newDate] = {
      ...newMarked[newDate],
      selected: true,
      selectedColor: THEME_COLORS.accent,
    };
    
    setMarkedDates(newMarked);
  };

  const onMonthChange = (month) => {
    setCurrentMonth(new Date(month.year, month.month - 1));
    loadCalendarData();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCalendarData();
    await loadDayRevisions(selectedDate);
    setRefreshing(false);
  };

  const getDateDisplayText = (date) => {
    const today = new Date().toISOString().split('T')[0];
    const selected = new Date(date);
    const todayDate = new Date(today);
    
    if (date === today) return "Aujourd'hui";
    
    const diffTime = selected.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Demain";
    if (diffDays === -1) return "Hier";
    if (diffDays > 0) return `Dans ${diffDays} jours`;
    if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jours`;
    
    return selected.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const getRevisionStatusColor = (revision) => {
    if (revision.is_completed) return THEME_COLORS.success;
    
    const today = new Date().toISOString().split('T')[0];
    if (revision.scheduled_date < today) return THEME_COLORS.error;
    
    return THEME_COLORS.warning;
  };

  const handleRevisionPress = (revision) => {
    if (revision.is_completed) {
      Alert.alert(
        'Révision terminée',
        `Note obtenue: ${revision.grade}/20`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Révision en attente',
        `${revision.course_title} - ${revision.ue_name}`,
        [
          { text: 'Fermer', style: 'cancel' },
          { text: 'Faire maintenant', onPress: () => navigation.navigate('Dashboard') }
        ]
      );
    }
  };

  const getTodayStats = () => {
    const completed = dayRevisions.filter(r => r.is_completed).length;
    const total = dayRevisions.length;
    return { completed, total };
  };

  const calendarTheme = {
    backgroundColor: THEME_COLORS.background,
    calendarBackground: THEME_COLORS.surface,
    textSectionTitleColor: THEME_COLORS.text,
    selectedDayBackgroundColor: THEME_COLORS.accent,
    selectedDayTextColor: THEME_COLORS.text,
    todayTextColor: THEME_COLORS.accent,
    dayTextColor: THEME_COLORS.text,
    textDisabledColor: THEME_COLORS.disabled,
    dotColor: THEME_COLORS.accent,
    selectedDotColor: THEME_COLORS.text,
    arrowColor: THEME_COLORS.accent,
    monthTextColor: THEME_COLORS.text,
    indicatorColor: THEME_COLORS.accent,
    textDayFontWeight: '500',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '600',
    textMonthFontSize: 18,
    textDayFontSize: 16,
    textDayHeaderFontSize: 14,
  };

  const { completed, total } = getTodayStats();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
          markedDates={markedDates}
          theme={calendarTheme}
          style={styles.calendar}
          hideExtraDays={true}
          firstDay={1} // Lundi en premier
          showWeekNumbers={false}
          disableMonthChange={false}
          enableSwipeMonths={true}
        />

        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            {getDateDisplayText(selectedDate)}
          </Text>
          
          {total > 0 && (
            <View style={styles.statsBar}>
              <Text style={styles.statsText}>
                {completed}/{total} révisions terminées
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(completed / total) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.revisionsSection}>
          {dayRevisions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Aucune révision programmée pour cette date
              </Text>
              <TouchableOpacity
                style={styles.addRevisionButton}
                onPress={() => navigation.navigate('AddRevision', { date: selectedDate })}
              >
                <Text style={styles.addRevisionButtonText}>
                  Ajouter une révision
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            dayRevisions.map((revision) => (
              <TouchableOpacity
                key={revision.id}
                style={styles.revisionCard}
                onPress={() => handleRevisionPress(revision)}
              >
                <View style={styles.revisionHeader}>
                  <View style={styles.revisionInfo}>
                    <View style={[
                      styles.ueColorIndicator,
                      { backgroundColor: revision.ue_color }
                    ]} />
                    <Text style={styles.revisionTitle}>
                      {revision.course_title}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: getRevisionStatusColor(revision) }
                  ]}>
                    <Text style={styles.statusText}>
                      {revision.is_completed ? '✓' : '○'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.revisionSubtitle}>
                  {revision.ue_name} • {revision.course_type === 'synthesis' ? 'Synthèse' : 'Cours'}
                </Text>
                
                {revision.is_completed && (
                  <Text style={styles.gradeText}>
                    Note: {revision.grade}/20
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.legendSection}>
          <Text style={styles.legendTitle}>Légende</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: THEME_COLORS.success }]} />
              <Text style={styles.legendText}>Révisions terminées</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: THEME_COLORS.warning }]} />
              <Text style={styles.legendText}>Révisions programmées</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: THEME_COLORS.error }]} />
              <Text style={styles.legendText}>Révisions en retard</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  calendar: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  selectedDateSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  selectedDateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  statsBar: {
    marginTop: 10,
  },
  statsText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: THEME_COLORS.progressBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.progressFill,
    borderRadius: 3,
  },
  revisionsSection: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  addRevisionButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addRevisionButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  revisionCard: {
    backgroundColor: THEME_COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  revisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revisionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ueColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  revisionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    flex: 1,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: THEME_COLORS.text,
    fontWeight: 'bold',
  },
  revisionSubtitle: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginLeft: 22,
  },
  gradeText: {
    fontSize: 14,
    color: THEME_COLORS.accent,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 22,
  },
  legendSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.border,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'column',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
});

export default CalendarScreen;