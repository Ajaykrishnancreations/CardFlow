import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { TabBar } from '../components/TabBar';
import { AdminTopBar } from '../components/AdminTopBar';

import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

import { DashboardScreen } from '../screens/user/DashboardScreen';
import { SearchScreen } from '../screens/user/SearchScreen';
import { BusinessDetailsScreen } from '../screens/user/BusinessDetailsScreen';
import { SavedCardsScreen } from '../screens/user/SavedCardsScreen';
import { SavedCardDetailScreen } from '../screens/user/SavedCardDetailScreen';
import { ScanCardScreen } from '../screens/user/ScanCardScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { MyBusinessHubScreen } from '../screens/user/MyBusinessHubScreen';
import { SupportHubScreen } from '../screens/user/SupportHubScreen';
import { SupportRequestScreen } from '../screens/user/SupportRequestScreen';
import { SupportTicketsScreen } from '../screens/user/SupportTicketsScreen';
import { SupportTicketDetailScreen } from '../screens/user/SupportTicketDetailScreen';

import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminBusinessesScreen } from '../screens/admin/AdminBusinessesScreen';
import { AdminSupportScreen } from '../screens/admin/AdminSupportScreen';
import { AdminProfileScreen } from '../screens/admin/AdminProfileScreen';

const HOME_TAB = 'user_dashboard';

