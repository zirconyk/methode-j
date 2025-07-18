import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { THEME_COLORS } from '../constants/colors';
import Database from '../services/database';
import { ExportService } from '../services/exportService';
import { NotificationService } from '../services/notificationService';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    elimination_threshold: '9',
    base_threshold: '12',
    notification_time: '07:30',
    max_daily_revisions: '8',
    auto_backup_frequency: '7'
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStats, setExportStats] = useState(null);

  const db = new Database();
  const exportService = new ExportService();
  const notificationService = new NotificationService();

  useEffect(() => {
    loadSettings();
    loadExportStats();
  }, []);

  const loadSettings = async () => {
    try {
      await db.initDB();
      
      const eliminationThreshold = await db.getSetting('elimination_threshold');
      const baseThreshold = await db.getSetting('base_threshold');
      const notificationTime = await db.getSetting('notification_time');
      const maxDailyRevisions = await db.getSetting('max_daily_revisions');
      const autoBackupFrequency = await db.getSetting('auto_backup_frequency');

      setSettings({
        elimination_threshold: eliminationThreshold || '9',
        base_threshold: baseThreshold || '12',
        notification_time: notificationTime || '07:30',
        max_daily_revisions: maxDailyRevisions || '8',
        auto_backup_frequency: autoBackupFrequency || '7'
      });
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const loadExportStats = async () => {
    try {
      const stats = await exportService.getExportStats();
      setExportStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques d\'export:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await db.updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Actions spécifiques selon le paramètre
      if (key === 'notification_time') {
        notificationService.updateDailyReminderTime(value);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le paramètre');
    }
  };

  const handleExportJSON = async () => {
    try {
      const result = await exportService.exportToJSON();
      if (result.success) {
        Alert.alert(
          'Export réussi',
          `Données exportées vers:\n${result.fileName}\n\nTaille: ${Math.round(result.size / 1024)} Ko`,
          [
            { text: 'OK' },
            { text: 'Partager', onPress: () => exportService.shareExportFile(result.filePath) }
          ]
        );
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    }
  };

  const handleExportCSV = async () => {
    try {
      const result = await exportService.exportToCSV();
      if (result.success) {
        Alert.alert(
          'Export réussi',
          `${result.recordCount} révisions exportées vers:\n${result.fileName}`,
          [
            { text: 'OK' },
            { text: 'Partager', onPress: () => exportService.shareExportFile(result.filePath) }
          ]
        );
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      'Réinitialiser l\'application',
      'Cette action supprimera toutes vos données (UE, révisions, statistiques). Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              // Créer une sauvegarde avant la réinitialisation
              await exportService.createBackup();
              
              // Réinitialiser les données
              await db.db.executeSql('DELETE FROM revisions');
              await db.db.executeSql('DELETE FROM courses');
              await db.db.executeSql('DELETE FROM ue');
              await db.db.executeSql('UPDATE gamification SET user_points = 0, streak_days = 0, badges = "[]", achievements = "[]"');
              
              Alert.alert('Réinitialisation terminée', 'L\'application a été réinitialisée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réinitialiser l\'application');
            }
          }
        }
      ]
    );
  };

  const renderSettingItem = (label, value, onPress, rightComponent) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  const renderInputModal = (title, currentValue, onSave, keyboardType = 'default') => (
    <Modal
      visible={false}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.modalInput}
            value={currentValue}
            onChangeText={onSave}
            keyboardType={keyboardType}
            autoFocus
          />
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {}}
          >
            <Text style={styles.modalButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Paramètres de révision */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres de révision</Text>
        
        {renderSettingItem(
          'Seuil d\'élimination',
          `${settings.elimination_threshold}/20`,
          () => {
            Alert.prompt(
              'Seuil d\'élimination',
              'Note en dessous de laquelle les révisions sont intensifiées',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: (value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num >= 0 && num <= 20) {
                      updateSetting('elimination_threshold', value);
                    } else {
                      Alert.alert('Erreur', 'Veuillez entrer une note entre 0 et 20');
                    }
                  }
                }
              ],
              'plain-text',
              settings.elimination_threshold
            );
          }
        )}

        {renderSettingItem(
          'Seuil de base',
          `${settings.base_threshold}/20`,
          () => {
            Alert.prompt(
              'Seuil de base',
              'Note de référence pour le calcul des intervalles',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: (value) => {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num >= 0 && num <= 20) {
                      updateSetting('base_threshold', value);
                    } else {
                      Alert.alert('Erreur', 'Veuillez entrer une note entre 0 et 20');
                    }
                  }
                }
              ],
              'plain-text',
              settings.base_threshold
            );
          }
        )}

        {renderSettingItem(
          'Révisions max par jour',
          settings.max_daily_revisions,
          () => {
            Alert.prompt(
              'Révisions maximum par jour',
              'Nombre maximum de révisions à programmer par jour',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num >= 1 && num <= 20) {
                      updateSetting('max_daily_revisions', value);
                    } else {
                      Alert.alert('Erreur', 'Veuillez entrer un nombre entre 1 et 20');
                    }
                  }
                }
              ],
              'numeric',
              settings.max_daily_revisions
            );
          }
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        {renderSettingItem(
          'Notifications quotidiennes',
          '',
          () => setNotificationsEnabled(!notificationsEnabled),
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: THEME_COLORS.disabled, true: THEME_COLORS.accent }}
            thumbColor={notificationsEnabled ? THEME_COLORS.text : THEME_COLORS.textSecondary}
          />
        )}

        {renderSettingItem(
          'Heure de notification',
          settings.notification_time,
          () => {
            Alert.prompt(
              'Heure de notification',
              'Format: HH:MM (ex: 07:30)',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: (value) => {
                    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                      updateSetting('notification_time', value);
                    } else {
                      Alert.alert('Erreur', 'Format invalide. Utilisez HH:MM');
                    }
                  }
                }
              ],
              'default',
              settings.notification_time
            );
          }
        )}
      </View>

      {/* Sauvegarde et export */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sauvegarde et export</Text>
        
        {renderSettingItem(
          'Fréquence sauvegarde auto',
          `${settings.auto_backup_frequency} jours`,
          () => {
            Alert.prompt(
              'Fréquence de sauvegarde automatique',
              'Nombre de jours entre les sauvegardes automatiques',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num >= 1 && num <= 30) {
                      updateSetting('auto_backup_frequency', value);
                    } else {
                      Alert.alert('Erreur', 'Veuillez entrer un nombre entre 1 et 30');
                    }
                  }
                }
              ],
              'numeric',
              settings.auto_backup_frequency
            );
          }
        )}

        {renderSettingItem(
          'Exporter les données',
          exportStats?.lastBackup ? `Dernière sauvegarde: ${new Date(exportStats.lastBackup).toLocaleDateString('fr-FR')}` : 'Jamais sauvegardé',
          () => setShowExportModal(true)
        )}
      </View>

      {/* Informations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        
        {exportStats && (
          <>
            {renderSettingItem('UE actives', exportStats.totalUEs.toString())}
            {renderSettingItem('Cours créés', exportStats.totalCourses.toString())}
            {renderSettingItem('Révisions totales', exportStats.totalRevisions.toString())}
            {renderSettingItem('Streak actuel', `${exportStats.currentStreak} jours`)}
            {renderSettingItem('Points totaux', exportStats.totalPoints.toString())}
          </>
        )}
        
        {renderSettingItem('Version', '1.0.0')}
      </View>

      {/* Actions dangereuses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions avancées</Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={handleResetApp}>
          <Text style={styles.dangerButtonText}>Réinitialiser l'application</Text>
        </TouchableOpacity>
      </View>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exporter les données</Text>
            
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                setShowExportModal(false);
                handleExportJSON();
              }}
            >
              <Text style={styles.exportButtonText}>Exporter en JSON</Text>
              <Text style={styles.exportButtonSubtext}>
                Format complet avec toutes les données
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                setShowExportModal(false);
                handleExportCSV();
              }}
            >
              <Text style={styles.exportButtonText}>Exporter en CSV</Text>
              <Text style={styles.exportButtonSubtext}>
                Tableau Excel des révisions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  section: {
    margin: 16,
    backgroundColor: THEME_COLORS.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: THEME_COLORS.text,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  dangerButton: {
    backgroundColor: THEME_COLORS.error,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
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
  modalButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: THEME_COLORS.surface,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: 4,
  },
  exportButtonSubtext: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  cancelButton: {
    backgroundColor: THEME_COLORS.buttonSecondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;