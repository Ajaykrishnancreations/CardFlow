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
        <View style={[styles.contentArea, isDesktop && styles.desktopContentArea]}>
          <View style={[styles.innerContainer, isDesktop && styles.desktopInnerContainer]}>
            {children}
          </View>
        </View>
        {!isDesktop && footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0B1120', // Darker elegant backdrop for desktop canvas
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  mainWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  mobileWrapper: {
    maxWidth: 480,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  desktopWrapper: {
    maxWidth: '100%',
    backgroundColor: '#0F172A'
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    width: '100%',
    alignItems: 'center'
  },
  desktopContentArea: {
    backgroundColor: '#0B1120'
  },
  innerContainer: {
    width: '100%',
    height: '100%',
    flex: 1
  },
  desktopInnerContainer: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center'
  }
});
