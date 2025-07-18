import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { THEME_COLORS } from '../constants/colors';
import { BADGES } from '../constants';
import { BadgeDisplay } from '../components/BadgeDisplay';
import { GamificationService } from '../services/gamificationService';

const BadgesScreen = ({ navigation }) => {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeDetail, setShowBadgeDetail] = useState(false);
  const [stats, setStats] = useState(null);

  const gamificationService = new GamificationService();

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const gameData = await gamificationService.exportGamificationData();
      const statisticsData = await gamificationService.calculateStats();
      
      if (gameData?.gamification?.badges) {
        const badges = JSON.parse(gameData.gamification.badges);
        setUnlockedBadges(badges);
      }
      
      setStats(statisticsData);
    } catch (error) {
      console.error('Erreur lors du chargement des badges:', error);
    }
  };

  const handleBadgePress = (badge) => {
    setSelectedBadge(badge);
    setShowBadgeDetail(true);
  };

  const getBadgeProgress = (badgeId) => {
    if (!stats) return { current: 0, required: 1, percentage: 0 };

    switch (badgeId) {
      case 'STREAK_7':
        return {
          current: Math.min(stats.streak, 7),
          required: 7,
          percentage: (Math.min(stats.streak, 7) / 7) * 100
        };
      case 'STREAK_30':
        return {
          current: Math.min(stats.streak, 30),
          required: 30,
          percentage: (Math.min(stats.streak, 30) / 30) * 100
        };
      case 'STREAK_100':
        return {
          current: Math.min(stats.streak, 100),
          required: 100,
          percentage: (Math.min(stats.streak, 100) / 100) * 100
        };
      case 'PERFECT_SCORE':
        return {
          current: Math.min(stats.perfectScores, 1),
          required: 1,
          percentage: (Math.min(stats.perfectScores, 1) / 1) * 100
        };
      case 'PERFECTIONIST':
        return {
          current: Math.min(stats.perfectScores, 10),
          required: 10,
          percentage: (Math.min(stats.perfectScores, 10) / 10) * 100
        };
      case 'DEDICATED':
        return {
          current: Math.min(stats.totalRevisions, 50),
          required: 50,
          percentage: (Math.min(stats.totalRevisions, 50) / 50) * 100
        };
      case 'SCHOLAR':
        return {
          current: Math.min(stats.totalRevisions, 200),
          required: 200,
          percentage: (Math.min(stats.totalRevisions, 200) / 200) * 100
        };
      case 'IMPROVER':
        return {
          current: Math.min(stats.averageImprovement, 3),
          required: 3,
          percentage: (Math.min(stats.averageImprovement, 3) / 3) * 100
        };
      case 'EXCELLENCE':
        return {
          current: Math.min(stats.averageImprovement, 5),
          required: 5,
          percentage: (Math.min(stats.averageImprovement, 5) / 5) * 100
        };
      default:
        return { current: 0, required: 1, percentage: 0 };
    }
  };

  const renderBadgeItem = (badgeId, isUnlocked) => {
    const badge = BADGES[badgeId];
    const progress = getBadgeProgress(badgeId);
    
    return (
      <TouchableOpacity
        key={badgeId}
        style={[
          styles.badgeItem,
          !isUnlocked && styles.lockedBadgeItem
        ]}
        onPress={() => handleBadgePress(badge)}
      >
        <View style={styles.badgeContent}>
          <BadgeDisplay
            badgeId={badgeId}
            size="medium"
            onPress={() => handleBadgePress(badge)}
          />
          
          <View style={styles.badgeInfo}>
            <Text style={[
              styles.badgeName,
              !isUnlocked && styles.lockedBadgeName
            ]}>
              {badge.name}
            </Text>
            <Text style={[
              styles.badgeDescription,
              !isUnlocked && styles.lockedBadgeDescription
            ]}>
              {badge.description}
            </Text>
            
            {!isUnlocked && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${progress.percentage}%` }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {progress.current}/{progress.required}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {isUnlocked && (
          <View style={styles.unlockedIndicator}>
            <Text style={styles.unlockedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBadgeCategories = () => {
    const categories = {
      'Régularité': ['STREAK_7', 'STREAK_30', 'STREAK_100'],
      'Performance': ['PERFECT_SCORE', 'PERFECTIONIST', 'EXCELLENCE'],
      'Persévérance': ['DEDICATED', 'SCHOLAR', 'IMPROVER'],
    };

    return Object.entries(categories).map(([categoryName, badgeIds]) => (
      <View key={categoryName} style={styles.category}>
        <Text style={styles.categoryTitle}>{categoryName}</Text>
        {badgeIds.map(badgeId => 
          renderBadgeItem(badgeId, unlockedBadges.includes(badgeId))
        )}
      </View>
    ));
  };

  const renderBadgeDetail = () => {
    if (!selectedBadge) return null;

    const isUnlocked = unlockedBadges.includes(selectedBadge.id);
    const progress = getBadgeProgress(selectedBadge.id);

    return (
      <Modal
        visible={showBadgeDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBadgeDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.badgeDetailHeader}>
              <BadgeDisplay
                badgeId={selectedBadge.id}
                size="large"
              />
              <Text style={styles.badgeDetailName}>{selectedBadge.name}</Text>
              <Text style={styles.badgeDetailDescription}>
                {selectedBadge.description}
              </Text>
            </View>

            <View style={styles.badgeDetailBody}>
              {isUnlocked ? (
                <View style={styles.unlockedStatus}>
                  <Text style={styles.unlockedStatusText}>
                    ✓ Badge débloqué!
                  </Text>
                  <Text style={styles.unlockedStatusSubtext}>
                    Félicitations pour cet accomplissement!
                  </Text>
                </View>
              ) : (
                <View style={styles.lockedStatus}>
                  <Text style={styles.lockedStatusText}>
                    Badge non débloqué
                  </Text>
                  <Text style={styles.lockedStatusSubtext}>
                    Progression: {progress.current}/{progress.required}
                  </Text>
                  <View style={styles.detailProgressContainer}>
                    <View style={styles.detailProgressBar}>
                      <View style={[
                        styles.detailProgressFill,
                        { width: `${progress.percentage}%` }
                      ]} />
                    </View>
                    <Text style={styles.detailProgressText}>
                      {Math.round(progress.percentage)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBadgeDetail(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const unlockedCount = unlockedBadges.length;
  const totalCount = Object.keys(BADGES).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes badges</Text>
        <Text style={styles.headerSubtitle}>
          {unlockedCount}/{totalCount} badges débloqués
        </Text>
        <View style={styles.overallProgressContainer}>
          <View style={styles.overallProgressBar}>
            <View style={[
              styles.overallProgressFill,
              { width: `${(unlockedCount / totalCount) * 100}%` }
            ]} />
          </View>
          <Text style={styles.overallProgressText}>
            {Math.round((unlockedCount / totalCount) * 100)}%
          </Text>
        </View>
      </View>

      {renderBadgeCategories()}

      {renderBadgeDetail()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: THEME_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    marginBottom: 16,
  },
  overallProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overallProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: THEME_COLORS.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.progressFill,
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.accent,
  },
  category: {
    margin: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 16,
  },
  badgeItem: {
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
  lockedBadgeItem: {
    opacity: 0.7,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 4,
  },
  lockedBadgeName: {
    color: THEME_COLORS.textSecondary,
  },
  badgeDescription: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginBottom: 8,
  },
  lockedBadgeDescription: {
    color: THEME_COLORS.textMuted,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: THEME_COLORS.progressBackground,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.progressFill,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
    textAlign: 'right',
  },
  unlockedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: THEME_COLORS.success,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
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
    elevation: 10,
  },
  badgeDetailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  badgeDetailDescription: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
    textAlign: 'center',
  },
  badgeDetailBody: {
    marginBottom: 20,
  },
  unlockedStatus: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: THEME_COLORS.success,
    borderRadius: 12,
  },
  unlockedStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 4,
  },
  unlockedStatusSubtext: {
    fontSize: 14,
    color: THEME_COLORS.text,
    textAlign: 'center',
  },
  lockedStatus: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: THEME_COLORS.surface,
    borderRadius: 12,
  },
  lockedStatusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.textSecondary,
    marginBottom: 4,
  },
  lockedStatusSubtext: {
    fontSize: 14,
    color: THEME_COLORS.textMuted,
    marginBottom: 12,
  },
  detailProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  detailProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: THEME_COLORS.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  detailProgressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.progressFill,
    borderRadius: 4,
  },
  detailProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.accent,
  },
  closeButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BadgesScreen;