function AuthFlow({ authStep, setAuthStep, currentPhone, setCurrentPhone }) {
  const slide = useRef(new Animated.Value(authStep === 'otp' ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (authStep !== 'login' && authStep !== 'otp') return;
    opacity.setValue(0.85);
    Animated.parallel([
      Animated.timing(slide, {
        toValue: authStep === 'otp' ? 1 : 0,
        duration: 280,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true
      })
    ]).start();
  }, [authStep, slide, opacity]);

  if (authStep === 'splash') {
    return <SplashScreen onGetStarted={() => setAuthStep('login')} />;
  }

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24]
  });
  const otpTranslate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 0]
  });

  return (
    <View style={{ flex: 1 }}>
      {authStep === 'login' ? (
        <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }}>
          <LoginScreen
            onOtpRequested={(phone) => {
              setCurrentPhone(phone);
              setAuthStep('otp');
            }}
          />
        </Animated.View>
      ) : (
        <Animated.View style={{ flex: 1, opacity, transform: [{ translateX: otpTranslate }] }}>
          <OtpScreen phone={currentPhone} onBackToPhone={() => setAuthStep('login')} />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * App navigation model:
 * - primaryTab: one of the 5 bottom destinations (Home is user_dashboard)
 * - Scan remembers which tab opened it (never used as a bridge to Home)
 * - Business/Card details overlay the active tab so Browse search state is preserved
 * - Profile is a secondary screen reached from Home (not a bottom tab)
 */
export function AppNavigator() {
  const { isAuthenticated, role, isNewUser } = useAuth();

  const [authStep, setAuthStep] = useState('splash');
  const [currentTab, setCurrentTab] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentPhone, setCurrentPhone] = useState('');
  const [supportView, setSupportView] = useState('hub');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const scanOriginRef = useRef(HOME_TAB);
  const profileOriginRef = useRef(HOME_TAB);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentTab(role === 'admin' ? 'admin_dashboard' : HOME_TAB);
      setShowProfile(false);
    } else {
      setCurrentTab(null);
      setAuthStep('splash');
      setSelectedBusiness(null);
      setSelectedCard(null);
      setShowProfile(false);
    }
  }, [isAuthenticated, role]);

  const clearOverlays = useCallback(() => {
    setSelectedBusiness(null);
    setSelectedCard(null);
  }, []);

  const goHome = useCallback(() => {
    clearOverlays();
    setShowProfile(false);
    setSupportView('hub');
    setCurrentTab(HOME_TAB);
  }, [clearOverlays]);

  const selectTab = useCallback((tabId) => {
    clearOverlays();
    setShowProfile(false);
    if (tabId !== 'user_support') setSupportView('hub');

    if (tabId === 'user_scan') {
      // Remember where Scan was opened from — Back returns there, never treats Scan as Home
      if (currentTab && currentTab !== 'user_scan') {
        scanOriginRef.current = currentTab;
      } else if (showProfile) {
        scanOriginRef.current = HOME_TAB;
      }
    }

    setCurrentTab(tabId);
  }, [clearOverlays, currentTab, showProfile]);

  const openProfile = useCallback(() => {
    clearOverlays();
    profileOriginRef.current = currentTab === 'user_scan' ? HOME_TAB : (currentTab || HOME_TAB);
    setShowProfile(true);
    setSupportView('hub');
    // Keep currentTab as Home underneath; Profile is a stack layer
    if (currentTab === 'user_scan') setCurrentTab(HOME_TAB);
  }, [clearOverlays, currentTab]);

  const closeProfile = useCallback(() => {
    setShowProfile(false);
    setSupportView('hub');
    const origin = profileOriginRef.current || HOME_TAB;
    if (origin !== 'user_scan') setCurrentTab(origin);
    else setCurrentTab(HOME_TAB);
  }, []);

  const openBusiness = useCallback((biz) => {
    setSelectedCard(null);
    setSelectedBusiness(biz);
  }, []);

  const openCard = useCallback((card) => {
    setSelectedBusiness(null);
    setSelectedCard(card);
  }, []);

  const exitScan = useCallback(() => {
    const target = scanOriginRef.current || HOME_TAB;
    setCurrentTab(target === 'user_scan' ? HOME_TAB : target);
  }, []);

  if (!isAuthenticated) {
    return (
      <Layout>
        <AuthFlow
          authStep={authStep}
          setAuthStep={setAuthStep}
          currentPhone={currentPhone}
          setCurrentPhone={setCurrentPhone}
        />
      </Layout>
    );
  }

  if (isNewUser) {
    return (
      <Layout>
        <OnboardingScreen />
      </Layout>
    );
  }

  const renderSupport = () => {
    if (supportView === 'request') {
      return (
        <SupportRequestScreen
          onBack={() => setSupportView('hub')}
          onViewTickets={() => setSupportView('tickets')}
        />
      );
    }
    if (supportView === 'tickets') {
      return (
        <SupportTicketsScreen
          onBack={() => setSupportView('hub')}
          onNewRequest={() => setSupportView('request')}
          onSelectTicket={(t) => {
            setSelectedTicket(t);
            setSupportView('detail');
          }}
        />
      );
    }
    if (supportView === 'detail') {
      return (
        <SupportTicketDetailScreen
          ticket={selectedTicket}
          onBack={() => setSupportView('tickets')}
        />
      );
    }
    return (
      <SupportHubScreen
        onBack={() => {
          // Support opened from Profile
          setSupportView('hub');
          setShowProfile(true);
          setCurrentTab(HOME_TAB);
        }}
        onNewRequest={() => setSupportView('request')}
        onMyTickets={() => setSupportView('tickets')}
      />
    );
  };

  const renderPrimaryTab = () => {
    if (role === 'admin') {
      switch (currentTab) {
        case 'admin_users': return <AdminUsersScreen />;
        case 'admin_businesses': return <AdminBusinessesScreen />;
        case 'admin_support': return <AdminSupportScreen />;
        case 'admin_profile': return <AdminProfileScreen />;
        default: return <AdminDashboardScreen onNavigate={selectTab} />;
      }
    }

    switch (currentTab) {
      case 'user_vault':
        return (
          <SavedCardsScreen
            onScanNewCard={() => selectTab('user_scan')}
            onSelectCard={openCard}
          />
        );
      case 'user_scan':
        return (
          <ScanCardScreen
            onCardSaved={(card) => {
              if (card) {
                // After save, land on card detail over My Cards — not Scan-as-home
                scanOriginRef.current = 'user_vault';
                setCurrentTab('user_vault');
                openCard(card);
              } else {
                setCurrentTab('user_vault');
              }
            }}
            onBack={exitScan}
          />
        );
      case 'user_my_business':
        return <MyBusinessHubScreen onSelectBusiness={openBusiness} />;
      case 'user_support':
        return renderSupport();
      case 'user_search':
        return <SearchScreen onSelectBusiness={openBusiness} />;
      case HOME_TAB:
      default:
        return (
          <DashboardScreen
            onNavigate={(id) => {
              if (id === 'user_profile') openProfile();
              else selectTab(id);
            }}
            onOpenProfile={openProfile}
            onSelectCard={openCard}
            onSelectBusiness={openBusiness}
          />
        );
    }
  };

  // Stack layers (never route Home through Scan)
  const renderStack = () => {
    if (currentTab === 'user_support') {
      return renderSupport();
    }

    if (showProfile && !selectedBusiness && !selectedCard) {
      return (
        <ProfileScreen
          onNavigate={(id) => {
            if (id === HOME_TAB || id === 'user_dashboard') {
              goHome();
              return;
            }
            if (id === 'user_support') {
              setShowProfile(false);
              setSupportView('hub');
              setCurrentTab('user_support');
              return;
            }
            setShowProfile(false);
            selectTab(id);
          }}
          onBack={closeProfile}
        />
      );
    }

    // Keep tab mounted under detail overlays so Browse filters/search survive
    return (
      <View style={styles.stack}>
        <View
          style={[styles.tabLayer, (selectedBusiness || selectedCard) && styles.tabLayerHidden]}
          pointerEvents={selectedBusiness || selectedCard ? 'none' : 'auto'}
        >
          {renderPrimaryTab()}
        </View>

        {selectedBusiness ? (
          <View style={styles.overlay}>
            <BusinessDetailsScreen
              business={selectedBusiness}
              onBack={() => setSelectedBusiness(null)}
              onHome={goHome}
              onBusinessUpdated={(next) => setSelectedBusiness(next)}
            />
          </View>
        ) : null}

        {selectedCard ? (
          <View style={styles.overlay}>
            <SavedCardDetailScreen
              card={selectedCard}
              onBack={() => setSelectedCard(null)}
              onHome={goHome}
              onUpdated={(next) => setSelectedCard(next)}
            />
          </View>
        ) : null}
      </View>
    );
  };

  const hideTabBar =
    currentTab === 'user_scan' ||
    currentTab === 'user_support' ||
    showProfile;

  // Highlight Home when dashboard is under an overlay
  const tabBarCurrent =
    selectedBusiness || selectedCard
      ? currentTab
      : showProfile
        ? HOME_TAB
        : currentTab;

  return (
    <Layout
      header={role === 'admin' ? <AdminTopBar /> : null}
      footer={
        hideTabBar ? null : (
          <TabBar
            currentTab={tabBarCurrent}
            onSelectTab={selectTab}
          />
        )
      }
    >
      {renderStack()}
    </Layout>
  );
}

const styles = StyleSheet.create({
  stack: { flex: 1 },
  tabLayer: { flex: 1 },
  tabLayerHidden: { opacity: 0, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FAFAF8', zIndex: 10 }
});
