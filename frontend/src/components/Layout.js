import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme';

export function Layout({ children, header, footer }) {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.phoneFrame}>
        {header}
        <View style={styles.contentArea}>{children}</View>
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A', // Dark Slate desktop background
    alignItems: 'center',
    justifyContent: 'center'
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 480, // Responsive mobile container limit for Chrome desktop
    height: '100%',
    maxHeight: '100%',
    backgroundColor: '#F8FAFC',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden'
  }
});
