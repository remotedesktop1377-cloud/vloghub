import React from 'react';
import FeedbackForm, { FeedbackData } from './FeedbackForm';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const handleSubmit = (feedback: FeedbackData) => {
    onSubmit(feedback);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Feedback</h3>
          <button 
            type="button" 
            className="modal-close-button" 
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          <FeedbackForm onSubmit={handleSubmit} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal; 