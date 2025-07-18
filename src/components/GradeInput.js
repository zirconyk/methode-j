import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { THEME_COLORS, getGradeColor } from '../constants/colors';

const GradeInput = ({ 
  visible, 
  onClose, 
  onSubmit, 
  title = "Saisir la note",
  placeholder = "Note sur 20",
  initialValue = ""
}) => {
  const [grade, setGrade] = useState(initialValue);
  const [error, setError] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setGrade(initialValue);
      setError('');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialValue]);

  const validateGrade = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Veuillez entrer un nombre valide";
    }
    if (numValue < 0 || numValue > 20) {
      return "La note doit être entre 0 et 20";
    }
    if (value.includes('.') && value.split('.')[1].length > 1) {
      return "Maximum une décimale";
    }
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateGrade(grade);
    if (validationError) {
      setError(validationError);
      return;
    }

    const numGrade = parseFloat(grade);
    onSubmit(numGrade);
    onClose();
  };

  const getGradeColorForValue = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return THEME_COLORS.textSecondary;
    return getGradeColor(numValue);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { borderColor: error ? THEME_COLORS.error : getGradeColorForValue(grade) }
              ]}
              value={grade}
              onChangeText={(value) => {
                setGrade(value);
                setError('');
              }}
              placeholder={placeholder}
              placeholderTextColor={THEME_COLORS.placeholder}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          <View style={styles.gradePreview}>
            <Text style={styles.gradePreviewLabel}>Aperçu:</Text>
            <View style={[
              styles.gradePreviewBox,
              { backgroundColor: getGradeColorForValue(grade) }
            ]}>
              <Text style={styles.gradePreviewText}>
                {grade || '0'}/20
              </Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: THEME_COLORS.modalBackground,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: THEME_COLORS.shadowOffset,
    shadowOpacity: THEME_COLORS.shadowOpacity,
    shadowRadius: THEME_COLORS.shadowRadius,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: THEME_COLORS.text,
    backgroundColor: THEME_COLORS.surface,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorText: {
    color: THEME_COLORS.error,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  gradePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  gradePreviewLabel: {
    fontSize: 14,
    color: THEME_COLORS.textSecondary,
    marginRight: 12,
  },
  gradePreviewBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  gradePreviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME_COLORS.text,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: THEME_COLORS.buttonSecondary,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
  },
  submitButton: {
    backgroundColor: THEME_COLORS.buttonPrimary,
  },
  cancelButtonText: {
    color: THEME_COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: THEME_COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GradeInput;