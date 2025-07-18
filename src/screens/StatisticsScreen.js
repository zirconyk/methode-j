import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { THEME_COLORS } from '../constants/colors';
import { GamificationService } from '../services/gamificationService';
import { BadgeGrid } from '../components/BadgeDisplay';
import ProgressBar from '../components/ProgressBar';

const StatisticsScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);
  const [gamificationData, setGamificationData] = useState(null);

  const gamificationService = new GamificationService();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const statisticsData = await gamificationService.calculateStats();
      const gameData = await gamificationService.exportGamificationData();
      
      setStats(statisticsData);
      setGamificationData(gameData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundGradientFrom: THEME_COLORS.surface,
    backgroundGradientTo: THEME_COLORS.surface,
    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['week', 'month', 'semester', 'year'].map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.selectedPeriodButton
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.selectedPeriodButtonText
          ]}>
            {period === 'week' ? 'Semaine' : 
             period === 'month' ? 'Mois' :
             period === 'semester' ? 'Semestre' : 'Année'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewCards = () => {
    if (!stats) return null;

    return (
      <View style={styles.overviewCards}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalRevisions}</Text>
          <Text style={styles.statLabel}>Révisions totales</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Jours de suite</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.averageGrade}</Text>
          <Text style={styles.statLabel}>Note moyenne</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.currentLevel}</Text>
          <Text style={styles.statLabel}>Niveau actuel</Text>
        </View>
      </View>
    );
  };

  const renderGradeDistribution = () => {
    if (!stats || !stats.gradeDistribution) return null;

    const data = [
      {
        name: 'Excellent (16-20)',
        population: stats.gradeDistribution.excellent,
        color: THEME_COLORS.gradeExcellent,
        legendFontColor: THEME_COLORS.text,
        legendFontSize: 12,
      },
      {
        name: 'Bien (13-15)',
        population: stats.gradeDistribution.good,
        color: THEME_COLORS.gradeGood,
        legendFontColor: THEME_COLORS.text,
        legendFontSize: 12,
      },
      {
        name: 'Moyen (10-12)',
        population: stats.gradeDistribution.average,
        color: THEME_COLORS.gradeAverage,
        legendFontColor: THEME_COLORS.text,
        legendFontSize: 12,
      },
      {
        name: 'Faible (0-9)',
        population: stats.gradeDistribution.poor + stats.gradeDistribution.veryPoor,
        color: THEME_COLORS.gradePoor,
        legendFontColor: THEME_COLORS.text,
        legendFontSize: 12,
      },
    ].filter(item => item.population > 0);

    if (data.length === 0) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribution des notes</Text>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderProgressChart = () => {
    if (!stats) return null;

    const data = {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      datasets: [
        {
          data: [3, 5, 2, 4, 6, 3, 4], // Données d'exemple
          color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Révisions cette semaine</Text>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderLevelProgress = () => {
    if (!stats || !stats.nextLevelProgress) return null;

    return (
      <View style={styles.levelContainer}>
        <Text style={styles.levelTitle}>Progression niveau {stats.currentLevel}</Text>
        <ProgressBar
          progress={stats.nextLevelProgress.current}
          total={stats.nextLevelProgress.required}
          label={`${stats.nextLevelProgress.current}/${stats.nextLevelProgress.required} points`}
          showPercentage={true}
          animated={true}
        />
      </View>
    );
  };

  const renderBadges = () => {
    if (!gamificationData?.gamification?.badges) return null;

    const badges = JSON.parse(gamificationData.gamification.badges);
    
    if (badges.length === 0) return null;

    return (
      <View style={styles.badgesContainer}>
        <Text style={styles.badgesTitle}>Mes badges ({badges.length})</Text>
        <BadgeGrid 
          badges={badges} 
          onBadgePress={(badge) => {
            navigation.navigate('Badges');
          }}
        />
      </View>
    );
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderPeriodSelector()}
      {renderOverviewCards()}
      {renderLevelProgress()}
      {renderProgressChart()}
      {renderGradeDistribution()}
      {renderBadges()}

      <View style={styles.detailsContainer}>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => navigation.navigate('Badges')}
        >
          <Text style={styles.detailButtonText}>Voir tous mes badges</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: THEME_COLORS.textSecondary,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: THEME_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: THEME_COLORS.card,
  },
  selectedPeriodButton: {
    backgroundColor: THEME_COLORS.accent,
  },
  periodButtonText: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
  },
  selectedPeriodButtonText: {
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
  overviewCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  statCard: {
    backgroundColor: THEME_COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    elevation: 2,
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
  levelContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: THEME_COLORS.card,
    borderRadius: 12,
    elevation: 2,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: THEME_COLORS.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  badgesContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: THEME_COLORS.card,
    borderRadius: 12,
    elevation: 2,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  detailButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  detailButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatisticsScreen;