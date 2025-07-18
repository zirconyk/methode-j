import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { THEME_COLORS } from './constants/colors';
import { NotificationService } from './services/notificationService';
import { ExportService } from './services/exportService';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import CalendarScreen from './screens/CalendarScreen';
import UEListScreen from './screens/UEListScreen';
import AddUEScreen from './screens/AddUEScreen';
import UEDetailScreen from './screens/UEDetailScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import SettingsScreen from './screens/SettingsScreen';
import BadgesScreen from './screens/BadgesScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialiser les services
      const notificationService = new NotificationService();
      const exportService = new ExportService();
      
      // Programmer les notifications quotidiennes
      await notificationService.scheduleDailyReminder();
      
      // Planifier les sauvegardes automatiques
      await exportService.scheduleAutoBackup();
      
      console.log('Application initialisée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'application:', error);
    }
  };

  const screenOptions = {
    headerStyle: {
      backgroundColor: THEME_COLORS.primary,
    },
    headerTintColor: THEME_COLORS.text,
    headerTitleStyle: {
      fontWeight: 'bold',
    },
    contentStyle: {
      backgroundColor: THEME_COLORS.background,
    },
  };

  return (
    <NavigationContainer>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME_COLORS.primary}
      />
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={screenOptions}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Méthode J',
            headerStyle: {
              backgroundColor: THEME_COLORS.primary,
            },
          }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            title: 'Calendrier',
          }}
        />
        <Stack.Screen
          name="UEList"
          component={UEListScreen}
          options={{
            title: 'Mes UE',
          }}
        />
        <Stack.Screen
          name="AddUE"
          component={AddUEScreen}
          options={{
            title: 'Nouvelle UE',
          }}
        />
        <Stack.Screen
          name="UEDetail"
          component={UEDetailScreen}
          options={{
            title: 'Détails UE',
          }}
        />
        <Stack.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            title: 'Statistiques',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Paramètres',
          }}
        />
        <Stack.Screen
          name="Badges"
          component={BadgesScreen}
          options={{
            title: 'Mes badges',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;