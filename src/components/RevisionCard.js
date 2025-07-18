import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { THEME_COLORS, getGradeColor } from '../constants/colors';

const RevisionCard = ({ 
  revision, 
  onPress, 
  onSwipe,
  isOverdue = false,
  isPreExam = false
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const translateX = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays === -1) return "Hier";
    if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  const getStatusColor = () => {
    if (isOverdue) return THEME_COLORS.error;
    if (isPreExam) return THEME_COLORS.warning;
    return THEME_COLORS.accent;
  };

  const getStatusText = () => {
    if (isOverdue) return "En retard";
    if (isPreExam) return "Pré-examen";
    return "Programmé";
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        transform: [
          { scale: scaleAnim },
          { translateX: translateX }
        ]
      }
    ]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={styles.ueInfo}>
            <View style={[styles.ueColorIndicator, { backgroundColor: revision.ue_color }]} />
            <Text style={styles.ueName}>{revision.ue_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.courseTitle}>{revision.course_title}</Text>
          <Text style={styles.courseType}>
            {revision.course_type === 'synthesis' ? 'Synthèse' : 'Cours'}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.gradeContainer}>
            <Text style={styles.gradeLabel}>Dernière note:</Text>
            <View style={[
              styles.gradeBadge,
              { backgroundColor: getGradeColor(revision.grade) }
            ]}>
              <Text style={styles.gradeText}>{revision.grade}/20</Text>
            </View>
          </View>
          
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Planifié:</Text>
            <Text style={[
              styles.dateText,
              { color: isOverdue ? THEME_COLORS.error : THEME_COLORS.textSecondary }
            ]}>
              {formatDate(revision.scheduled_date)}
            </Text>
          </View>
        </View>

        <View style={styles.swipeIndicator}>
          <Text style={styles.swipeText}>← Glisser pour terminer</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: THEME_COLORS.card,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: THEME_COLORS.shadowOffset,
    shadowOpacity: THEME_COLORS.shadowOpacity,
    shadowRadius: THEME_COLORS.shadowRadius,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ueColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  ueName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME_COLORS.text,
  },
  content: {
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 4,
  },
  courseType: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
    marginRight: 8,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  swipeIndicator: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.border,
  },
  swipeText: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
    fontStyle: 'italic',
  },
});

export default RevisionCard;