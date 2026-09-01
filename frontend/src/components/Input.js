import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconPress,
  keyboardType = 'default',
  maxLength,
  secureTextEntry = false,
  autoFocus = false,
  editable = true,
  style,
  inputStyle
}) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError, !editable && styles.inputDisabled]}>
        {LeftIcon && <LeftIcon size={18} color={colors.textSecondary} style={styles.leftIcon} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          editable={editable}
          style={[styles.input, inputStyle]}
        />
        {RightIcon && (
          <RightIcon
            size={18}
            color={colors.textSecondary}
            onPress={onRightIconPress}
            style={styles.rightIcon}
          />
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md
  },
  label: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    height: 48
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight
  },
  inputDisabled: {
    backgroundColor: colors.bgMuted,
    opacity: 0.7
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    outlineStyle: 'none' // For web browser focus ring cleanup
  },
  leftIcon: {
    marginRight: spacing.sm
  },
  rightIcon: {
    marginLeft: spacing.sm,
    cursor: 'pointer'
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs
  },
  hintText: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: '600',
    marginTop: 4
  }
});
