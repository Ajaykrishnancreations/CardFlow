import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CreditCard } from 'lucide-react';
import { colors, radii } from '../theme';

export function CardFlowLogo({ size = 56 }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <CreditCard size={size * 0.45} color="#FFFFFF" strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg
  }
});
