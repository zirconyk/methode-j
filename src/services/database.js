import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'MethodeJ.db';
const database_version = '1.0';
const database_displayname = 'Méthode J Database';
const database_size = 200000;

export default class Database {
  constructor() {
    this.db = null;
  }

  async initDB() {
    try {
      this.db = await SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size
      );
      
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  async createTables() {
    try {
      // Table des UE
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS ue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          year TEXT NOT NULL,
          semester TEXT NOT NULL,
          exam_date TEXT,
          pre_exam_period INTEGER DEFAULT 7,
          cc_mode BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table des cours
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ue_id INTEGER,
          title TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'course',
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ue_id) REFERENCES ue (id)
        )
      `);

      // Table des révisions
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS revisions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER,
          grade REAL NOT NULL,
          scheduled_date TEXT NOT NULL,
          completed_date TEXT,
          interval_days INTEGER NOT NULL,
          is_completed BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses (id)
        )
      `);

      // Table des paramètres utilisateur
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table de gamification
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS gamification (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_points INTEGER DEFAULT 0,
          streak_days INTEGER DEFAULT 0,
          last_activity_date TEXT,
          badges TEXT DEFAULT '[]',
          achievements TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Initialiser les paramètres par défaut
      await this.initializeDefaultSettings();
      await this.initializeGamification();
      
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async initializeDefaultSettings() {
    try {
      const defaultSettings = [
        { key: 'elimination_threshold', value: '9' },
        { key: 'base_threshold', value: '12' },
        { key: 'notification_time', value: '07:30' },
        { key: 'max_daily_revisions', value: '8' }
      ];

      for (const setting of defaultSettings) {
        await this.db.executeSql(
          'INSERT OR IGNORE INTO user_settings (key, value) VALUES (?, ?)',
          [setting.key, setting.value]
        );
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }

  async initializeGamification() {
    try {
      await this.db.executeSql(
        'INSERT OR IGNORE INTO gamification (id, user_points, streak_days) VALUES (1, 0, 0)'
      );
    } catch (error) {
      console.error('Error initializing gamification:', error);
    }
  }

  // Méthodes CRUD pour UE
  async createUE(ue) {
    try {
      const result = await this.db.executeSql(
        'INSERT INTO ue (name, color, year, semester, exam_date, pre_exam_period, cc_mode) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ue.name, ue.color, ue.year, ue.semester, ue.exam_date, ue.pre_exam_period, ue.cc_mode]
      );
      return result[0].insertId;
    } catch (error) {
      console.error('Error creating UE:', error);
      throw error;
    }
  }

  async getActiveUEs() {
    try {
      const result = await this.db.executeSql(
        'SELECT * FROM ue WHERE is_active = 1 ORDER BY name'
      );
      return result[0].rows.raw();
    } catch (error) {
      console.error('Error getting UEs:', error);
      return [];
    }
  }

  async updateUE(id, ue) {
    try {
      await this.db.executeSql(
        'UPDATE ue SET name = ?, color = ?, year = ?, semester = ?, exam_date = ?, pre_exam_period = ?, cc_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [ue.name, ue.color, ue.year, ue.semester, ue.exam_date, ue.pre_exam_period, ue.cc_mode, id]
      );
    } catch (error) {
      console.error('Error updating UE:', error);
      throw error;
    }
  }

  async deactivateUE(id) {
    try {
      await this.db.executeSql(
        'UPDATE ue SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deactivating UE:', error);
      throw error;
    }
  }

  // Méthodes CRUD pour cours
  async createCourse(course) {
    try {
      const result = await this.db.executeSql(
        'INSERT INTO courses (ue_id, title, type) VALUES (?, ?, ?)',
        [course.ue_id, course.title, course.type]
      );
      return result[0].insertId;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async getCoursesByUE(ue_id) {
    try {
      const result = await this.db.executeSql(
        'SELECT * FROM courses WHERE ue_id = ? AND is_active = 1 ORDER BY title',
        [ue_id]
      );
      return result[0].rows.raw();
    } catch (error) {
      console.error('Error getting courses:', error);
      return [];
    }
  }

  async getAllActiveCourses() {
    try {
      const result = await this.db.executeSql(`
        SELECT c.*, u.name as ue_name, u.color as ue_color 
        FROM courses c 
        JOIN ue u ON c.ue_id = u.id 
        WHERE c.is_active = 1 AND u.is_active = 1 
        ORDER BY u.name, c.title
      `);
      return result[0].rows.raw();
    } catch (error) {
      console.error('Error getting all courses:', error);
      return [];
    }
  }

  // Méthodes CRUD pour révisions
  async createRevision(revision) {
    try {
      const result = await this.db.executeSql(
        'INSERT INTO revisions (course_id, grade, scheduled_date, interval_days) VALUES (?, ?, ?, ?)',
        [revision.course_id, revision.grade, revision.scheduled_date, revision.interval_days]
      );
      return result[0].insertId;
    } catch (error) {
      console.error('Error creating revision:', error);
      throw error;
    }
  }

  async getTodayRevisions() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await this.db.executeSql(`
        SELECT r.*, c.title as course_title, c.type as course_type, 
               u.name as ue_name, u.color as ue_color
        FROM revisions r
        JOIN courses c ON r.course_id = c.id
        JOIN ue u ON c.ue_id = u.id
        WHERE r.scheduled_date <= ? AND r.is_completed = 0
        AND c.is_active = 1 AND u.is_active = 1
        ORDER BY r.grade ASC, r.scheduled_date ASC
      `, [today]);
      return result[0].rows.raw();
    } catch (error) {
      console.error('Error getting today revisions:', error);
      return [];
    }
  }

  async completeRevision(revisionId, newGrade) {
    try {
      const today = new Date().toISOString().split('T')[0];
      await this.db.executeSql(
        'UPDATE revisions SET is_completed = 1, grade = ?, completed_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newGrade, today, revisionId]
      );
    } catch (error) {
      console.error('Error completing revision:', error);
      throw error;
    }
  }

  async getRevisionHistory(courseId) {
    try {
      const result = await this.db.executeSql(
        'SELECT * FROM revisions WHERE course_id = ? ORDER BY completed_date DESC',
        [courseId]
      );
      return result[0].rows.raw();
    } catch (error) {
      console.error('Error getting revision history:', error);
      return [];
    }
  }

  // Méthodes pour paramètres
  async getSetting(key) {
    try {
      const result = await this.db.executeSql(
        'SELECT value FROM user_settings WHERE key = ?',
        [key]
      );
      return result[0].rows.length > 0 ? result[0].rows.item(0).value : null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  async updateSetting(key, value) {
    try {
      await this.db.executeSql(
        'UPDATE user_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [value, key]
      );
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  // Méthodes pour gamification
  async getGamificationData() {
    try {
      const result = await this.db.executeSql(
        'SELECT * FROM gamification WHERE id = 1'
      );
      return result[0].rows.length > 0 ? result[0].rows.item(0) : null;
    } catch (error) {
      console.error('Error getting gamification data:', error);
      return null;
    }
  }

  async updateGamificationData(data) {
    try {
      await this.db.executeSql(
        'UPDATE gamification SET user_points = ?, streak_days = ?, last_activity_date = ?, badges = ?, achievements = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [data.user_points, data.streak_days, data.last_activity_date, data.badges, data.achievements]
      );
    } catch (error) {
      console.error('Error updating gamification data:', error);
      throw error;
    }
  }

  async closeDatabase() {
    if (this.db) {
      await this.db.close();
      console.log('Database closed');
    }
  }
}