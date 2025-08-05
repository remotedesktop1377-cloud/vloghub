import React, { useState } from 'react';

interface FeedbackFormProps {
  onSubmit: (feedback: FeedbackData) => void;
  onCancel: () => void;
}

export interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  email: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  screenshot?: File | null;
  allowContact: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, onCancel }) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'general',
    title: '',
    description: '',
    email: '',
    severity: 'medium',
    screenshot: null,
    allowContact: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFeedback((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFeedback((prev) => ({ ...prev, screenshot: file }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!feedback.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!feedback.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (feedback.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (feedback.email && !/^\S+@\S+\.\S+$/.test(feedback.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(feedback);
    }
  };

  return (
    <div className="feedback-form-container">
      <h2>Send Feedback</h2>
      <p className="form-description">
        Your feedback helps us improve the YouTube Research Video Clip Finder. 
        Please let us know your thoughts, suggestions, or report any issues you've encountered.
      </p>
      
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-group">
          <label htmlFor="type">Feedback Type</label>
          <select 
            id="type" 
            name="type" 
            value={feedback.type} 
            onChange={handleChange}
            className="form-control"
          >
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="improvement">Improvement Suggestion</option>
            <option value="general">General Feedback</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            value={feedback.title} 
            onChange={handleChange} 
            className={`form-control ${errors.title ? 'error' : ''}`}
            placeholder="Brief summary of your feedback"
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea 
            id="description" 
            name="description" 
            value={feedback.description} 
            onChange={handleChange} 
            className={`form-control ${errors.description ? 'error' : ''}`}
            rows={5}
            placeholder="Please provide details about your feedback"
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>
        
        {feedback.type === 'bug' && (
          <div className="form-group">
            <label htmlFor="severity">Severity</label>
            <select 
              id="severity" 
              name="severity" 
              value={feedback.severity} 
              onChange={handleChange}
              className="form-control"
            >
              <option value="low">Low - Minor issue, doesn't affect functionality</option>
              <option value="medium">Medium - Affects functionality but has workaround</option>
              <option value="high">High - Significant issue affecting core functionality</option>
              <option value="critical">Critical - Application unusable</option>
            </select>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="screenshot">Screenshot (optional)</label>
          <input 
            type="file" 
            id="screenshot" 
            name="screenshot" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="form-control"
          />
          <small className="form-text text-muted">
            Upload a screenshot to help us better understand your feedback (max 5MB)
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email (optional)</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={feedback.email} 
            onChange={handleChange} 
            className={`form-control ${errors.email ? 'error' : ''}`}
            placeholder="Your email address"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
          <small className="form-text text-muted">
            We'll only use your email to follow up on your feedback
          </small>
        </div>
        
        <div className="form-group checkbox">
          <input 
            type="checkbox" 
            id="allowContact" 
            name="allowContact" 
            checked={feedback.allowContact} 
            onChange={handleCheckboxChange} 
          />
          <label htmlFor="allowContact">
            I'm okay with being contacted about this feedback
          </label>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm; 