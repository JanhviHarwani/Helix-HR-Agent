import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000';

// Sequence types
export interface SequenceData {
  id: number;
  text: string;
}
// Add these to apiService.ts
export interface SessionInfo {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}
// User types
export interface UserData {
  id: number;
  name: string;
  email: string;
}

// Types for generating sequence
export interface GenerateSequenceRequest {
  message: string;
}

export interface GenerateSequenceResponse {
  response: string;
  json?: {
    title: string;
    steps: any[];
  };
}

// Types for saving sequence
export interface SaveSequenceRequest {
  user_id: number;
  sequence_text: string;
}

// Create an axios instance with CORS configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// API service
const apiService = {
  // Health check
  checkHealth: async () => {
    const response = await axiosInstance.get('');
    return response.data;
  },
  
  // Generate a sequence
  generateSequence: async (message: string) => {
    const response = await axiosInstance.post<GenerateSequenceResponse>(
      `/generate_sequence`,
      { message }
    );
    return response.data;
  },
  
  // Save a sequence
  saveSequence: async (userId: number, sequenceText: string) => {
    const response = await axiosInstance.post(
      `/save_sequence`,
      {
        user_id: userId,
        sequence_text: sequenceText
      }
    );
    return response.data;
  },
  
  // Get saved sequences for a user
  getSequences: async (userId: number) => {
    try {
        const response = await axiosInstance.get(`/get_sequences/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching sequences:", error);
        return [];
    }
  },
  // Session management
createSession: async (userId: number, title?: string) => {
  const response = await axiosInstance.post(`/api/sessions`, {
    user_id: userId,
    title
  });
  return response.data;
},

getSessions: async (userId: number) => {
  try {
    const response = await axiosInstance.get(`/api/sessions?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
},

// Message management
addMessage: async (sessionId: number, role: string, content: string) => {
  const response = await axiosInstance.post(`/api/chat/message`, {
    session_id: sessionId,
    role,
    content
  });
  return response.data;
},

getSessionMessages: async (sessionId: number) => {
  try {
    const response = await axiosInstance.get(`/api/chat/history/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}
};

export default apiService;