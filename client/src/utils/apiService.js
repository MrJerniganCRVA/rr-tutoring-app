import axios from 'axios';

const API_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

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
    return apiClient.get('/teachers');
  },
  
  getTeacher: async (id) => {
    return apiClient.get(`/teachers/${id}`);
  },
  
  createTeacher: async (teacherData) => {
    return apiClient.post('/teachers', teacherData);
  },
  
  // Student endpoints
  getStudents: async () => {
    return apiClient.get('/students');
  },
  
  getStudent: async (id) => {
    return apiClient.get(`/students/${id}`);
  },
  
  createStudent: async (studentData) => {
    return apiClient.post('/students', studentData);
  },
  
  // Tutoring request endpoints
  getTutoringRequests: async () => {
    return apiClient.get('/tutoring');
  },
  
  createTutoringRequest: async (requestData) => {
    return apiClient.post('/tutoring', requestData);
  },
  
  cancelTutoringRequest: async (requestId) => {
    return apiClient.put(`/tutoring/cancel/${requestId}`);
  },
  
  // Helper method to format errors
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
  }
};

export default apiService;
