import { PermissionsAndroid, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import { RevisionAlgorithm } from './revisionAlgorithm';
import { GamificationService } from './gamificationService';
import Database from './database';

export class ExportService {
  constructor() {
    this.db = new Database();
    this.algorithm = new RevisionAlgorithm();
    this.gamificationService = new GamificationService();
  }

  async requestStoragePermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permission de stockage',
          message: 'L\'application a besoin d\'accéder au stockage pour exporter vos données',
          buttonNeutral: 'Demander plus tard',
          buttonNegative: 'Annuler',
          buttonPositive: 'OK',
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  async exportToJSON() {
    try {
      await this.db.initDB();
      
      // Récupérer toutes les données
      const ues = await this.db.getActiveUEs();
      const courses = await this.db.getAllActiveCourses();
      const revisions = await this.db.db.executeSql('SELECT * FROM revisions ORDER BY created_at DESC');
      const settings = await this.db.db.executeSql('SELECT * FROM user_settings');
      const gamificationData = await this.db.getGamificationData();
      
      const exportData = {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        app_name: 'Méthode J',
        data: {
          ues: ues,
          courses: courses,
          revisions: revisions[0].rows.raw(),
          settings: settings[0].rows.raw(),
          gamification: gamificationData,
          statistics: await this.gamificationService.calculateStats()
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `methode_j_export_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, jsonString, 'utf8');
      
      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        size: jsonString.length
      };
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportToCSV() {
    try {
      await this.db.initDB();
      
      // Récupérer les données de révision avec détails
      const result = await this.db.db.executeSql(`
        SELECT 
          r.id,
          r.grade,
          r.scheduled_date,
          r.completed_date,
          r.interval_days,
          r.is_completed,
          c.title as course_title,
          c.type as course_type,
          u.name as ue_name,
          u.color as ue_color,
          u.year,
          u.semester,
          u.exam_date
        FROM revisions r
        JOIN courses c ON r.course_id = c.id
        JOIN ue u ON c.ue_id = u.id
        ORDER BY r.scheduled_date DESC
      `);

      const revisions = result[0].rows.raw();
      
      // Créer le contenu CSV
      const csvHeaders = [
        'ID',
        'UE',
        'Cours',
        'Type',
        'Année',
        'Semestre',
        'Date programmée',
        'Date terminée',
        'Note',
        'Intervalle (jours)',
        'Terminé',
        'Date examen'
      ];

      let csvContent = csvHeaders.join(';') + '\n';

      revisions.forEach(revision => {
        const row = [
          revision.id,
          revision.ue_name,
          revision.course_title,
          revision.course_type === 'synthesis' ? 'Synthèse' : 'Cours',
          revision.year,
          revision.semester,
          revision.scheduled_date,
          revision.completed_date || '',
          revision.grade || '',
          revision.interval_days,
          revision.is_completed ? 'Oui' : 'Non',
          revision.exam_date || ''
        ];
        
        csvContent += row.join(';') + '\n';
      });

      const fileName = `methode_j_revisions_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, csvContent, 'utf8');
      
      return {
        success: true,
        filePath: filePath,
        fileName: fileName,
        recordCount: revisions.length
      };
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async importFromJSON(jsonData) {
    try {
      await this.db.initDB();
      
      const parsedData = JSON.parse(jsonData);
      
      if (!parsedData.version || !parsedData.data) {
        throw new Error('Format de données invalide');
      }

      // Vérifier la compatibilité des versions
      if (parsedData.version !== '1.0.0') {
        Alert.alert(
          'Version incompatible',
          'Ce fichier a été créé avec une version différente de l\'application. L\'import pourrait ne pas fonctionner correctement.'
        );
      }

      const { ues, courses, revisions, settings, gamification } = parsedData.data;

      // Sauvegarder les données actuelles avant l'import
      await this.createBackup();

      // Importer les UEs
      if (ues && ues.length > 0) {
        for (const ue of ues) {
          await this.db.createUE(ue);
        }
      }

      // Importer les cours
      if (courses && courses.length > 0) {
        for (const course of courses) {
          await this.db.createCourse(course);
        }
      }

      // Importer les révisions
      if (revisions && revisions.length > 0) {
        for (const revision of revisions) {
          await this.db.createRevision(revision);
        }
      }

      // Importer les paramètres
      if (settings && settings.length > 0) {
        for (const setting of settings) {
          await this.db.updateSetting(setting.key, setting.value);
        }
      }

      // Importer les données de gamification
      if (gamification) {
        await this.db.updateGamificationData(gamification);
      }

      return {
        success: true,
        importedData: {
          ues: ues?.length || 0,
          courses: courses?.length || 0,
          revisions: revisions?.length || 0,
          settings: settings?.length || 0
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createBackup() {
    try {
      const backupData = await this.exportToJSON();
      if (backupData.success) {
        const backupFileName = `methode_j_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const backupPath = `${RNFS.ExternalDirectoryPath}/backups/${backupFileName}`;
        
        // Créer le dossier de sauvegarde s'il n'existe pas
        await RNFS.mkdir(`${RNFS.ExternalDirectoryPath}/backups`);
        
        const originalContent = await RNFS.readFile(backupData.filePath, 'utf8');
        await RNFS.writeFile(backupPath, originalContent, 'utf8');
        
        return {
          success: true,
          backupPath: backupPath
        };
      }
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async scheduleAutoBackup() {
    try {
      const lastBackup = await this.db.getSetting('last_backup_date');
      const backupFrequency = await this.db.getSetting('auto_backup_frequency') || '7';
      const today = new Date().toISOString().split('T')[0];
      
      if (!lastBackup) {
        await this.createAutoBackup();
        return;
      }

      const lastBackupDate = new Date(lastBackup);
      const daysSinceBackup = Math.floor((new Date() - lastBackupDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceBackup >= parseInt(backupFrequency)) {
        await this.createAutoBackup();
      }
    } catch (error) {
      console.error('Erreur lors de la planification de la sauvegarde automatique:', error);
    }
  }

  async createAutoBackup() {
    try {
      const backupResult = await this.exportToJSON();
      if (backupResult.success) {
        const autoBackupPath = `${RNFS.ExternalDirectoryPath}/auto_backups/`;
        await RNFS.mkdir(autoBackupPath);
        
        const fileName = `auto_backup_${new Date().toISOString().split('T')[0]}.json`;
        const content = await RNFS.readFile(backupResult.filePath, 'utf8');
        await RNFS.writeFile(autoBackupPath + fileName, content, 'utf8');
        
        // Nettoyer les anciennes sauvegardes (garder seulement les 5 dernières)
        await this.cleanupOldBackups(autoBackupPath);
        
        // Mettre à jour la date de dernière sauvegarde
        await this.db.updateSetting('last_backup_date', new Date().toISOString().split('T')[0]);
        
        console.log('Sauvegarde automatique créée avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde automatique:', error);
    }
  }

  async cleanupOldBackups(backupPath) {
    try {
      const files = await RNFS.readDir(backupPath);
      const backupFiles = files
        .filter(file => file.name.startsWith('auto_backup_'))
        .sort((a, b) => b.mtime - a.mtime);
      
      // Supprimer les fichiers au-delà des 5 plus récents
      for (let i = 5; i < backupFiles.length; i++) {
        await RNFS.unlink(backupFiles[i].path);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des sauvegardes:', error);
    }
  }

  async getExportStats() {
    try {
      await this.db.initDB();
      
      const stats = await this.gamificationService.calculateStats();
      const ues = await this.db.getActiveUEs();
      const courses = await this.db.getAllActiveCourses();
      
      return {
        totalUEs: ues.length,
        totalCourses: courses.length,
        totalRevisions: stats.totalRevisions,
        currentStreak: stats.streak,
        totalPoints: stats.totalPoints,
        lastBackup: await this.db.getSetting('last_backup_date')
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques d\'export:', error);
      return null;
    }
  }

  async validateImportFile(filePath) {
    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        info: {}
      };

      // Vérifier la structure de base
      if (!data.version) {
        validation.errors.push('Version manquante dans le fichier');
        validation.isValid = false;
      }

      if (!data.data) {
        validation.errors.push('Données manquantes dans le fichier');
        validation.isValid = false;
      }

      if (data.version !== '1.0.0') {
        validation.warnings.push(`Version ${data.version} différente de la version actuelle (1.0.0)`);
      }

      // Informations sur le contenu
      if (data.data) {
        validation.info = {
          ues: data.data.ues?.length || 0,
          courses: data.data.courses?.length || 0,
          revisions: data.data.revisions?.length || 0,
          exportDate: data.exported_at
        };
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [`Erreur lors de la validation: ${error.message}`],
        warnings: [],
        info: {}
      };
    }
  }

  async shareExportFile(filePath) {
    try {
      const Share = require('react-native-share');
      
      const shareOptions = {
        title: 'Partager les données Méthode J',
        url: `file://${filePath}`,
        type: 'application/json',
      };

      await Share.open(shareOptions);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      return { success: false, error: error.message };
    }
  }
}