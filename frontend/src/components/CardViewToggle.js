import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

/**
 * Unified Digital / Original segmented control.
 */
export function CardViewToggle({
  options = [
    { id: 'digital', label: 'Digital Card' },
    { id: 'original', label: 'Original' }
  ],
  value,
  onChange,
  disabledIds = []
}) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = value === opt.id;
        const disabled = disabledIds.includes(opt.id);
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.item, active && styles.itemActive, disabled && styles.itemDisabled]}
            onPress={() => !disabled && onChange?.(opt.id)}
            activeOpacity={0.85}
            disabled={disabled}
          >
            <Text style={[styles.label, active && styles.labelActive, disabled && styles.labelDisabled]}>
              {opt.label}{disabled ? ' · N/A' : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.bgMutedDark,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.md
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm
  },
  itemActive: {
    backgroundColor: '#FFFFFF'
  },
  itemDisabled: {
    opacity: 0.5
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  labelDisabled: {
    color: colors.textMuted,
    fontWeight: '500'
  }
});
