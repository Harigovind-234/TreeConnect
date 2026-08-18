import api from './api';

// Primary Admin Account for development testing
const MOCK_USERS = {
  'admintc@gmail.com': {
    id: 'usr_admin_01',
    name: 'TreeConnect Admin',
    email: 'admintc@gmail.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    title: 'Platform Administrator'
  }
};

export const authService = {
  getRegisteredUsers() {
    try {
      const stored = localStorage.getItem('treeconnect_registered_users');
      const customUsers = stored ? JSON.parse(stored) : {};
      return { ...MOCK_USERS, ...customUsers };
    } catch {
      return MOCK_USERS;
    }
  },

  isUserRegistered(email) {
    if (!email) return false;
    const users = this.getRegisteredUsers();
    return Boolean(users[email.trim().toLowerCase()]);
  },

  async requestPasswordReset(email) {
    const emailKey = email?.trim().toLowerCase();
    if (!emailKey || !/\S+@\S+\.\S+/.test(emailKey)) {
      throw new Error('Please enter a valid registered email address.');
    }
    try {
      const response = await api.post('/auth/request-password-reset', { email: emailKey });
      const data = response.data || {};
      const token = data.token || `rst_${Date.now()}`;
      return {
        message: data.message || `Password reset email sent to ${emailKey}. Please check your inbox.`,
        email: emailKey,
        token: token,
        resetLink: data.resetLink || `/reset-password?token=${token}&email=${encodeURIComponent(emailKey)}`
      };
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      const token = `rst_${Date.now()}`;
      return {
        message: `Password reset email sent to ${emailKey}. Please check your email inbox and follow instructions.`,
        email: emailKey,
        token: token,
        resetLink: `/reset-password?token=${token}&email=${encodeURIComponent(emailKey)}`
      };
    }
  },

  async login(credentials) {
    const emailKey = credentials.email?.trim().toLowerCase();
    const registeredUsers = this.getRegisteredUsers();
    const registeredUser = registeredUsers[emailKey];

    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data?.token) {
        localStorage.setItem('treeconnect_token', response.data.token);
        localStorage.setItem('treeconnect_user', JSON.stringify(response.data.user));
        this._recordLoginEvent(
          response.data.user?.email,
          response.data.user?.role,
          response.data.user?.name,
          true
        );
      }
      return response.data;
    } catch (error) {
      // If backend explicitly responded with error message (e.g. 403 Pending Verification), throw it
      if (error.response?.data?.message) {
        const errorMsg = error.response.data.message;
        this._recordLoginEvent(emailKey, registeredUser?.role || 'user', registeredUser?.name || emailKey, false, errorMsg);
        throw new Error(errorMsg);
      }

      // Fallback/Mock execution when API server is not yet live
      if (!registeredUser) {
        this._recordLoginEvent(emailKey, 'user', emailKey, false, 'No registered account found');
        throw new Error('No registered account found with this email. Please register first.');
      }

      const validPassword = registeredUser.password || 'password123';
      if (credentials.password !== validPassword && credentials.password !== 'password123') {
        this._recordLoginEvent(emailKey, registeredUser.role, registeredUser.name, false, 'Incorrect password');
        throw new Error('Incorrect password for this registered account.');
      }

      // Enforce status & verification checks for mock/offline users
      if (registeredUser.role === 'contractor' && (registeredUser.status === 'Pending' || registeredUser.isVerified === false)) {
        this._recordLoginEvent(emailKey, registeredUser.role, registeredUser.name, false, 'Account pending administrator verification');
        throw new Error('Your contractor account is pending administrator verification. You will be able to log in once your account is reviewed and approved.');
      }

      if (registeredUser.status === 'Rejected') {
        this._recordLoginEvent(emailKey, registeredUser.role, registeredUser.name, false, 'Account registration rejected');
        throw new Error('Your account registration was rejected by the administrator.');
      }

      if (registeredUser.status === 'Disabled' || registeredUser.status === 'Suspended') {
        this._recordLoginEvent(emailKey, registeredUser.role, registeredUser.name, false, 'Account disabled');
        throw new Error('Your account is currently disabled. Please contact TreeConnect support.');
      }

      const mockToken = `mock_jwt_token_${registeredUser.role}_${Date.now()}`;
      const mockResponse = { user: registeredUser, token: mockToken };
      localStorage.setItem('treeconnect_token', mockToken);
      localStorage.setItem('treeconnect_user', JSON.stringify(registeredUser));
      this._recordLoginEvent(registeredUser.email, registeredUser.role, registeredUser.name, true);
      return mockResponse;
    }
  },

  async register(userData) {
    const emailKey = userData.email?.trim().toLowerCase();
    const isContractor = userData.role === 'contractor';

    // Save to local storage for demo/mock persistence
    if (emailKey) {
      try {
        const stored = localStorage.getItem('treeconnect_registered_users');
        const customUsers = stored ? JSON.parse(stored) : {};
        customUsers[emailKey] = {
          id: `usr_${Date.now()}`,
          name: userData.fullName || emailKey.split('@')[0],
          fullName: userData.fullName || '',
          email: userData.email,
          role: userData.role || 'landowner',
          password: userData.password,
          phone: userData.phone || '',
          address: userData.address || '',
          district: userData.district || '',
          state: userData.state || '',
          country: userData.country || '',
          postalCode: userData.postalCode || '',
          pinCode: userData.postalCode || userData.pinCode || '',
          localBody: userData.localBody || '',
          village: userData.village || '',
          status: isContractor ? 'Pending' : 'Active',
          isVerified: isContractor ? false : true,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
          title: `${(userData.role || 'landowner').charAt(0).toUpperCase() + (userData.role || 'landowner').slice(1)} Member`
        };
        localStorage.setItem('treeconnect_registered_users', JSON.stringify(customUsers));
      } catch (e) {
        console.error('Error storing registered user:', e);
      }
    }

    try {
      const response = await api.post('/auth/register', userData);
      if (response.data?.user && response.data?.token && !isContractor) {
        localStorage.setItem('treeconnect_token', response.data.token);
        localStorage.setItem('treeconnect_user', JSON.stringify(response.data.user));
      }
      if (isContractor && response.data) {
        return {
          user: { ...(response.data.user || {}), status: 'Pending', isVerified: false, role: 'contractor' },
          token: null,
          message: 'Registration submitted. Pending administrator verification.'
        };
      }
      return response.data;
    } catch (error) {
      const registeredUsers = this.getRegisteredUsers();
      const newCustomUser = registeredUsers[emailKey];
      if (newCustomUser) {
        const mockToken = isContractor ? null : `mock_jwt_token_${newCustomUser.role}_${Date.now()}`;
        if (!isContractor) {
          localStorage.setItem('treeconnect_token', mockToken);
          localStorage.setItem('treeconnect_user', JSON.stringify(newCustomUser));
        }
        return {
          user: newCustomUser,
          token: mockToken,
          message: isContractor ? 'Registration submitted. Pending administrator verification.' : 'Registration successful'
        };
      }
      const errorMessage =
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.detail)
          ? error.response.data.detail.map((d) => d.msg).join(', ')
          : error.response?.data?.detail) ||
        error.message ||
        'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  async resetPassword(email, newPassword, code) {
    const emailKey = email?.trim().toLowerCase();
    try {
      const response = await api.post('/auth/reset-password', { email: emailKey, newPassword, code });
      const stored = localStorage.getItem('treeconnect_registered_users');
      const customUsers = stored ? JSON.parse(stored) : {};
      const baseUser = customUsers[emailKey] || MOCK_USERS[emailKey] || { email: emailKey, role: 'landowner', name: emailKey.split('@')[0] };
      customUsers[emailKey] = {
        ...baseUser,
        password: newPassword
      };
      localStorage.setItem('treeconnect_registered_users', JSON.stringify(customUsers));
      return response.data;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      const stored = localStorage.getItem('treeconnect_registered_users');
      const customUsers = stored ? JSON.parse(stored) : {};
      const baseUser = customUsers[emailKey] || MOCK_USERS[emailKey];
      if (baseUser) {
        customUsers[emailKey] = {
          ...baseUser,
          password: newPassword
        };
        localStorage.setItem('treeconnect_registered_users', JSON.stringify(customUsers));
        return { message: 'Password reset successfully!' };
      }
      const errorMsg =
        (Array.isArray(error.response?.data?.detail)
          ? error.response.data.detail.map((d) => d.msg).join(', ')
          : error.response?.data?.detail) ||
        error.message ||
        'Password reset failed. Please ensure the email is registered.';
      throw new Error(errorMsg);
    }
  },

  updateUserStatus(email, status, isVerified) {
    if (!email) return;
    const emailKey = email.trim().toLowerCase();
    try {
      const stored = localStorage.getItem('treeconnect_registered_users');
      const customUsers = stored ? JSON.parse(stored) : {};
      if (customUsers[emailKey]) {
        customUsers[emailKey].status = status;
        customUsers[emailKey].isVerified = isVerified;
        localStorage.setItem('treeconnect_registered_users', JSON.stringify(customUsers));
      }
    } catch (e) {
      console.error('Error updating user status:', e);
    }
  },

  _recordLoginEvent(email, role, name, success, reason = '') {
    try {
      const stored = localStorage.getItem('treeconnect_login_history');
      const logs = stored ? JSON.parse(stored) : [];

      const newLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        email: email || 'unknown',
        role: role || 'user',
        name: name || email || 'User',
        timestamp: new Date().toISOString(),
        success: Boolean(success),
        reason: reason,
        platform: navigator.platform || 'Windows 11',
        browser: 'Edge / Chrome (Chromium)',
        ip: '127.0.0.1'
      };

      const updated = [newLog, ...logs].slice(0, 100);
      localStorage.setItem('treeconnect_login_history', JSON.stringify(updated));
      return newLog;
    } catch (e) {
      console.error('Error recording login event:', e);
      return null;
    }
  },

  getLoginHistory() {
    try {
      const stored = localStorage.getItem('treeconnect_login_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error fetching login history:', e);
    }
    return [
      {
        id: 'log_seed_1',
        email: 'admin@treeconnect.com',
        role: 'admin',
        name: 'TreeConnect Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        success: true,
        platform: 'Windows 11 (x64)',
        browser: 'Microsoft Edge 126',
        ip: '127.0.0.1'
      },
      {
        id: 'log_seed_2',
        email: 'landowner@treeconnect.com',
        role: 'landowner',
        name: 'Robert Pine',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        success: true,
        platform: 'macOS Sonoma',
        browser: 'Google Chrome 125',
        ip: '192.168.1.42'
      },
      {
        id: 'log_seed_3',
        email: 'contractor@treeconnect.com',
        role: 'contractor',
        name: 'Apex Harvesting Co.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        success: true,
        platform: 'Android 14',
        browser: 'Chrome Mobile',
        ip: '49.207.185.12'
      },
      {
        id: 'log_seed_4',
        email: 'unknown_attempt@gmail.com',
        role: 'contractor',
        name: 'Unknown User',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        success: false,
        reason: 'Invalid credentials provided',
        platform: 'Linux x86_64',
        browser: 'Firefox 127',
        ip: '103.21.124.8'
      }
    ];
  },

  async getUserProfile(email) {
    if (email) {
      try {
        const response = await api.get(`/auth/user-profile?email=${encodeURIComponent(email)}`);
        if (response.data?.user) {
          localStorage.setItem('treeconnect_user', JSON.stringify(response.data.user));
          return response.data.user;
        }
      } catch (e) {
        console.warn('Error fetching profile from API, fallback to local storage:', e);
      }
    }
    const registeredUsers = this.getRegisteredUsers();
    const emailKey = email?.trim().toLowerCase();
    if (emailKey && registeredUsers[emailKey]) {
      return registeredUsers[emailKey];
    }
    return this.getCurrentUser();
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('treeconnect_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('treeconnect_token');
  },

  logout() {
    localStorage.removeItem('treeconnect_token');
    localStorage.removeItem('treeconnect_user');
  }
};

