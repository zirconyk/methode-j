import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME_COLORS, getBadgeColor } from '../constants/colors';
import { BADGES } from '../constants';

const BadgeDisplay = ({ badgeId, size = 'medium', onPress }) => {
  const badge = BADGES[badgeId];
  
  if (!badge) return null;

  const sizeStyles = {
    small: { container: styles.smallContainer, icon: styles.smallIcon, text: styles.smallText },
    medium: { container: styles.mediumContainer, icon: styles.mediumIcon, text: styles.mediumText },
    large: { container: styles.largeContainer, icon: styles.largeIcon, text: styles.largeText }
  };

  const currentSize = sizeStyles[size];
  const backgroundColor = getBadgeColor(badge.type);

  return (
    <TouchableOpacity
      style={[styles.badgeContainer, currentSize.container, { backgroundColor }]}
      onPress={() => onPress && onPress(badge)}
      activeOpacity={0.7}
    >
      <Text style={[styles.badgeIcon, currentSize.icon]}>{badge.icon}</Text>
      <Text style={[styles.badgeText, currentSize.text]}>{badge.name}</Text>
    </TouchableOpacity>
  );
};

const BadgeGrid = ({ badges, onBadgePress }) => {
  return (
    <View style={styles.gridContainer}>
      {badges.map((badgeId) => (
        <BadgeDisplay
          key={badgeId}
          badgeId={badgeId}
          size="small"
          onPress={onBadgePress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    elevation: 3,
    shadowColor: THEME_COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  smallContainer: {
    width: 60,
    height: 60,
  },
  mediumContainer: {
    width: 80,
    height: 80,
  },
  largeContainer: {
    width: 100,
    height: 100,
  },
  badgeIcon: {
    textAlign: 'center',
  },
  smallIcon: {
    fontSize: 20,
  },
  mediumIcon: {
    fontSize: 24,
  },
  largeIcon: {
    fontSize: 32,
  },
  badgeText: {
    color: THEME_COLORS.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
  },
});

export { BadgeDisplay, BadgeGrid };