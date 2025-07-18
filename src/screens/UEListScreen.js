import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { THEME_COLORS } from '../constants/colors';
import { SEMESTERS, YEARS } from '../constants';
import Database from '../services/database';

const UEListScreen = ({ navigation }) => {
  const [ues, setUEs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const db = new Database();

  useEffect(() => {
    loadUEs();
  }, []);

  const loadUEs = async () => {
    try {
      await db.initDB();
      const uesList = await db.getActiveUEs();
      setUEs(uesList);
    } catch (error) {
      console.error('Erreur lors du chargement des UE:', error);
      Alert.alert('Erreur', 'Impossible de charger les UE');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUEs();
    setRefreshing(false);
  };

  const handleUEPress = (ue) => {
    navigation.navigate('UEDetail', { ue });
  };

  const handleDeleteUE = async (ue) => {
    Alert.alert(
      'Supprimer l\'UE',
      `Êtes-vous sûr de vouloir supprimer "${ue.name}" ?\n\nCette action désactivera l'UE et toutes ses révisions.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deactivateUE(ue.id);
              await loadUEs();
              Alert.alert('Succès', 'UE supprimée avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'UE');
            }
          }
        }
      ]
    );
  };

  const getFilteredUEs = () => {
    return ues.filter(ue => {
      const semesterMatch = selectedSemester === 'all' || ue.semester === selectedSemester;
      const yearMatch = selectedYear === 'all' || ue.year === selectedYear;
      return semesterMatch && yearMatch;
    });
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

  const getExamStatus = (examDate) => {
    if (!examDate) return { text: 'Non définie', color: THEME_COLORS.textMuted };
    
    const exam = new Date(examDate);
    const today = new Date();
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Passé', color: THEME_COLORS.textMuted };
    if (diffDays === 0) return { text: 'Aujourd\'hui', color: THEME_COLORS.error };
    if (diffDays === 1) return { text: 'Demain', color: THEME_COLORS.warning };
    if (diffDays <= 7) return { text: `Dans ${diffDays} jours`, color: THEME_COLORS.warning };
    return { text: `Dans ${diffDays} jours`, color: THEME_COLORS.textSecondary };
  };

  const renderUEItem = ({ item: ue }) => {
    const examStatus = getExamStatus(ue.exam_date);
    
    return (
      <TouchableOpacity
        style={styles.ueCard}
        onPress={() => handleUEPress(ue)}
        onLongPress={() => handleDeleteUE(ue)}
      >
        <View style={styles.ueHeader}>
          <View style={styles.ueInfo}>
            <View style={[styles.ueColorIndicator, { backgroundColor: ue.color }]} />
            <View style={styles.ueTextInfo}>
              <Text style={styles.ueName}>{ue.name}</Text>
              <Text style={styles.ueDetails}>
                {ue.year} • {ue.semester === 'autumn' ? 'Automne' : 'Printemps'}
              </Text>
            </View>
          </View>
          <View style={styles.ueActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('UEDetail', { ue })}
            >
              <Text style={styles.actionButtonText}>Voir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.ueBody}>
          <View style={styles.examInfo}>
            <Text style={styles.examLabel}>Examen:</Text>
            <Text style={[styles.examDate, { color: examStatus.color }]}>
              {examStatus.text}
            </Text>
          </View>
          
          <View style={styles.ueFeatures}>
            {ue.cc_mode === 1 && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>CC</Text>
              </View>
            )}
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeText}>
                Révision J-{ue.pre_exam_period || 7}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.ueFooter}>
          <Text style={styles.ueFooterText}>
            Appuyez longuement pour supprimer
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (value, label, type) => {
    const isSelected = type === 'semester' ? selectedSemester === value : selectedYear === value;
    
    return (
      <TouchableOpacity
        style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
        onPress={() => {
          if (type === 'semester') {
            setSelectedSemester(value);
          } else {
            setSelectedYear(value);
          }
        }}
      >
        <Text style={[
          styles.filterButtonText,
          isSelected && styles.filterButtonTextSelected
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const filteredUEs = getFilteredUEs();

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Semestre:</Text>
        <View style={styles.filterRow}>
          {renderFilterButton('all', 'Tous', 'semester')}
          {renderFilterButton('autumn', 'Automne', 'semester')}
          {renderFilterButton('spring', 'Printemps', 'semester')}
        </View>
        
        <Text style={styles.filterTitle}>Année:</Text>
        <View style={styles.filterRow}>
          {renderFilterButton('all', 'Toutes', 'year')}
          {YEARS.map(year => renderFilterButton(year, year, 'year'))}
        </View>
      </View>

      {/* UE List */}
      <FlatList
        data={filteredUEs}
        renderItem={renderUEItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {ues.length === 0 
                ? 'Aucune UE créée pour le moment'
                : 'Aucune UE ne correspond aux filtres sélectionnés'
              }
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AddUE')}
            >
              <Text style={styles.emptyStateButtonText}>
                Créer une UE
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddUE')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: THEME_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME_COLORS.card,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  filterButtonSelected: {
    backgroundColor: THEME_COLORS.accent,
    borderColor: THEME_COLORS.accent,
  },
  filterButtonText: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
  },
  filterButtonTextSelected: {
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  ueCard: {
    backgroundColor: THEME_COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ueHeader: {
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
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  ueTextInfo: {
    flex: 1,
  },
  ueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 2,
  },
  ueDetails: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  ueActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: THEME_COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: THEME_COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  ueBody: {
    marginBottom: 12,
  },
  examInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  examLabel: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  examDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  ueFeatures: {
    flexDirection: 'row',
    gap: 8,
  },
  featureBadge: {
    backgroundColor: THEME_COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureBadgeText: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
  },
  ueFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.border,
  },
  ueFooterText: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME_COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: THEME_COLORS.text,
    fontWeight: 'bold',
  },
});

export default UEListScreen;