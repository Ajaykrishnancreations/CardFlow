import React, { useState } from 'react';
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

import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminBusinessesScreen } from '../screens/admin/AdminBusinessesScreen';
import { AdminSupportScreen } from '../screens/admin/AdminSupportScreen';

import { DEV_TEST_ACCOUNTS } from '../context/AuthContext';

export function AppNavigator() {
  const { isAuthenticated, role, isNewUser, sendOtp } = useAuth();

  const [authStep, setAuthStep] = useState('splash');
  const [currentTab, setCurrentTab] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentPhone, setCurrentPhone] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      setCurrentTab(role === 'admin' ? 'admin_dashboard' : 'user_dashboard');
    } else {
      setCurrentTab(null);
      setAuthStep('splash');
    }
  }, [isAuthenticated, role]);

  const navigateTo = (tabId) => setCurrentTab(tabId);

  const handleBack = () => {
    if (selectedCard) { setSelectedCard(null); return; }
    if (selectedBusiness) { setSelectedBusiness(null); return; }
    if (currentTab === 'user_scan') { setCurrentTab('user_dashboard'); return; }
    if (currentTab === 'user_search') { setCurrentTab('user_dashboard'); return; }
  };

  const handleAdminConsole = async () => {
    const admin = DEV_TEST_ACCOUNTS.ADMIN_AJAY;
    await sendOtp(admin.phone);
    setCurrentPhone(admin.phone);
    setAuthStep('otp');
  };

  if (!isAuthenticated) {
    if (authStep === 'splash') {
      return (
        <Layout>
          <SplashScreen onGetStarted={() => setAuthStep('login')} />
        </Layout>
      );
    }
    if (authStep === 'login') {
      return (
        <Layout>
          <LoginScreen
            onOtpRequested={(phone) => { setCurrentPhone(phone); setAuthStep('otp'); }}
            onAdminConsole={handleAdminConsole}
          />
        </Layout>
      );
    }
    if (authStep === 'otp') {
      return (
        <Layout>
          <OtpScreen phone={currentPhone} onBackToPhone={() => setAuthStep('login')} />
        </Layout>
      );
    }
  }

  if (isNewUser) {
    return (
      <Layout>
        <OnboardingScreen />
      </Layout>
    );
  }

  const renderScreen = () => {
    if (selectedCard) {
      return <SavedCardDetailScreen card={selectedCard} onBack={() => setSelectedCard(null)} />;
    }
    if (selectedBusiness) {
      return <BusinessDetailsScreen business={selectedBusiness} onBack={() => setSelectedBusiness(null)} />;
    }

    if (role === 'admin') {
      switch (currentTab) {
        case 'admin_users': return <AdminUsersScreen />;
        case 'admin_businesses': return <AdminBusinessesScreen />;
        case 'admin_support': return <AdminSupportScreen />;
        default: return <AdminDashboardScreen onNavigate={navigateTo} />;
      }
    }

    switch (currentTab) {
      case 'user_profile':
        return <ProfileScreen onNavigate={navigateTo} />;
      case 'user_vault':
        return (
          <SavedCardsScreen
            onScanNewCard={() => navigateTo('user_scan')}
            onSelectCard={(card) => setSelectedCard(card)}
          />
        );
      case 'user_scan':
        return <ScanCardScreen onCardSaved={() => navigateTo('user_vault')} onBack={() => navigateTo('user_dashboard')} />;
      case 'user_my_business':
        return <MyBusinessHubScreen onSelectBusiness={(biz) => setSelectedBusiness(biz)} />;
      case 'user_support':
        return <SupportHubScreen />;
      case 'user_search':
        return (
          <SearchScreen
            onSelectBusiness={(biz) => setSelectedBusiness(biz)}
            onBack={() => navigateTo('user_dashboard')}
          />
        );
      case 'user_dashboard':
      default:
        return (
          <DashboardScreen
            onNavigate={navigateTo}
            onSelectCard={(card) => setSelectedCard(card)}
            onSelectBusiness={(biz) => setSelectedBusiness(biz)}
          />
        );
    }
  };

  return (
    <Layout
      header={role === 'admin' ? <AdminTopBar /> : null}
      footer={
        <TabBar
          currentTab={currentTab}
          onSelectTab={(tabId) => {
            setSelectedBusiness(null);
            setSelectedCard(null);
            navigateTo(tabId);
          }}
        />
      }
    >
      {renderScreen()}
    </Layout>
  );
}
