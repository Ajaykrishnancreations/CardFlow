import React, { createContext, useContext, useState, useEffect } from 'react';
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
    freeScansRemaining: 30,
    credits: 45,
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

  // Check saved session on startup
  useEffect(() => {
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
      }
    } catch (e) {
      console.warn('Could not read session storage', e);
    }
  }, []);

  const sendOtp = async (phone) => {
    setIsLoading(true);
    setPendingPhone(phone);
    
    // Trigger real backend API network call
    await apiClient.sendOtp(phone);
    
    setIsLoading(false);
    return { success: true, message: 'OTP sent successfully (Code: 123456)' };
  };

  const verifyOtp = async (phone, enteredOtp) => {
    setIsLoading(true);

    // Trigger real backend API network call
    const apiRes = await apiClient.verifyOtp(phone, enteredOtp);

    // Match against development test accounts
    let matchedAccount = null;
    let isBrandNew = false;

    // Check all configured accounts
    for (const key of Object.keys(DEV_TEST_ACCOUNTS)) {
      const acc = DEV_TEST_ACCOUNTS[key];
      if (acc.phone === phone && (enteredOtp === acc.otp || enteredOtp === '123456')) {
        matchedAccount = { ...acc };
        break;
      }
    }

    // If new number with OTP 123456
    if (!matchedAccount && (enteredOtp === '123456' || enteredOtp.length === 6)) {
      isBrandNew = true;
      matchedAccount = {
        phone,
        otp: '123456',
        role: 'user',
        name: '',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        plan: 'free',
        freeScansRemaining: 30,
        credits: 10,
        isIdVerified: false,
        isNewUser: true
      };
    }

    if (!matchedAccount) {
      setIsLoading(false);
      return { success: false, error: 'Invalid OTP. For dev testing, use OTP: 123456' };
    }

    const liveJwt = apiRes?.data?.access_token || `cf_jwt_${matchedAccount.role}_${Date.now()}`;
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

    setIsLoading(false);
    return { success: true, user: matchedAccount, isNewUser: isBrandNew };
  };

  const completeOnboarding = (profileData) => {
    const updatedUser = {
      ...user,
      name: profileData.name || 'CardFlow User',
      city: profileData.city || 'Coimbatore',
      state: profileData.state || 'Tamil Nadu',
      dob: profileData.dob || '',
      role: profileData.role || 'user',
      isNewUser: false,
      businessName: profileData.businessName || '',
      category: profileData.category || 'General',
      ownedBusinessIds: profileData.role === 'owner' ? ['biz-new-1'] : []
    };

    setUser(updatedUser);
    setRole(updatedUser.role);
    setIsNewUser(false);

    try {
      localStorage.setItem('cf_user', JSON.stringify(updatedUser));
    } catch (e) {}
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    setPendingPhone('');
    setIsNewUser(false);
    try {
      localStorage.removeItem('cf_user');
      localStorage.removeItem('cf_token');
    } catch (e) {}
  };

  const switchActiveBusiness = (bizId) => {
    setActiveBusinessId(bizId);
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
        activeBusinessId,
        sendOtp,
        verifyOtp,
        completeOnboarding,
        logout,
        switchActiveBusiness,
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
