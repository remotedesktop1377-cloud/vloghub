import React, { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import { FeedbackData } from './FeedbackForm';

interface FeedbackButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'floating';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  label?: string;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  className = '',
  variant = 'primary',
  position = 'bottom-right',
  label = 'Feedback'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (feedback: FeedbackData) => {
    try {
      // Create form data to handle file upload
      const formData = new FormData();
      
      // Add all feedback data except screenshot
      Object.entries(feedback).forEach(([key, value]) => {
        if (key !== 'screenshot') {
          formData.append(key, String(value));
        }
      });
      
      // Add screenshot if available
      if (feedback.screenshot) {
        formData.append('screenshot', feedback.screenshot);
      }
      
      // Send feedback to API
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      // Show success message
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again later.');
    }
  };

  // Determine button classes based on variant
  let buttonClasses = 'feedback-button ';
  
  if (variant === 'primary') {
    buttonClasses += 'feedback-button-primary ';
  } else if (variant === 'secondary') {
    buttonClasses += 'feedback-button-secondary ';
  } else if (variant === 'floating') {
    buttonClasses += 'feedback-button-floating ';
    
    // Add position classes for floating button
    if (position === 'bottom-right') {
      buttonClasses += 'bottom-right ';
    } else if (position === 'bottom-left') {
      buttonClasses += 'bottom-left ';
    } else if (position === 'top-right') {
      buttonClasses += 'top-right ';
    } else if (position === 'top-left') {
      buttonClasses += 'top-left ';
    }
  }
  
  // Add any custom classes
  buttonClasses += className;

  return (
    <>
      <button 
        className={buttonClasses}
        onClick={openModal}
        aria-label="Open feedback form"
      >
        {variant === 'floating' ? (
          <>
            <span className="feedback-icon">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span className="feedback-text">{label}</span>
          </>
        ) : (
          label
        )}
      </button>
      
      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSubmit={handleSubmit} 
      />
    </>
  );
};

export default FeedbackButton; 