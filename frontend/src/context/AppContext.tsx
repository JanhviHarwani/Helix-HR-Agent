import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

// Define types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SequenceStep {
  id: string;
  stepNumber: number;
  content: string;
  editable: boolean;
}

export interface Sequence {
  id: string;
  title: string;
  steps: SequenceStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface AppContextType {
  // User state
  
  userId: number | null;
  
  // Chat state
  messages: Message[];
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  isProcessing: boolean;
  
  // Sequence state
  sequence: Sequence | null;
  setSequence: (sequence: Sequence) => void;
  updateSequenceStep: (stepId: string, content: string) => void;
  saveSequence: () => Promise<void>;
  
  // Init state
  isInitialized: boolean;
  error: string | null;

  updateSequence: (updatedSequence: Sequence) => void;  
  activeSessionId: number | null;
  setActiveSession: (sessionId: number) => Promise<void>;
}

// Create context with default values
const AppContext = createContext<AppContextType>({
  userId: null,
  
  messages: [],
  addMessage: () => {},
  isProcessing: false,
  
  sequence: null,
  setSequence: () => {},
  updateSequenceStep: () => {},
  saveSequence: async () => {},
  
  isInitialized: false,
  error: null,
  updateSequence:()=>{},
  activeSessionId: null,
  setActiveSession: async () => Promise.resolve()
});

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User state - using a default user ID for simplicity
  const [userId, setUserId] = useState<number | null>(1);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Sequence state
  const [sequence, setSequenceState] = useState<Sequence | null>(null);
  
  // Init state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if backend is available
        await apiService.checkHealth();
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Hi! I'm Helix, your recruiting assistant. How can I help you create an outreach sequence today?",
          timestamp: new Date(),
        };
        
        setMessages([welcomeMessage]);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to connect to backend:', err);
        setError('Failed to connect to the backend. Make sure the backend server is running.');
        
        // Fall back to local mode
        fallbackToLocalMode();
      }
    };
    
    initApp();
  }, []);
  const setActiveSession = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    
    // Clear current messages
    setMessages([]);
    setIsProcessing(true);
    
    try {
      const messages = await apiService.getSessionMessages(sessionId);
      
      // Convert to your Message format
      const formattedMessages = messages.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading session messages:', error);
      // Add fallback welcome message if loading fails
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hi! I'm Helix, your recruiting assistant. How can I help you create an outreach sequence today?",
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  // Fallback to local mode if backend is not available
  const fallbackToLocalMode = () => {
    // Add welcome message with fallback note
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Hi! I'm Helix, your recruiting assistant. How can I help you create an outreach sequence today? (Note: Running in local mode - backend not connected)",
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    setUserId(999); // Dummy user ID
    setIsInitialized(true);
  };
  
  // Function to add a new message
  const addMessage = async (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    
    // Save to backend if we have an active session
    if (activeSessionId) {
      try {
        await apiService.addMessage(activeSessionId, role, content);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    }
    
    // Process user messages
    if (role === 'user') {
      handleUserMessage(content);
    }
  };
  
// In your handleUserMessage function in AppContext.tsx
const handleUserMessage = async (content: string) => {
  setIsProcessing(true);
  
  try {
    // Generate response from backend
    const response = await apiService.generateSequence(content);
    
    // Check if response looks like JSON
    let displayMessage = response.response;
    if (response.response.trim().startsWith('{')) {
      try {
        const jsonData = JSON.parse(response.response);
        
        // Create a user-friendly message instead of showing raw JSON
        displayMessage = `I've created a "${jsonData.title}" sequence with ${jsonData.steps.length} steps. You can view and edit it in the workspace panel.`;
        
        // Create sequence from parsed JSON
        if (jsonData.title && jsonData.steps) {
          const sequenceSteps = jsonData.steps.map((step: any, index: number) => {
            let content = '';
            const stepKey = `Step ${index + 1}`;
            
            if (step[stepKey]) {
              const stepContent = step[stepKey].Content || '';
              const stepStrategy = step[stepKey].Strategy || '';
              
              content = stepContent;
              if (stepStrategy) {
                content += `\nStrategy: ${stepStrategy}`;
              }
            }
            
            return {
              id: `step_${index + 1}`,
              stepNumber: index + 1,
              content: content,
              editable: true
            };
          });
          
          const newSequence: Sequence = {
            id: 'local',
            title: jsonData.title,
            steps: sequenceSteps,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // This is the key line - it updates the sequence in the workspace
          setSequence(newSequence);
        }
      } catch (jsonError) {
        console.error("Error parsing JSON from response:", jsonError);
      }
    }
    
    // Add AI response to messages with the friendly message
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: displayMessage,
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, aiMessage]);
  } catch (err) {
    console.error('Error processing message:', err);
    // Error handling code...
  } finally {
    setIsProcessing(false);
  }
};

// Function to create a sequence from JSON response
const createSequenceFromJson = (json: any) => {
  try {
    // Format steps
    const sequenceSteps: SequenceStep[] = json.steps.map((step: any, index: number) => {
      let content = '';
      
      // Handle different possible step formats
      if (step[`Step ${index + 1}`]) {
        const stepContent = step[`Step ${index + 1}`]['Content'] || '';
        const stepStrategy = step[`Step ${index + 1}`]['Strategy'] || '';
        
        content = stepContent;
        if (stepStrategy) {
          content += `\nStrategy: ${stepStrategy}`;
        }
      }
      
      return {
        id: `step_${index + 1}`,
        stepNumber: index + 1,
        content: content,
        editable: true
      };
    });
    
    const newSequence: Sequence = {
      id: 'local',
      title: json.title || 'Sales Outreach Sequence',
      steps: sequenceSteps,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSequence(newSequence);
    
    // Add message about sequence creation
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'I\'ve created a sales outreach sequence based on our conversation. You can view and edit it in the workspace.',
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, aiMessage]);
  } catch (error) {
    console.error("Error creating sequence from JSON:", error);
    
    // Fall back to text parsing
    createSequenceFromResponse(JSON.stringify(json));
  }
};
  
  // Function to create a sequence from AI response
