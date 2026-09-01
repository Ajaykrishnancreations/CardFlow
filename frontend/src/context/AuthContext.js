import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { mockBusinesses } from '../data/mockData';
import { apiClient } from '../services/api';

// Fixed Development Test Accounts
export const DEV_TEST_ACCOUNTS = {
  ADMIN_AJAY: {
    phone: '6382124970',
    otp: '123456',
    role: 'admin',
    name: 'Ajay',
    email: 'ajay@cardflow.app',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    plan: 'premium',
    freeScansRemaining: 9999,
    credits: 9999,
    isIdVerified: true
  },
  ADMIN_GOVARDHAN: {
    phone: '9008722766',
    otp: '123456',
    role: 'admin',
    name: 'Govardhan',
    email: 'govardhan@cardflow.app',
    city: 'Bengaluru',
    state: 'Karnataka',
    plan: 'premium',
    freeScansRemaining: 9999,
    credits: 9999,
    isIdVerified: true
  },
  ADMIN_SUPERVISOR: {
    phone: '9999988888',
    otp: '123456',
    role: 'admin',
    name: 'Admin Supervisor',
    email: 'admin@cardflow.app',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    plan: 'premium',
    freeScansRemaining: 999,
    credits: 999,
    isIdVerified: true
  },
  BUSINESS_OWNER_RAJ: {
    phone: '7094310122',
    otp: '123456',
    role: 'owner',
    name: 'Raj',
    email: 'raj@rajenterprises.com',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    plan: 'premium',
    freeScansRemaining: 500,
    credits: 200,
    isIdVerified: true,
    ownedBusinessIds: ['biz-3']
  },
  BUSINESS_OWNER_RASHIQ: {
    phone: '9042938108',
    otp: '123456',
    role: 'owner',
    name: 'Rashiq',
    email: 'rashiq@rashiqtrading.com',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    plan: 'plus',
    freeScansRemaining: 150,
    credits: 50,
    isIdVerified: true,
    ownedBusinessIds: ['biz-4']
  },
  BUSINESS_OWNER_SURESH: {
    phone: '9876543210',
    otp: '123456',
    role: 'owner',
    name: 'Suresh Natarajan',
    email: 'suresh@kovaiprecision.com',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    plan: 'plus',
    freeScansRemaining: 100,
    credits: 50,
    isIdVerified: true,
    ownedBusinessIds: ['biz-1', 'biz-2']
  },
  NORMAL_USER_DHARANI: {
    phone: '9677840181',
    otp: '123456',
    role: 'user',
    name: 'Dharani',
    email: 'dharani@gmail.com',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    plan: 'free',
    freeScansRemaining: 30,
    credits: 10,
    isIdVerified: true
  },
  NORMAL_USER_RAVI: {
    phone: '1234567890',
    otp: '123456',
    role: 'user',
    name: 'Ravi Kumar',
    email: 'ravi.kumar@example.com',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    plan: 'free',
    freeScansRemaining: 28,
    credits: 10,
    isIdVerified: true
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'user' | 'owner' | 'admin'
  const [token, setToken] = useState(null);
  const [activeBusinessId, setActiveBusinessId] = useState('biz-1');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [myBusinesses, setMyBusinesses] = useState([]);

  // Load user's saved card vault
  const loadUserVault = useCallback(async (authToken) => {
    const currentToken = authToken || token;
    if (!currentToken) {
      setSavedCards([]);
      return;
    }
    const cards = await apiClient.getCards(currentToken);
    if (cards && Array.isArray(cards)) {
      setSavedCards(cards);
    }
  }, [token]);

  // Load user's owned businesses (multiple per user supported)
  const loadMyBusinesses = useCallback(async (authToken, currentUser) => {
    const currentToken = authToken || token;
    const u = currentUser || user;
    if (!currentToken || !u) {
      setMyBusinesses([]);
      return;
    }
    try {
      const list = await apiClient.getMyBusinesses(currentToken);
      if (list && Array.isArray(list) && list.length > 0) {
        setMyBusinesses(list);
        try {
          localStorage.setItem(`cf_biz_${u.phone}`, JSON.stringify(list));
        } catch (e) {}
        return;
      }
    } catch (e) {
      console.warn('Could not load businesses from API', e);
    }
    // Fallback: dev owner accounts or localStorage
    try {
      const cached = localStorage.getItem(`cf_biz_${u.phone}`);
      if (cached) {
        setMyBusinesses(JSON.parse(cached));
        return;
      }
    } catch (e) {}
    // Seed businesses for dev owner test accounts
    if (u.ownedBusinessIds?.length) {
      const seeded = mockBusinesses.filter(
        (b) => u.ownedBusinessIds.includes(b.id) || b.ownerPhone === u.phone || b.ownerPhone === `+91${u.phone}`
      );
      setMyBusinesses(seeded);
    } else {
      setMyBusinesses([]);
    }
  }, [token]);

  const addMyBusiness = useCallback(async (bizData) => {
    const created = await apiClient.createMyBusiness(bizData, token);
    const newBiz = {
      ...created,
      id: created?.id || created?.ID,
      name: created?.name || bizData.business_name,
      business_name: created?.name || bizData.business_name,
      category: bizData.category,
      city: created?.city || bizData.city,
      district: bizData.district,
      state: created?.state || bizData.state,
      address: created?.address_line1 || bizData.address,
      phone: bizData.phone,
      whatsapp: bizData.whatsapp,
      email: bizData.email,
      website: bizData.website,
      gstin: bizData.gstin,
      verification: created?.verification || 'pending',
      status: created?.status || 'live',
      card_image_url: bizData.front_image_data || '',
      card_back_image_url: bizData.back_image_data || ''
    };
    setMyBusinesses((prev) => {
      const updated = [newBiz, ...prev];
      try {
        localStorage.setItem(`cf_biz_${user?.phone}`, JSON.stringify(updated.map((b) => ({
          ...b,
          card_image_url: b.card_image_url ? '[stored]' : '',
          card_back_image_url: b.card_back_image_url ? '[stored]' : '',
          front_image_data: undefined,
          back_image_data: undefined
        }))));
      } catch (e) {}
      return updated;
    });
    return newBiz;
  }, [token, user]);

  const updateMyBusiness = useCallback(async (bizId, bizData) => {
    const updated = await apiClient.updateMyBusiness(bizId, bizData, token);
    const next = {
      id: bizId,
      ...updated,
      name: updated?.name || bizData.business_name || bizData.name,
      business_name: updated?.name || bizData.business_name || bizData.name,
      category: bizData.category,
      city: updated?.city || bizData.city,
      state: updated?.state || bizData.state,
      address: updated?.address_line1 || bizData.address,
      phone: bizData.phone,
      whatsapp: bizData.whatsapp,
      email: bizData.email,
      website: bizData.website,
      gstin: bizData.gstin,
      description: bizData.description,
      services: Array.isArray(bizData.services) ? bizData.services : (bizData.services || '').split(',').map((s) => s.trim()).filter(Boolean),
      verification: updated?.verification || 'pending',
      card_image_url: bizData.front_image_data
        ? `/api/v1/owner/businesses/${bizId}/card-image?side=front`
        : undefined,
      card_back_image_url: bizData.back_image_data
        ? `/api/v1/owner/businesses/${bizId}/card-image?side=back`
        : undefined
    };
    setMyBusinesses((prev) => prev.map((b) => (String(b.id) === String(bizId) ? { ...b, ...next } : b)));
    return next;
  }, [token]);

  const sessionRestoredRef = useRef(false);

  // Restore session once on app startup — must NOT depend on loadUserVault/loadMyBusinesses
  // (those callbacks change when token/user updates, which caused an infinite API loop)
  useEffect(() => {
    if (sessionRestoredRef.current) return;
    sessionRestoredRef.current = true;

    try {
      const savedUser = localStorage.getItem('cf_user');
      const savedToken = localStorage.getItem('cf_token');
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setRole(parsed.role);
        setToken(savedToken);
        if (parsed.role === 'owner' && parsed.ownedBusinessIds?.length) {
          setActiveBusinessId(parsed.ownedBusinessIds[0]);
        }
        // Pass token/user explicitly — do not rely on stale closure state
        apiClient.getCards(savedToken).then((cards) => {
          if (cards && Array.isArray(cards)) setSavedCards(cards);
        });
        apiClient.getMyBusinesses(savedToken).then((list) => {
          if (list && Array.isArray(list) && list.length > 0) {
            setMyBusinesses(list);
            return;
          }
          try {
            const cached = localStorage.getItem(`cf_biz_${parsed.phone}`);
            if (cached) {
              setMyBusinesses(JSON.parse(cached));
              return;
            }
          } catch (e) {}
          if (parsed.ownedBusinessIds?.length) {
            setMyBusinesses(
              mockBusinesses.filter(
                (b) => parsed.ownedBusinessIds.includes(b.id) || b.ownerPhone === parsed.phone || b.ownerPhone === `+91${parsed.phone}`
              )
            );
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not read session storage', e);
    }
  }, []);

  const [lastSentOtp, setLastSentOtp] = useState('123456');

  const sendOtp = async (phone) => {
    setIsLoading(true);
    setPendingPhone(phone);
    try {
      const res = await apiClient.sendOtp(phone);
      if (res?.status === 'error' || res?.error) {
        setIsLoading(false);
        return {
          success: false,
          error: res?.error?.message || res?.error || "Couldn't send OTP. Please try again."
        };
      }
      const code = res?.data?.otp_preview || res?.otp_preview || '123456';
      setLastSentOtp(code || '123456');
      setIsLoading(false);
      return { success: true, message: 'OTP sent successfully' };
    } catch (e) {
      setIsLoading(false);
      return { success: false, error: "Couldn't send OTP. Please try again." };
    }
  };

  const verifyOtp = async (phone, enteredOtp, options = {}) => {
    setIsLoading(true);
    try {
      const apiRes = await apiClient.verifyOtp(phone, enteredOtp);
      const errMsg = apiRes?.error?.message || apiRes?.error || null;
      const hasToken = !!(apiRes?.data?.access_token || apiRes?.access_token || apiRes?.data?.user || apiRes?.user);
      if (!apiRes || apiRes.status === 'error' || (errMsg && !hasToken)) {
        setIsLoading(false);
        return {
          success: false,
          error: typeof errMsg === 'string' ? errMsg : 'Invalid OTP. Please check the code and try again.'
        };
      }

      // Match against development test accounts
      let matchedAccount = null;
      let isBrandNew = false;

      const apiUser = apiRes?.data?.user || apiRes?.user;
      if (apiUser) {
        matchedAccount = {
          phone: (apiUser.phone || phone).replace('+91', ''),
          role: apiUser.role || 'user',
          name: apiUser.name || 'CardFlow User',
          city: apiUser.city || 'Coimbatore',
          state: apiUser.state || 'Tamil Nadu',
          plan: apiUser.plan || 'free',
          freeScansRemaining: apiUser.free_scans_remaining != null ? apiUser.free_scans_remaining : 30,
          credits: apiUser.credit_balance != null ? apiUser.credit_balance : 10,
          isIdVerified: apiUser.is_id_verified || false,
          isNewUser: apiRes?.data?.is_new_user || apiRes?.is_new_user || false
        };
        isBrandNew = matchedAccount.isNewUser;
      }

      if (!matchedAccount || matchedAccount.name === 'CardFlow User') {
        for (const key of Object.keys(DEV_TEST_ACCOUNTS)) {
          const acc = DEV_TEST_ACCOUNTS[key];
          if (acc.phone === phone || acc.phone === String(phone).replace(/\D/g, '').slice(-10)) {
            matchedAccount = { ...acc };
            isBrandNew = false;
            break;
          }
        }
      }

      if (!matchedAccount) {
        isBrandNew = !!(apiRes?.data?.is_new_user || apiRes?.is_new_user);
        matchedAccount = {
          phone,
          otp: '123456',
          role: 'user',
          name: apiUser?.name || 'CardFlow User',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          plan: 'free',
          freeScansRemaining: 30,
          credits: 10,
          isIdVerified: false,
          isNewUser: isBrandNew
        };
      }

      if (typeof options.beforeCommit === 'function') {
        await options.beforeCommit();
      }

      const liveJwt = apiRes?.data?.access_token || apiRes?.access_token || `cf_token_${matchedAccount.phone}`;
      setUser(matchedAccount);
      setRole(matchedAccount.role);
      setToken(liveJwt);
      setIsNewUser(isBrandNew);

      if (matchedAccount.role === 'owner' && matchedAccount.ownedBusinessIds?.length) {
        setActiveBusinessId(matchedAccount.ownedBusinessIds[0]);
      }

      try {
        localStorage.setItem('cf_user', JSON.stringify(matchedAccount));
        localStorage.setItem('cf_token', liveJwt);
      } catch (e) {}

      loadUserVault(liveJwt);
      loadMyBusinesses(liveJwt, matchedAccount);

      setIsLoading(false);
      return { success: true, user: matchedAccount, isNewUser: isBrandNew };
    } catch (e) {
      setIsLoading(false);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  const completeOnboarding = async (profileData) => {
    const updatedUser = {
      ...user,
      name: profileData.name || 'CardFlow User',
      role: 'user',
      isNewUser: false
    };

    setUser(updatedUser);
    setRole('user');
    setIsNewUser(false);

    try {
      localStorage.setItem('cf_user', JSON.stringify(updatedUser));
    } catch (e) {}

    if (token) {
      try {
        await apiClient.updateProfile({ name: updatedUser.name }, token);
      } catch (e) {
        console.warn('Could not persist onboarding name', e);
      }
    }
  };

  const updateProfile = useCallback(async (fields) => {
    const payload = {
      name: fields.name,
      email: fields.email || null,
      city: fields.city,
      state: fields.state
    };
    let updated = null;
    if (token) {
      updated = await apiClient.updateProfile(payload, token);
    }
    const merged = {
      ...user,
      name: updated?.name ?? fields.name ?? user?.name,
      email: updated?.email ?? fields.email ?? user?.email,
      city: updated?.city ?? fields.city ?? user?.city,
      state: updated?.state ?? fields.state ?? user?.state
    };
    setUser(merged);
    try {
      localStorage.setItem('cf_user', JSON.stringify(merged));
    } catch (e) {}
    return merged;
  }, [user, token]);

  // Helper to check if a business is already saved in this user's vault
  const isBusinessSaved = useCallback((biz) => {
    if (!biz || !savedCards || savedCards.length === 0) return false;
    const bName = (biz.name || '').toLowerCase().trim();
    const bPhone = (biz.phone || '').replace(/\D/g, '');

    return savedCards.some((card) => {
      const cCompany = (card.company || card.person_name || '').toLowerCase().trim();
      const cPhone = (card.phones?.[0]?.raw || card.phones?.[0]?.e164 || '').replace(/\D/g, '');
      if (bName && cCompany && (cCompany.includes(bName) || bName.includes(cCompany))) return true;
      if (bPhone && cPhone && (cPhone.includes(bPhone) || bPhone.includes(cPhone))) return true;
      return false;
    });
  }, [savedCards]);

  // Save a business card directly from discovery into user vault
  const saveBusinessToVault = async (biz) => {
    if (!biz || !token) return;
    const payload = {
      person_name: biz.name || 'Business Contact',
      designation: 'Owner / Partner',
      company: biz.name || 'Business Enterprise',
      website: `https://cardflow.app/b/${biz.slug || ''}`,
      notes: `Saved from Discover Businesses (${biz.category || ''})`,
      met_context: 'Discover Directory',
      phones: biz.phone ? [{ raw: biz.phone, e164: biz.phone.replace(/[^0-9+]/g, ''), type: 'work', is_whatsapp: true }] : [],
      emails: biz.email ? [biz.email] : [],
      raw_address: biz.address || 'Coimbatore, Tamil Nadu',
      tags: [biz.category || 'Verified Business', 'Directory Lead']
    };

    const saved = await apiClient.saveCard(payload, token);
    await loadUserVault(token);
    return saved;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    setPendingPhone('');
    setIsNewUser(false);
    setSavedCards([]);
    setMyBusinesses([]);
    try {
      localStorage.removeItem('cf_user');
      localStorage.removeItem('cf_token');
    } catch (e) {}
  };

  const switchActiveBusiness = (bizId) => {
    setActiveBusinessId(bizId);
  };

  const switchToOwnerMode = (newBizData = null) => {
    const updated = {
      ...user,
      role: 'owner',
      plan: user?.plan === 'free' ? 'plus' : user?.plan || 'plus',
      ownedBusinessIds: user?.ownedBusinessIds && user.ownedBusinessIds.length > 0
        ? user.ownedBusinessIds
        : ['biz-1', 'biz-3']
    };
    if (newBizData && newBizData.businessName) {
      updated.businessName = newBizData.businessName;
    }
    setUser(updated);
    setRole('owner');
    try {
      localStorage.setItem('cf_user', JSON.stringify(updated));
    } catch (e) {}
  };

  const switchToUserMode = () => {
    const updated = {
      ...user,
      role: 'user'
    };
    setUser(updated);
    setRole('user');
    try {
      localStorage.setItem('cf_user', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user,
        isNewUser,
        isLoading,
        pendingPhone,
        lastSentOtp,
        activeBusinessId,
        savedCards,
        myBusinesses,
        isBusinessSaved,
        saveBusinessToVault,
        loadUserVault,
        loadMyBusinesses,
        addMyBusiness,
        updateMyBusiness,
        sendOtp,
        verifyOtp,
        completeOnboarding,
        updateProfile,
        logout,
        switchActiveBusiness,
        switchToOwnerMode,
        switchToUserMode,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
