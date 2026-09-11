import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';

export function Toggle({ value, onValueChange, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={[styles.track, value && styles.trackOn, disabled && styles.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value }}
    >
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  trackOn: {
    backgroundColor: colors.primary,
    alignItems: 'flex-end'
  },
  disabled: { opacity: 0.5 },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF'
  },
  thumbOn: {}
});