// Function to create a sequence from AI response
const createSequenceFromResponse = (response: string) => {
  try {
    // Try to parse the response as JSON
    let parsedResponse;
    try {
      // First, try to parse the entire response as JSON
      parsedResponse = JSON.parse(response);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error("Failed to parse JSON from regex match", innerError);
        }
      }
    }

    // If we successfully parsed JSON and it has the expected structure
    if (parsedResponse && parsedResponse.steps && Array.isArray(parsedResponse.steps)) {
      // Format steps properly
      const sequenceSteps: SequenceStep[] = parsedResponse.steps.map((step: any, index: any) => {
        // Handle different possible step formats
        let content = '';
        let stepNumber = index + 1;
        
        if (typeof step === 'string') {
          content = step;
        } else if (step && typeof step === 'object') {
          // If step is like {Step 1: {...}} or {0: {Step 1: {...}}}
          if (step['Content']) {
            content = step['Content'];
          } else if (step['content']) {
            content = step['content'];
          } else if (step[`Step ${index + 1}`]) {
            content = step[`Step ${index + 1}`]['Content'] || step[`Step ${index + 1}`]['content'] || '';
          }
          
          // Try to get step number if available
          if (step['stepNumber']) {
            stepNumber = step['stepNumber'];
          }
        }
        
        return {
          id: `step_${index + 1}`,
          stepNumber: stepNumber,
          content: content,
          editable: true
        };
      });
      
      // Get title if available
      const title = parsedResponse.title || 'Sales Outreach Sequence';
      
      const newSequence: Sequence = {
        id: 'local',
        title,
        steps: sequenceSteps,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setSequence(newSequence);
      
      // Add message about sequence creation
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ve created a recruiting sequence based on our conversation. You can view and edit it in the workspace.',
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      return;
    }
    
    // Fallback to text parsing if JSON parsing fails
    let steps = [];
    
    // First, try to identify numbered steps (1., 2., etc.)
    const numberedStepRegex = /\d+\.\s+(.*?)(?=\d+\.|$)/g;
    const matchIterator = response.matchAll(numberedStepRegex);
    const numberedMatches = Array.from(matchIterator);
    
    if (numberedMatches.length >= 2) {
      // If we found numbered steps, use those
      steps = numberedMatches.map(match => match[1].trim());
    } else {
      // Otherwise, just split by paragraphs and take the most meaningful parts
      steps = response.split(/\n\n+/)
        .filter(step => step.trim().length > 30) // Only meaningful paragraphs
        .slice(0, 3); // Limit to 3 steps
    }
    
    // If we still don't have enough steps, extract sentences
    if (steps.length < 2) {
      const sentences = response.split(/\.\s+/).filter(s => s.length > 30);
      steps = sentences.slice(0, Math.min(3, sentences.length));
    }
    
    // Create structured steps
    const sequenceSteps: SequenceStep[] = steps.map((content, index) => ({
      id: `step_${index + 1}`,
      stepNumber: index + 1,
      content: content.trim(),
      editable: true
    }));
    
    // If we couldn't parse any meaningful steps, create a fallback
    if (sequenceSteps.length === 0) {
      sequenceSteps.push({
        id: 'step_1',
        stepNumber: 1,
        content: response,
        editable: true
      });
    }
    
    // Extract a title from the response, or use default
    let title = 'Sales Outreach Sequence';
    const subjectMatch = response.match(/Subject:(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      title = subjectMatch[1].trim();
    }
    
    const newSequence: Sequence = {
      id: 'local',
      title,
      steps: sequenceSteps,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSequence(newSequence);
    
    // Add message about sequence creation
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'I\'ve created a sales outreach sequence based on our conversation. You can view and edit it in the workspace.',
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, aiMessage]);
  } catch (error) {
    console.error("Error creating sequence from response:", error);
    
    // Add error message
    const errorMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'I encountered an error while creating the sequence. Please try again.',
      timestamp: new Date(),
    };
    
    setMessages((prevMessages) => [...prevMessages, errorMessage]);
  }
};
  
  // Function to set the sequence
  const setSequence = (newSequence: Sequence) => {
    setSequenceState(newSequence);
  };
  
  // Function to update a sequence step
  const updateSequenceStep = (stepId: string, content: string) => {
    if (!sequence) return;
    
    const updatedSteps = sequence.steps.map(step => 
      step.id === stepId ? { ...step, content } : step
    );
    
    setSequenceState({
      ...sequence,
      steps: updatedSteps,
      updatedAt: new Date(),
    });
  };
  
  // Function to save the sequence to the database
  const saveSequence = async () => {
    if (!sequence || !userId) return;
    
    try {
      // Convert sequence to text format for saving
      const sequenceText = sequence.steps
        .map(step => `Step ${step.stepNumber}: ${step.content}`)
        .join('\n\n');
      
      // Save to backend
      await apiService.saveSequence(userId, sequenceText);
      
      // Notify user
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Your sequence has been saved successfully!',
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (err) {
      console.error('Error saving sequence:', err);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't save your sequence. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };
  const updateSequence = (updatedSequence: Sequence) => {
    setSequenceState(updatedSequence);
    
    // If connected to a backend, update there too
    if (updatedSequence.id !== 'local' && userId) {
      // Optional: Add code to update on the backend
    }
  };
  const contextValue: AppContextType = {
    userId,
    activeSessionId,
    setActiveSession,
    messages,
    addMessage,
    isProcessing,
    sequence,
    setSequence,
    updateSequenceStep,
    saveSequence,
    updateSequence,
    isInitialized,
    error,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
