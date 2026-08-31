import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { Header } from '../components/Header';
import { TabBar } from '../components/TabBar';

// Auth Screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

// User Screens
import { HomeScreen } from '../screens/user/HomeScreen';
import { SearchScreen } from '../screens/user/SearchScreen';
import { BusinessDetailsScreen } from '../screens/user/BusinessDetailsScreen';
import { SavedCardsScreen } from '../screens/user/SavedCardsScreen';
import { ScanCardScreen } from '../screens/user/ScanCardScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';

// Owner Screens
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { MyBusinessesScreen } from '../screens/owner/MyBusinessesScreen';
import { QRCodeScreen } from '../screens/owner/QRCodeScreen';
import { ShareCardScreen } from '../screens/owner/ShareCardScreen';
import { EnquiriesScreen } from '../screens/owner/EnquiriesScreen';
import { AnalyticsScreen } from '../screens/owner/AnalyticsScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminBusinessesScreen } from '../screens/admin/AdminBusinessesScreen';
import { AdminVerificationScreen } from '../screens/admin/AdminVerificationScreen';
import { AdminSettingsScreen } from '../screens/admin/AdminSettingsScreen';
import { AdminSupportScreen } from '../screens/admin/AdminSupportScreen';

export function AppNavigator() {
  const { isAuthenticated, role, isNewUser, pendingPhone, setUser, logout } = useAuth();

  // Navigation state
  const [authStep, setAuthStep] = useState('splash'); // 'splash' | 'login' | 'otp'
  const [currentTab, setCurrentTab] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentPhone, setCurrentPhone] = useState('');

  // Set default initial tab based on role
  React.useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') {
        setCurrentTab('admin_dashboard');
      } else if (role === 'owner') {
        setCurrentTab('owner_dashboard');
      } else {
        setCurrentTab('user_home');
      }
    } else {
      setCurrentTab(null);
      setAuthStep('splash');
    }
  }, [isAuthenticated, role]);

  // Navigate to screen/tab
  const navigateTo = (tabId, params) => {
    setHistory((prev) => [...prev, currentTab]);
    setCurrentTab(tabId);
  };

  const handleBack = () => {
    if (selectedBusiness) {
      setSelectedBusiness(null);
      return;
    }
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((prevH) => prevH.slice(0, -1));
      setCurrentTab(prev);
    }
  };

  // 1. UN-AUTHENTICATED FLOW
  if (!isAuthenticated) {
    if (authStep === 'splash') {
      return (
        <Layout>
          <SplashScreen
            onGetStarted={() => setAuthStep('login')}
          />
        </Layout>
      );
    }

    if (authStep === 'login') {
      return (
        <Layout
          header={
            <Header
              title="CardFlow Login"
              showBack={true}
              onBack={() => setAuthStep('splash')}
            />
          }
        >
          <LoginScreen
            onOtpRequested={(phone) => {
              setCurrentPhone(phone);
              setAuthStep('otp');
            }}
          />
        </Layout>
      );
    }

    if (authStep === 'otp') {
      return (
        <Layout
          header={
            <Header
              title="Verification"
              showBack={true}
              onBack={() => setAuthStep('login')}
            />
          }
        >
          <OtpScreen
            phone={currentPhone}
            onBackToPhone={() => setAuthStep('login')}
            onVerified={(user) => {
              // Authenticated state updates automatically via context
            }}
          />
        </Layout>
      );
    }
  }

  // 2. FIRST TIME REGISTRATION / ONBOARDING FLOW
  if (isNewUser) {
    return (
      <Layout
        header={
          <Header
            title="Profile Registration"
            showBack={false}
          />
        }
      >
        <OnboardingScreen onFinish={() => {}} />
      </Layout>
    );
  }

  // 3. AUTHENTICATED FLOW — RENDER ROLE SCREENS
  const renderScreen = () => {
    // If viewing a detailed business profile
    if (selectedBusiness) {
      return (
        <BusinessDetailsScreen
          business={selectedBusiness}
          onBack={() => setSelectedBusiness(null)}
          onShowQr={() => navigateTo('owner_qr')}
        />
      );
    }

    // Role: Admin Screens
    if (role === 'admin') {
      switch (currentTab) {
        case 'admin_users':
          return <AdminUsersScreen />;
        case 'admin_businesses':
          return <AdminBusinessesScreen />;
        case 'admin_kyc':
          return <AdminVerificationScreen />;
        case 'admin_support':
          return <AdminSupportScreen />;
        case 'admin_settings':
          return <AdminSettingsScreen />;
        case 'admin_dashboard':
        default:
          return <AdminDashboardScreen onNavigate={navigateTo} />;
      }
    }

    // Role: Business Owner Screens
    if (role === 'owner') {
      switch (currentTab) {
        case 'owner_businesses':
          return (
            <MyBusinessesScreen
              onSelectBusiness={(biz) => {
                setSelectedBusiness(biz);
              }}
              onAddNewBusiness={() => alert('Add Business wizard initiated.')}
            />
          );
        case 'owner_enquiries':
          return <EnquiriesScreen />;
        case 'owner_analytics':
          return <AnalyticsScreen />;
        case 'owner_qr':
          return <QRCodeScreen onShareCard={() => navigateTo('owner_share')} />;
        case 'owner_share':
          return <ShareCardScreen />;
        case 'owner_profile':
          return <ProfileScreen />;
        case 'owner_dashboard':
        default:
          return (
            <OwnerDashboardScreen
              onNavigate={navigateTo}
              onShowQr={() => navigateTo('owner_qr')}
              onShareCard={() => navigateTo('owner_share')}
            />
          );
      }
    }

    // Role: Normal User Screens
    switch (currentTab) {
      case 'user_search':
        return (
          <SearchScreen
            onSelectBusiness={(biz) => setSelectedBusiness(biz)}
          />
        );
      case 'user_scan':
        return (
          <ScanCardScreen
            onCardSaved={() => navigateTo('user_vault')}
          />
        );
      case 'user_vault':
        return (
          <SavedCardsScreen
            onScanNewCard={() => navigateTo('user_scan')}
          />
        );
      case 'user_profile':
        return (
          <ProfileScreen
            onSwitchToOwner={() => {
              // Upgrade role to owner in dev
              setUser((prev) => ({ ...prev, role: 'owner', ownedBusinessIds: ['biz-1', 'biz-2'] }));
            }}
          />
        );
      case 'user_home':
      default:
        return (
          <HomeScreen
            onNavigate={navigateTo}
            onSelectBusiness={(biz) => setSelectedBusiness(biz)}
          />
        );
    }
  };

  const getHeaderTitle = () => {
    if (selectedBusiness) return selectedBusiness.name;
    if (currentTab === 'user_search') return 'Discover Businesses';
    if (currentTab === 'user_scan') return 'Scan Business Card';
    if (currentTab === 'user_vault') return 'My Card Vault';
    if (currentTab === 'user_profile' || currentTab === 'owner_profile') return 'My Profile';
    if (currentTab === 'owner_businesses') return 'My Businesses';
    if (currentTab === 'owner_enquiries') return 'Customer Enquiries';
    if (currentTab === 'owner_analytics') return 'Business Analytics';
    if (currentTab === 'owner_qr') return 'Counter QR Display';
    if (currentTab === 'owner_share') return 'Share Digital Card';
    if (currentTab === 'admin_users') return 'User Management';
    if (currentTab === 'admin_businesses') return 'Listing Directory';
    if (currentTab === 'admin_kyc') return 'KYC Review Queue';
    if (currentTab === 'admin_support') return 'Support & Issue Resolution';
    if (currentTab === 'admin_settings') return 'System Settings';
    return 'CardFlow';
  };

  return (
    <Layout
      header={
        <Header
          title={getHeaderTitle()}
          showLocation={currentTab === 'user_home'}
          showBack={!!selectedBusiness || history.length > 0}
          onBack={handleBack}
          currentTab={currentTab}
          onSelectTab={(tabId) => {
            setSelectedBusiness(null);
            navigateTo(tabId);
          }}
        />
      }
      footer={
        <TabBar
          currentTab={currentTab}
          onSelectTab={(tabId) => {
            setSelectedBusiness(null);
            navigateTo(tabId);
          }}
        />
      }
    >
      {renderScreen()}
    </Layout>
  );
}
