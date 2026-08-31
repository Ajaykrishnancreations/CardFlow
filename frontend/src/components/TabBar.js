import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Home,
  Search,
  Camera,
  FolderOpen,
  User,
  LayoutDashboard,
  Building2,
  Inbox,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  LifeBuoy
} from 'lucide-react';
import { colors, radii, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

export function TabBar({ currentTab, onSelectTab }) {
  const { role } = useAuth();

  const getTabs = () => {
    if (role === 'admin') {
      return [
        { id: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'admin_users', label: 'Users', icon: Users },
        { id: 'admin_businesses', label: 'Listings', icon: Building2 },
        { id: 'admin_kyc', label: 'KYC', icon: ShieldAlert },
        { id: 'admin_support', label: 'Support', icon: LifeBuoy }
      ];
    }

    if (role === 'owner') {
      return [
        { id: 'owner_dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'owner_businesses', label: 'My Businesses', icon: Building2 },
        { id: 'owner_enquiries', label: 'Enquiries', icon: Inbox },
        { id: 'owner_analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'owner_profile', label: 'Profile', icon: User }
      ];
    }

    // Default: Normal User
    return [
      { id: 'user_home', label: 'Home', icon: Home },
      { id: 'user_search', label: 'Search', icon: Search },
      { id: 'user_scan', label: 'Scan Card', icon: Camera, isCenter: true },
      { id: 'user_vault', label: 'Saved Cards', icon: FolderOpen },
      { id: 'user_profile', label: 'Profile', icon: User }
    ];
  };

  const tabs = getTabs();

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = currentTab === tab.id;

        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.85}
              onPress={() => onSelectTab(tab.id)}
              style={styles.centerTabContainer}
            >
              <View style={[styles.centerButton, isActive && styles.centerButtonActive]}>
                <IconComponent size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, { marginTop: 2 }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.id)}
            style={styles.tabItem}
          >
            <IconComponent
              size={20}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
    height: 64,
    zIndex: 10
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 3
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6
  },
  centerButtonActive: {
    backgroundColor: colors.primaryHover,
    transform: [{ scale: 1.05 }]
  }
});
