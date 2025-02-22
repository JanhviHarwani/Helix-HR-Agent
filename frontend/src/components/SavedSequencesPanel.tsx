import React, { useEffect, useState } from 'react';
import { Sequence, SequenceStep, useAppContext } from '../context/AppContext';
import apiService from '../services/api';
import './SavedSequencesPanel.css';

interface SavedSequence {
  id: number;
  text: string;
}

const SavedSequencesPanel: React.FC = () => {
  const { userId,updateSequence } = useAppContext();
  const [sequences, setSequences] = useState<SavedSequence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (userId) {
      loadSequences();
    }
  }, [userId]);
  
  const loadSequences = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await apiService.getSequences(userId);
      setSequences(data);
    } catch (error) {
      console.error('Error loading sequences:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLoadSequence = (sequence: SavedSequence) => {
    // Parse the sequence text into steps
    const lines = sequence.text.split('\n\n');
    const steps: SequenceStep[] = [];
    
    let currentTitle = 'Loaded Sequence';
    
    // Extract title if present
    if (lines[0] && lines[0].startsWith('Title:')) {
      currentTitle = lines[0].substring(6).trim();
      lines.shift(); // Remove title line
    }
    
    // Convert text steps to sequence steps
    lines.forEach((line, index) => {
      if (line.trim()) {
        const stepMatch = line.match(/Step (\d+):(.*)/i);
        if (stepMatch) {
          const stepNumber = parseInt(stepMatch[1]);
          const content = stepMatch[2].trim();
          
          steps.push({
            id: `saved_${sequence.id}_step_${index}`,
            stepNumber: stepNumber,
            content: content,
            editable: true
          });
        }
      }
    });
    
    if (steps.length === 0) {
      // Fallback if parsing fails - treat the entire text as one step
      steps.push({
        id: `saved_${sequence.id}_step_1`,
        stepNumber: 1,
        content: sequence.text,
        editable: true
      });
    }
    
    // Create the sequence object
    const loadedSequence: Sequence = {
      id: `saved_${sequence.id}`,
      title: currentTitle,
      steps: steps,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Update the context with the loaded sequence
    updateSequence(loadedSequence);
  };
  
  if (isLoading) {
    return <div className="saved-sequences-panel">Loading saved sequences...</div>;
  }
  
  if (sequences.length === 0) {
    return (
      <div className="saved-sequences-panel">
        <h3>Saved Sequences</h3>
        <p>No saved sequences found.</p>
      </div>
    );
  }
  
  return (
    <div className="saved-sequences-panel">
      <h3>Saved Sequences</h3>
      <ul className="sequence-list">
        {sequences.map(sequence => (
          <li key={sequence.id} className="sequence-item">
            <div className="sequence-preview">
              {sequence.text.substring(0, 50)}...
            </div>
            <button onClick={() => handleLoadSequence(sequence)}>
              Load
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SavedSequencesPanel;