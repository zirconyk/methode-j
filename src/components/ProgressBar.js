import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { THEME_COLORS } from '../constants/colors';

const ProgressBar = ({ progress, total, label, showPercentage = true, animated = true }) => {
  const progressPercentage = total > 0 ? (progress / total) * 100 : 0;
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progressPercentage,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progressPercentage);
    }
  }, [progressPercentage, animated]);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(progressPercentage)}%</Text>
          )}
        </View>
      )}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.progressText}>
          {progress}/{total}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: THEME_COLORS.text,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 12,
    color: THEME_COLORS.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    height: 8,
    backgroundColor: THEME_COLORS.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME_COLORS.progressFill,
    borderRadius: 4,
  },
  footer: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    color: THEME_COLORS.textMuted,
  },
});

export default ProgressBar;