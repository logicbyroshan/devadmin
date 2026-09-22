/**
 * DevAdmin & DevMate Centralized REST API Service Layer
 * Connects React UI to Django REST Framework backend with full Admin CRUD (/api/v1/admin/*)
 * and Public Serving API (/api/*).
 */

function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) {
    if (import.meta.env.DEV) {
      return 'http://localhost:8000/api';
    }
    return 'https://devadmin-api.logicbyroshan.in/api';
  }
  const trimmed = envUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE_URL = getApiBaseUrl();

// Helper for HTTP requests with automatic JWT Bearer token attachment and 401 refresh
async function request(endpoint, options = {}, isRetry = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration / 401 Unauthorized
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/token/')) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/v1/admin/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (data.access) {
              localStorage.setItem('access_token', data.access);
              return request(endpoint, options, true);
            }
          }
        } catch {
          // Token refresh failed; proceed to error handling
        }
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.error || errData.detail || errData.message || (typeof errData === 'object' ? Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join(' | ') : null) || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) return true;
    return await response.json();
  } catch (error) {
    console.warn(`[DevAdmin API] ${options.method || 'GET'} ${endpoint} failed:`, error.message);
    throw error;
  }
}

// 1. Authentication API (/api/v1/admin/auth/*)
export const authApi = {
  login: (username, password) => request('/v1/admin/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  register: (userData) => request('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  refreshToken: (refresh) => request('/v1/admin/auth/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  }),
  getMe: () => request('/v1/admin/auth/me/'),
  changePassword: (current_password, new_password) => request('/v1/admin/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  }),
};

// 2. Profile & Hero Settings API (/api/v1/admin/profile/*)
export const profilesApi = {
  getAdminProfile: () => request('/v1/admin/profile/'),
  updateAdminProfile: (data) => request('/v1/admin/profile/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  uploadImage: (formData) => request('/v1/admin/profile/upload-image/', {
    method: 'POST',
    body: formData,
  }),
  deleteImage: () => request('/v1/admin/profile/delete-image/', { method: 'DELETE' }),
  uploadHeroImage: (formData) => request('/v1/admin/profile/upload-hero-image/', {
    method: 'POST',
    body: formData,
  }),
  deleteHeroImage: () => request('/v1/admin/profile/delete-hero-image/', { method: 'DELETE' }),
  uploadDocument: (formData) => request('/v1/admin/profile/upload-document/', {
    method: 'POST',
    body: formData,
  }),
  deleteDocument: (type = 'resume') => request(`/v1/admin/profile/delete-document/?type=${type}`, { method: 'DELETE' }),
  getByWebsite: (websiteSlug) => request(`/profiles/?website=${websiteSlug}`),
  update: (id, data) => request(`/profiles/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/profiles/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// 3. Projects API (/api/v1/admin/projects/* & /api/projects/*)
export const projectsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/admin/projects/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/v1/admin/projects/${id}/`),
  getBySlug: (slug) => request(`/projects/${slug}/`),
  create: (data) => request('/v1/admin/projects/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/v1/admin/projects/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/v1/admin/projects/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/v1/admin/projects/${id}/`, { method: 'DELETE' }),
  toggleActive: (id) => request(`/v1/admin/projects/${id}/toggle-active/`, { method: 'POST' }),
  toggleVisibility: (id) => request(`/v1/admin/projects/${id}/toggle-active/`, { method: 'POST' }),
  uploadScreenshots: (id, formData) => request(`/v1/admin/projects/${id}/upload-screenshots/`, {
    method: 'POST',
    body: formData,
  }),
  deleteScreenshot: (projectId, screenshotId) => request(`/v1/admin/projects/${projectId}/screenshots/${screenshotId}/`, {
    method: 'DELETE',
  }),
  reorder: (orderMap) => request('/v1/admin/projects/reorder/', {
    method: 'POST',
    body: JSON.stringify({ order_map: orderMap }),
  }),
  bulkStatus: (projectIds, statusVal, isActive) => request('/v1/admin/projects/bulk-status/', {
    method: 'POST',
    body: JSON.stringify({ project_ids: projectIds, status: statusVal, is_active: isActive }),
  }),
  like: (idOrSlug) => request(`/projects/${idOrSlug}/like/`, { method: 'POST' }),
  view: (idOrSlug) => request(`/projects/${idOrSlug}/view/`, { method: 'POST' }),
};

// 4. Blogs API (/api/v1/admin/blogs/* & /api/blogs/*)
export const blogsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/admin/blogs/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/v1/admin/blogs/${id}/`),
  getBySlug: (slug) => request(`/blogs/${slug}/`),
  create: (data) => request('/v1/admin/blogs/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/v1/admin/blogs/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/v1/admin/blogs/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/v1/admin/blogs/${id}/`, { method: 'DELETE' }),
  toggleActive: (id) => request(`/v1/admin/blogs/${id}/toggle-active/`, { method: 'POST' }),
  toggleVisibility: (id) => request(`/v1/admin/blogs/${id}/toggle-active/`, { method: 'POST' }),
};

// 5. Experiences API (/api/v1/admin/experience/*)
export const experiencesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/admin/experience/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/v1/admin/experience/${id}/`),
  create: (data) => request('/v1/admin/experience/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/v1/admin/experience/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/v1/admin/experience/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/v1/admin/experience/${id}/`, { method: 'DELETE' }),
  uploadImages: (id, formData) => request(`/v1/admin/experience/${id}/upload-images/`, {
    method: 'POST',
    body: formData,
  }),
  deleteImage: (expId, imageId) => request(`/v1/admin/experience/${expId}/images/${imageId}/`, {
    method: 'DELETE',
  }),
  toggleVisibility: (id) => request(`/experiences/${id}/toggle_visibility/`, { method: 'POST' }),
};

