import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include teacher ID in headers
apiClient.interceptors.request.use(
  config => {
    const teacherId = localStorage.getItem('teacherId');
    if (teacherId) {
      config.headers['x-teacher-id'] = teacherId;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// API service methods
const apiService = {
  // Teacher endpoints
  getTeachers: async () => {
    return apiClient.get('/api/teachers');
  },
  
  getTeacher: async (id) => {
    return apiClient.get(`/api/teachers/${id}`);
  },
  
  createTeacher: async (teacherData) => {
    return apiClient.post('/api/teachers', teacherData);
  },
  
  // Student endpoints
  getStudents: async () => {
    return apiClient.get('/api/students');
  },
  
  getStudent: async (id) => {
    return apiClient.get(`/api/students/${id}`);
  },
  
  createStudent: async (studentData) => {
    return apiClient.post('/api/students', studentData);
  },
  
  // Tutoring request endpoints
  getTutoringRequests: async () => {
    return apiClient.get('/api/tutoring');
  },
  
  createTutoringRequest: async (requestData) => {
    return apiClient.post('/api/tutoring', requestData);
  },
  
  // NEW: Create tutoring request with override
  createTutoringRequestWithOverride: async (requestData) => {
    return apiClient.post('/api/tutoring', {
      ...requestData,
      override: true
    });
  },
  
  // NEW: Check priority for a specific date
  checkPriorityForDate: async (date) => {
    return apiClient.get(`/api/tutoring/priority/${date}`);
  },
  
  cancelTutoringRequest: async (requestId) => {
    return apiClient.put(`/api/tutoring/cancel/${requestId}`);
  },
  
  // Enhanced error formatting to handle conflict responses
  formatError: (error) => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.data && error.response.data.msg) {
        errorMessage = error.response.data.msg;
      } else {
        errorMessage = `Server error: ${error.response.status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }
    
    return errorMessage;
  },

  // NEW: Helper to check if error is a conflict that can be overridden
  isOverridableConflict: (error) => {
    return error.response && 
           error.response.status === 409 && 
           error.response.data && 
           error.response.data.requireOverride === true;
  },

  // NEW: Get conflict details from error response
  getConflictDetails: (error) => {
    if (error.response && error.response.data && error.response.data.conflict) {
      return error.response.data.conflict;
    }
    return null;
  }
};

export default apiService;