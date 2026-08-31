import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockBusinesses } from '../data/mockData';

// Fixed Development Test Accounts (Strictly for DEV environment)
export const DEV_TEST_ACCOUNTS = {
  NORMAL_USER: {
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
  },
  BUSINESS_OWNER: {
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
  ADMIN: {
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
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsLoading(false);
    return { success: true, message: 'OTP sent successfully' };
  };

  const verifyOtp = async (phone, enteredOtp) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Match against development test accounts
    let matchedAccount = null;
    if (phone === DEV_TEST_ACCOUNTS.NORMAL_USER.phone && enteredOtp === DEV_TEST_ACCOUNTS.NORMAL_USER.otp) {
      matchedAccount = DEV_TEST_ACCOUNTS.NORMAL_USER;
    } else if (phone === DEV_TEST_ACCOUNTS.BUSINESS_OWNER.phone && enteredOtp === DEV_TEST_ACCOUNTS.BUSINESS_OWNER.otp) {
      matchedAccount = DEV_TEST_ACCOUNTS.BUSINESS_OWNER;
    } else if (phone === DEV_TEST_ACCOUNTS.ADMIN.phone && enteredOtp === DEV_TEST_ACCOUNTS.ADMIN.otp) {
      matchedAccount = DEV_TEST_ACCOUNTS.ADMIN;
    } else if (enteredOtp === '123456') {
      // Default dev fallback
      matchedAccount = {
        phone,
        otp: '123456',
        role: 'user',
        name: 'CardFlow User',
        city: 'Coimbatore',
        plan: 'free',
        freeScansRemaining: 30,
        credits: 10
      };
    }

    if (!matchedAccount) {
      setIsLoading(false);
      return { success: false, error: 'Invalid OTP or phone number. For dev, use OTP: 123456' };
    }

    const mockJwt = `cf_jwt_${matchedAccount.role}_${Date.now()}`;
    setUser(matchedAccount);
    setRole(matchedAccount.role);
    setToken(mockJwt);

    if (matchedAccount.role === 'owner' && matchedAccount.ownedBusinessIds?.length) {
      setActiveBusinessId(matchedAccount.ownedBusinessIds[0]);
    }

    try {
      localStorage.setItem('cf_user', JSON.stringify(matchedAccount));
      localStorage.setItem('cf_token', mockJwt);
    } catch (e) {
      // Ignore in non-web environments
    }

    setIsLoading(false);
    return { success: true, user: matchedAccount };
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    setPendingPhone('');
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
        isLoading,
        pendingPhone,
        activeBusinessId,
        sendOtp,
        verifyOtp,
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