// 6. Skills API (/api/v1/admin/skills/*)
export const skillsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/admin/skills/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/v1/admin/skills/${id}/`),
  create: (data) => request('/v1/admin/skills/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/v1/admin/skills/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/v1/admin/skills/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/v1/admin/skills/${id}/`, { method: 'DELETE' }),
  reorder: (orderMap) => request('/v1/admin/skills/reorder/', {
    method: 'POST',
    body: JSON.stringify({ order_map: orderMap }),
  }),
  toggleVisibility: (id) => request(`/skills/${id}/toggle_visibility/`, { method: 'POST' }),
};

// 7. Categories API (/api/v1/admin/categories/*)
export const categoriesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/admin/categories/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/v1/admin/categories/${id}/`),
  create: (data) => request('/v1/admin/categories/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/v1/admin/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/v1/admin/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/v1/admin/categories/${id}/`, { method: 'DELETE' }),
};

// 8. Achievements API (/api/v1/admin/achievements/*)
export const achievementsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/admin/achievements/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/v1/admin/achievements/${id}/`),
  create: (data) => request('/v1/admin/achievements/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/v1/admin/achievements/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/v1/admin/achievements/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/v1/admin/achievements/${id}/`, { method: 'DELETE' }),
};

// 9. Contact Messages API (/api/v1/admin/messages/*)
export const contactsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/v1/admin/messages/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/v1/admin/messages/${id}/`),
  create: (data) => request('/v1/admin/messages/', { method: 'POST', body: JSON.stringify(data) }),
  reply: (id, replySubject, replyText) => request(`/contacts/${id}/reply/`, {
    method: 'POST',
    body: JSON.stringify({ reply_subject: replySubject, reply_text: replyText }),
  }),
  toggleStar: (id) => request(`/contacts/${id}/toggle_star/`, { method: 'POST' }),
  markRead: (id) => request(`/contacts/${id}/mark_read/`, { method: 'POST' }),
  bulkAction: (messageIds, actionName) => request('/v1/admin/messages/bulk-action/', {
    method: 'POST',
    body: JSON.stringify({ message_ids: messageIds, action: actionName }),
  }),
  delete: (id) => request(`/v1/admin/messages/${id}/`, { method: 'DELETE' }),
};

// 10. FAQs API (/api/faqs/*)
export const faqsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/faqs/${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/faqs/${id}/`),
  create: (data) => request('/faqs/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/faqs/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/faqs/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/faqs/${id}/`, { method: 'DELETE' }),
  toggleVisibility: (id) => request(`/faqs/${id}/toggle_visibility/`, { method: 'POST' }),
};

// 11. Websites API (/api/websites/*)
export const websitesApi = {
  getAll: () => request('/websites/'),
  getBySlug: (slug) => request(`/websites/${slug}/`),
  update: (slug, data) => request(`/websites/${slug}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (slug, data) => request(`/websites/${slug}/`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// 10. Dashboard Analytics API
export const dashboardApi = {
  getAnalytics: () => request('/v1/admin/analytics/dashboard/'),
  getStats: (websiteSlug) => request(`/dashboard/stats/${websiteSlug ? `?website=${websiteSlug}` : ''}`),
  getActivities: (websiteSlug) => request(`/dashboard/activities/${websiteSlug ? `?website=${websiteSlug}` : ''}`),
  getHeatmap: () => request('/dashboard/heatmap/'),
};

// 11. Public Serving API (/api/*)
export const publicApi = {
  getBootstrap: () => request('/bootstrap/'),
  getSummary: () => request('/summary/'),
  getProfile: () => request('/profile/'),
  getBanners: () => request('/banners/'),
  submitContact: (data) => request('/contact/', { method: 'POST', body: JSON.stringify(data) }),
  rexiChat: (message) => request('/rexi/chat/', { method: 'POST', body: JSON.stringify({ message }) }),
};

// 12. Health Diagnostics API
export const healthApi = {
  check: () => request('/health/'),
};

export default {
  auth: authApi,
  profiles: profilesApi,
  projects: projectsApi,
  blogs: blogsApi,
  experiences: experiencesApi,
  skills: skillsApi,
  categories: categoriesApi,
  achievements: achievementsApi,
  contacts: contactsApi,
  dashboard: dashboardApi,
  public: publicApi,
  health: healthApi,
};
