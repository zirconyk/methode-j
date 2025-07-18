import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { THEME_COLORS } from '../constants/colors';
import { COURSE_TYPES } from '../constants';
import Database from '../services/database';
import { RevisionAlgorithm } from '../services/revisionAlgorithm';
import GradeInput from '../components/GradeInput';

const UEDetailScreen = ({ navigation, route }) => {
  const { ue } = route.params;
  const [courses, setCourses] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseType, setNewCourseType] = useState(COURSE_TYPES.COURSE);
  const [showGradeInput, setShowGradeInput] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const db = new Database();
  const algorithm = new RevisionAlgorithm();

  useEffect(() => {
    navigation.setOptions({
      title: ue.name,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('AddUE', { ue })}
        >
          <Text style={styles.headerButtonText}>Modifier</Text>
        </TouchableOpacity>
      ),
    });
    
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      await db.initDB();
      const coursesList = await db.getCoursesByUE(ue.id);
      setCourses(coursesList);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseTitle.trim()) {
      Alert.alert('Erreur', 'Le titre du cours est obligatoire');
      return;
    }

    try {
      await db.createCourse({
        ue_id: ue.id,
        title: newCourseTitle.trim(),
        type: newCourseType
      });
      
      setNewCourseTitle('');
      setNewCourseType(COURSE_TYPES.COURSE);
      setShowAddCourse(false);
      await loadCourses();
      
      Alert.alert('Succès', 'Cours ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du cours:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le cours');
    }
  };

  const handleStartRevision = (course) => {
    setSelectedCourse(course);
    setShowGradeInput(true);
  };

  const handleGradeSubmit = async (grade) => {
    if (!selectedCourse) return;

    try {
      // Créer la première révision
      const today = new Date().toISOString().split('T')[0];
      const firstInterval = algorithm.calculateNextInterval(0, grade, []);
      const nextDate = algorithm.calculateNextRevisionDate(today, firstInterval);
      
      await db.createRevision({
        course_id: selectedCourse.id,
        grade: grade,
        scheduled_date: nextDate,
        interval_days: firstInterval
      });
      
      Alert.alert(
        'Révision programmée!',
        `Prochaine révision de "${selectedCourse.title}" le ${new Date(nextDate).toLocaleDateString('fr-FR')}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Erreur lors de la programmation de la révision:', error);
      Alert.alert('Erreur', 'Impossible de programmer la révision');
    }
  };

  const formatExamDate = (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getExamCountdown = (dateString) => {
    if (!dateString) return null;
    
    const exam = new Date(dateString);
    const today = new Date();
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Examen passé';
    if (diffDays === 0) return 'Examen aujourd\'hui!';
    if (diffDays === 1) return 'Examen demain!';
    return `Examen dans ${diffDays} jours`;
  };

  const renderCourseItem = (course) => (
    <View key={course.id} style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseType}>
          {course.type === 'synthesis' ? 'Synthèse' : 'Cours'}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.startRevisionButton}
        onPress={() => handleStartRevision(course)}
      >
        <Text style={styles.startRevisionButtonText}>
          Commencer les révisions
        </Text>
      </TouchableOpacity>
    </View>
  );

  const examCountdown = getExamCountdown(ue.exam_date);

  return (
    <ScrollView style={styles.container}>
      {/* UE Info */}
      <View style={styles.ueInfoCard}>
        <View style={styles.ueHeader}>
          <View style={[styles.ueColorIndicator, { backgroundColor: ue.color }]} />
          <View style={styles.ueInfo}>
            <Text style={styles.ueName}>{ue.name}</Text>
            <Text style={styles.ueDetails}>
              {ue.year} • {ue.semester === 'autumn' ? 'Automne' : 'Printemps'}
            </Text>
          </View>
        </View>

        <View style={styles.examSection}>
          <Text style={styles.examLabel}>Date d'examen:</Text>
          <Text style={styles.examDate}>{formatExamDate(ue.exam_date)}</Text>
          {examCountdown && (
            <Text style={[
              styles.examCountdown,
              { color: ue.exam_date && new Date(ue.exam_date) <= new Date() ? THEME_COLORS.error : THEME_COLORS.warning }
            ]}>
              {examCountdown}
            </Text>
          )}
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Période pré-examen:</Text>
            <Text style={styles.settingValue}>{ue.pre_exam_period || 7} jours</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Contrôle continu:</Text>
            <Text style={styles.settingValue}>{ue.cc_mode ? 'Oui' : 'Non'}</Text>
          </View>
        </View>
      </View>

      {/* Courses Section */}
      <View style={styles.coursesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cours ({courses.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddCourse(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Aucun cours ajouté pour cette UE
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddCourse(true)}
            >
              <Text style={styles.emptyStateButtonText}>
                Ajouter un cours
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          courses.map(renderCourseItem)
        )}
      </View>

      {/* Add Course Modal */}
      <Modal
        visible={showAddCourse}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCourse(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un cours</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newCourseTitle}
              onChangeText={setNewCourseTitle}
              placeholder="Titre du cours"
              placeholderTextColor={THEME_COLORS.placeholder}
              autoFocus
            />

            <View style={styles.typeSelection}>
              <Text style={styles.typeLabel}>Type de cours:</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newCourseType === COURSE_TYPES.COURSE && styles.selectedTypeButton
                  ]}
                  onPress={() => setNewCourseType(COURSE_TYPES.COURSE)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newCourseType === COURSE_TYPES.COURSE && styles.selectedTypeButtonText
                  ]}>
                    Cours
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newCourseType === COURSE_TYPES.SYNTHESIS && styles.selectedTypeButton
                  ]}
                  onPress={() => setNewCourseType(COURSE_TYPES.SYNTHESIS)}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newCourseType === COURSE_TYPES.SYNTHESIS && styles.selectedTypeButtonText
                  ]}>
                    Synthèse
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddCourse(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddCourse}
              >
                <Text style={styles.confirmButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <GradeInput
        visible={showGradeInput}
        onClose={() => setShowGradeInput(false)}
        onSubmit={handleGradeSubmit}
        title={selectedCourse ? `Première note - ${selectedCourse.title}` : 'Première note'}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  ueInfoCard: {
    backgroundColor: THEME_COLORS.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  ueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ueColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  ueInfo: {
    flex: 1,
  },
  ueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
  },
  ueDetails: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginTop: 2,
  },
  examSection: {
    marginBottom: 16,
  },
  examLabel: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 4,
  },
  examDate: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
  },
  examCountdown: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  settingsSection: {
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.text,
  },
  coursesSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
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
  courseCard: {
    backgroundColor: THEME_COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    flex: 1,
  },
  courseType: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
    backgroundColor: THEME_COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  startRevisionButton: {
    backgroundColor: THEME_COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startRevisionButtonText: {
    color: THEME_COLORS.text,
    fontSize: 14,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: THEME_COLORS.modalBackground,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: THEME_COLORS.text,
    backgroundColor: THEME_COLORS.surface,
    marginBottom: 16,
  },
  typeSelection: {
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    backgroundColor: THEME_COLORS.surface,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: THEME_COLORS.accent,
    borderColor: THEME_COLORS.accent,
  },
  typeButtonText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  selectedTypeButtonText: {
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: THEME_COLORS.buttonSecondary,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  confirmButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
  },
  cancelButtonText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UEDetailScreen;