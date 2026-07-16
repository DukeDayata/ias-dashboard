const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('ias_user'));
  if (user && user.token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.token}`
    };
  }
  return { 'Content-Type': 'application/json' };
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Login failed');
  return data;
};

export const fetchWfpData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/wfp`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('unauthorized');
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching WFP data:', error);
    throw error;
  }
};

export const saveWfpData = async (activities) => {
  try {
    const response = await fetch(`${API_BASE_URL}/wfp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activities)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error saving WFP data:', error);
    throw error;
  }
};

export const fetchBudgetData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/budget`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('unauthorized');
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Budget data:', error);
    throw error;
  }
};

export const saveBudgetData = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budget`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error saving Budget data:', error);
    throw error;
  }
};

export const updateWfpActivity = async (id, updatedData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/wfp/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating WFP activity:', error);
    throw error;
  }
};

export const deleteWfpActivity = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/wfp/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error deleting WFP activity:', error);
    throw error;
  }
};

export const updateBudgetTransaction = async (id, updatedData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budget/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating budget transaction:', error);
    throw error;
  }
};

export const deleteBudgetTransaction = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budget/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error deleting budget transaction:', error);
    throw error;
  }
};

export const addWfpActivity = async (activityData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/wfp/single`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activityData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error adding WFP activity:', error);
    throw error;
  }
};

export const addBudgetTransaction = async (transactionData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/budget/transactions/single`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transactionData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error adding budget transaction:', error);
    throw error;
  }
};

// --- PROFILE ---
export const fetchProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// --- USER ROUTES ---
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
    return data;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const fetchAuditLogs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/audit`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP error! status: ${response.status}`);
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

