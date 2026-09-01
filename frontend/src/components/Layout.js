import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../theme';

export function Layout({ children, header, footer }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.mainWrapper, isDesktop ? styles.desktopWrapper : styles.mobileWrapper]}>
        {header}
        <View style={styles.contentArea}>
          {children}
        </View>
        {footer ? <View style={styles.footerSlot}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E4EA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgMuted,
    flexDirection: 'column',
    overflow: 'hidden'
  },
  mobileWrapper: {
    maxWidth: 430,
    boxShadow: '0 20px 60px rgba(50, 20, 95, 0.12)'
  },
  desktopWrapper: {
    maxWidth: 430,
    borderRadius: 24,
    overflow: 'hidden'
  },
  contentArea: {
    flex: 1,
    backgroundColor: colors.bgMuted,
    overflow: 'hidden',
    width: '100%',
    minHeight: 0
  },
  footerSlot: {
    width: '100%',
    zIndex: 50,
    backgroundColor: '#FFFFFF'
  }
});
