import React, { createContext, useContext, useCallback, useRef } from 'react';

const NavigationContext = createContext(null);

/**
 * Central navigation helpers for primary tabs + secondary stacks.
 * primaryTab: current bottom-tab destination (user_dashboard, user_vault, …)
 * scanOriginTab: tab active when Scan was opened (for Scan → Back)
 * detailOriginTab: tab active when a detail overlay was opened
 */
export function NavigationProvider({
  children,
  primaryTab,
  setPrimaryTab,
  clearOverlays,
  supportView,
  setSupportView
}) {
  const scanOriginRef = useRef('user_dashboard');
  const detailOriginRef = useRef('user_dashboard');

  const goToDashboard = useCallback(() => {
    clearOverlays();
    setSupportView?.('hub');
    setPrimaryTab('user_dashboard');
  }, [clearOverlays, setPrimaryTab, setSupportView]);

  const selectPrimaryTab = useCallback((tabId) => {
    clearOverlays();
    if (tabId !== 'user_support') setSupportView?.('hub');
    setPrimaryTab(tabId);
  }, [clearOverlays, setPrimaryTab, setSupportView]);

  const openScan = useCallback((fromTab) => {
    scanOriginRef.current = fromTab || primaryTab || 'user_dashboard';
    clearOverlays();
    setPrimaryTab('user_scan');
  }, [primaryTab, clearOverlays, setPrimaryTab]);

  const exitScan = useCallback(() => {
    const target = scanOriginRef.current || 'user_dashboard';
    setPrimaryTab(target);
  }, [setPrimaryTab]);

  const openBusinessDetail = useCallback((business, fromTab) => {
    detailOriginRef.current = fromTab || primaryTab || 'user_dashboard';
    return business;
  }, [primaryTab]);

  const openCardDetail = useCallback((card, fromTab) => {
    detailOriginRef.current = fromTab || primaryTab || 'user_dashboard';
    return card;
  }, [primaryTab]);

  const goBackFromDetail = useCallback(() => {
    clearOverlays();
    // Stay on current primary tab — detail was overlay on top of it
    const origin = detailOriginRef.current;
    if (origin && origin !== primaryTab) {
      setPrimaryTab(origin);
    }
  }, [clearOverlays, primaryTab, setPrimaryTab]);

  const goBackWithFallback = useCallback((fallbackTab) => {
    const fb = fallbackTab || 'user_dashboard';
    if (primaryTab === 'user_scan') {
      exitScan();
      return;
    }
    if (supportView && supportView !== 'hub') {
      if (supportView === 'detail') setSupportView('tickets');
      else if (supportView === 'tickets' || supportView === 'request') setSupportView('hub');
      else setSupportView('hub');
      return;
    }
    goToDashboard();
  }, [primaryTab, supportView, exitScan, setSupportView, goToDashboard]);

  const value = {
    primaryTab,
    scanOriginTab: scanOriginRef.current,
    detailOriginTab: detailOriginRef.current,
    goToDashboard,
    selectPrimaryTab,
    openScan,
    exitScan,
    openBusinessDetail,
    openCardDetail,
    goBackFromDetail,
    goBackWithFallback
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return ctx;
}
