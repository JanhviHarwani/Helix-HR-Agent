import React, { useState } from 'react';
import { useAppContext, SequenceStep } from '../context/AppContext';
import './WorkspaceComponent.css';

const WorkspaceComponent: React.FC = () => {
  const { sequence, updateSequenceStep, saveSequence, updateSequence } = useAppContext();
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  const handleStartEdit = (step: SequenceStep) => {
    setEditingStepId(step.id);
    setEditContent(step.content);
  };

 
  const handleSaveEdit = () => {
    if (editingStepId) {
      updateSequenceStep(editingStepId, editContent);
      setEditingStepId(null);
    }
  };


  const handleCancelEdit = () => {
    setEditingStepId(null);
  };
  

  const handleSaveSequence = async () => {
    setIsSaving(true);
    try {
      await saveSequence();
    } finally {
      setIsSaving(false);
    }
  };


    const handleAddStep = () => {
      if (!sequence) return;
      
      const newStepNumber = sequence.steps.length + 1;
      const newStep: SequenceStep = {
        id: `step_${Date.now()}`,
        stepNumber: newStepNumber,
        content: `Content for step ${newStepNumber}`,
        editable: true
      };
      
      const updatedSteps = [...sequence.steps, newStep];
      

      updateSequence({
        ...sequence,
        steps: updatedSteps,
        updatedAt: new Date()
      });
    };


  const renderSequenceStep = (step: SequenceStep) => {
    const isEditing = editingStepId === step.id;
    
    // Check if content contains a strategy field
    let contentText = step.content;
    let strategyText = '';
    
    if (step.content.includes('Strategy:')) {
      const parts = step.content.split('Strategy:');
      contentText = parts[0].trim();
      strategyText = parts[1].trim();
    }
    
    return (
      <div key={step.id} className="sequence-step">
        <div className="step-header">
          <h3>Step {step.stepNumber}</h3>
          {!isEditing && step.editable && (
            <button 
              className="edit-button"
              onClick={() => handleStartEdit(step)}
            >
              Edit
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="step-edit-container">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="step-edit-textarea"
            />
            <div className="step-edit-actions">
              <button onClick={handleSaveEdit}>Save</button>
              <button onClick={handleCancelEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="step-content">
            <div className="step-content-main">{contentText}</div>
            {strategyText && (
              <div className="step-strategy">
                <span className="strategy-label">Strategy:</span> {strategyText}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // If no sequence, show placeholder
  if (!sequence) {
    return (
      <div className="workspace-container">
        <div className="workspace-header">
          <h2>Sequence</h2>
        </div>
        <div className="workspace-empty">
          <p>No sequence generated.</p>
          <p>Chat with Helix to create a sales outreach sequence.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <h2>Sequence: {sequence.title}</h2>
      </div>
      <div className="sequence-container">
        {sequence.steps.map(renderSequenceStep)}
      </div>
      <div className="workspace-footer">
        <p className="sequence-updated">
          Last updated: {sequence.updatedAt.toLocaleString()}
        </p>
        <div className="workspace-actions">
          <button 
            className="save-sequence-button"
            onClick={handleSaveSequence}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Sequence'}
          </button>
          <button 
            className="add-step-button"
            onClick={handleAddStep}
          >
            Add Step
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceComponent;