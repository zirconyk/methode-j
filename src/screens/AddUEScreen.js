import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { THEME_COLORS, UE_COLORS } from '../constants/colors';
import { SEMESTERS, YEARS } from '../constants';
import Database from '../services/database';

const AddUEScreen = ({ navigation, route }) => {
  const editingUE = route.params?.ue;
  const isEditing = !!editingUE;

  const [name, setName] = useState(editingUE?.name || '');
  const [selectedColor, setSelectedColor] = useState(editingUE?.color || UE_COLORS[0]);
  const [selectedYear, setSelectedYear] = useState(editingUE?.year || YEARS[0]);
  const [selectedSemester, setSelectedSemester] = useState(editingUE?.semester || 'autumn');
  const [examDate, setExamDate] = useState(editingUE?.exam_date ? new Date(editingUE.exam_date) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [preExamPeriod, setPreExamPeriod] = useState(editingUE?.pre_exam_period?.toString() || '7');
  const [ccMode, setCcMode] = useState(editingUE?.cc_mode === 1 || false);
  const [loading, setLoading] = useState(false);

  const db = new Database();

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'UE est obligatoire');
      return false;
    }

    if (name.trim().length < 2) {
      Alert.alert('Erreur', 'Le nom de l\'UE doit contenir au moins 2 caractères');
      return false;
    }

    const period = parseInt(preExamPeriod);
    if (isNaN(period) || period < 1 || period > 21) {
      Alert.alert('Erreur', 'La période pré-examen doit être entre 1 et 21 jours');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await db.initDB();

      const ueData = {
        name: name.trim(),
        color: selectedColor,
        year: selectedYear,
        semester: selectedSemester,
        exam_date: examDate ? examDate.toISOString().split('T')[0] : null,
        pre_exam_period: parseInt(preExamPeriod),
        cc_mode: ccMode ? 1 : 0,
      };

      if (isEditing) {
        await db.updateUE(editingUE.id, ueData);
        Alert.alert('Succès', 'UE mise à jour avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await db.createUE(ueData);
        Alert.alert('Succès', 'UE créée avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'UE');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExamDate(selectedDate);
    }
  };

  const renderColorPicker = () => {
    return (
      <View style={styles.colorGrid}>
        {UE_COLORS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && (
              <Text style={styles.selectedColorText}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderYearPicker = () => {
    return (
      <View style={styles.optionRow}>
        {YEARS.map(year => (
          <TouchableOpacity
            key={year}
            style={[
              styles.optionButton,
              selectedYear === year && styles.selectedOption
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[
              styles.optionText,
              selectedYear === year && styles.selectedOptionText
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSemesterPicker = () => {
    return (
      <View style={styles.optionRow}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedSemester === 'autumn' && styles.selectedOption
          ]}
          onPress={() => setSelectedSemester('autumn')}
        >
          <Text style={[
            styles.optionText,
            selectedSemester === 'autumn' && styles.selectedOptionText
          ]}>
            Automne
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedSemester === 'spring' && styles.selectedOption
          ]}
          onPress={() => setSelectedSemester('spring')}
        >
          <Text style={[
            styles.optionText,
            selectedSemester === 'spring' && styles.selectedOptionText
          ]}>
            Printemps
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Nom de l'UE */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom de l'UE *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Pharmacologie générale"
            placeholderTextColor={THEME_COLORS.placeholder}
            maxLength={50}
          />
        </View>

        {/* Couleur */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Couleur</Text>
          <View style={styles.colorPreview}>
            <View style={[styles.colorPreviewCircle, { backgroundColor: selectedColor }]} />
            <Text style={styles.colorPreviewText}>Couleur sélectionnée</Text>
          </View>
          {renderColorPicker()}
        </View>

        {/* Année */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Année d'étude</Text>
          {renderYearPicker()}
        </View>

        {/* Semestre */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Semestre</Text>
          {renderSemesterPicker()}
        </View>

        {/* Date d'examen */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date d'examen (optionnel)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {examDate ? examDate.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
            </Text>
          </TouchableOpacity>
          {examDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setExamDate(null)}
            >
              <Text style={styles.clearDateButtonText}>Effacer la date</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Période pré-examen */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Période de révision pré-examen (jours)</Text>
          <TextInput
            style={styles.input}
            value={preExamPeriod}
            onChangeText={setPreExamPeriod}
            placeholder="7"
            placeholderTextColor={THEME_COLORS.placeholder}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={styles.helpText}>
            Nombre de jours avant l'examen pour intensifier les révisions
          </Text>
        </View>

        {/* Mode CC */}
        <View style={styles.formGroup}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Contrôle continu (CC)</Text>
              <Text style={styles.helpText}>
                Activer si cette UE a des contrôles continus
              </Text>
            </View>
            <Switch
              trackColor={{
                false: THEME_COLORS.disabled,
                true: THEME_COLORS.accent
              }}
              thumbColor={ccMode ? THEME_COLORS.text : THEME_COLORS.textSecondary}
              ios_backgroundColor={THEME_COLORS.disabled}
              onValueChange={setCcMode}
              value={ccMode}
            />
          </View>
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer l\'UE')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={examDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_COLORS.background,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: THEME_COLORS.text,
    backgroundColor: THEME_COLORS.surface,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorPreviewCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorPreviewText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: THEME_COLORS.text,
  },
  selectedColorText: {
    color: THEME_COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    backgroundColor: THEME_COLORS.surface,
  },
  selectedOption: {
    backgroundColor: THEME_COLORS.accent,
    borderColor: THEME_COLORS.accent,
  },
  optionText: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
  },
  selectedOptionText: {
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: THEME_COLORS.surface,
  },
  dateButtonText: {
    fontSize: 16,
    color: THEME_COLORS.text,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateButtonText: {
    fontSize: 14,
    color: THEME_COLORS.error,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  helpText: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: THEME_COLORS.disabled,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME_COLORS.text,
  },
});

export default AddUEScreen;