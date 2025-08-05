"""
Feedback service for handling user feedback, bug reports, and feature requests.
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Union

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

from src.db.database import get_db_connection


class FeedbackService:
    """Service for handling user feedback, bug reports, and feature requests."""
    
    def __init__(self, storage_path: str = "data/feedback", 
                 email_config: Optional[Dict] = None):
        """
        Initialize the feedback service.
        
        Args:
            storage_path: Path to store feedback data
            email_config: Email configuration for notifications
        """
        self.storage_path = storage_path
        self.email_config = email_config or {}
        
        # Ensure storage directory exists
        os.makedirs(storage_path, exist_ok=True)
    
    def submit_feedback(self, feedback_data: Dict) -> Dict:
        """
        Submit new feedback.
        
        Args:
            feedback_data: Dictionary containing feedback information
                - type: Type of feedback (bug, feature, improvement, general)
                - title: Short title/summary
                - description: Detailed description
                - email: User's email (optional)
                - severity: For bugs (low, medium, high, critical)
                - screenshot_path: Path to screenshot file (optional)
                - allow_contact: Whether user allows follow-up contact
        
        Returns:
            Dictionary with feedback ID and submission timestamp
        """
        # Generate unique ID
        feedback_id = str(uuid.uuid4())
        
        # Add metadata
        feedback_data["id"] = feedback_id
        feedback_data["timestamp"] = datetime.utcnow().isoformat()
        feedback_data["status"] = "new"
        
        # Save to database
        self._save_to_database(feedback_data)
        
        # Save to file system (backup)
        self._save_to_file(feedback_data)
        
        # Send notification if configured
        if self.email_config.get("enabled", False):
            self._send_notification(feedback_data)
        
        return {
            "id": feedback_id,
            "timestamp": feedback_data["timestamp"],
            "status": "submitted"
        }
    
    def get_feedback(self, feedback_id: str) -> Optional[Dict]:
        """
        Retrieve specific feedback by ID.
        
        Args:
            feedback_id: Unique feedback identifier
            
        Returns:
            Feedback data dictionary or None if not found
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT data FROM feedback WHERE id = ?",
            (feedback_id,)
        )
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return json.loads(result[0])
        return None
    
    def list_feedback(self, 
                      feedback_type: Optional[str] = None,
                      status: Optional[str] = None,
                      limit: int = 100,
                      offset: int = 0) -> List[Dict]:
        """
        List feedback with optional filtering.
        
        Args:
            feedback_type: Filter by feedback type
            status: Filter by status
            limit: Maximum number of results
            offset: Pagination offset
            
        Returns:
            List of feedback dictionaries
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT data FROM feedback WHERE 1=1"
        params = []
        
        if feedback_type:
            query += " AND json_extract(data, '$.type') = ?"
            params.append(feedback_type)
            
        if status:
            query += " AND json_extract(data, '$.status') = ?"
            params.append(status)
            
        query += " ORDER BY json_extract(data, '$.timestamp') DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        conn.close()
        
        return [json.loads(row[0]) for row in results]
    
    def update_feedback_status(self, feedback_id: str, status: str, 
                              notes: Optional[str] = None) -> bool:
        """
        Update the status of a feedback item.
        
        Args:
            feedback_id: Unique feedback identifier
            status: New status (new, in_progress, resolved, closed)
            notes: Optional notes about the status change
            
        Returns:
            True if successful, False otherwise
        """
        feedback = self.get_feedback(feedback_id)
        if not feedback:
            return False
        
        feedback["status"] = status
        feedback["updated_at"] = datetime.utcnow().isoformat()
        
        if notes:
            if "notes" not in feedback:
                feedback["notes"] = []
            
            feedback["notes"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "content": notes
            })
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE feedback SET data = ? WHERE id = ?",
            (json.dumps(feedback), feedback_id)
        )
        
        conn.commit()
        conn.close()
        
        # Update file backup
        self._save_to_file(feedback)
        
        return True
    
    def _save_to_database(self, feedback_data: Dict) -> None:
        """Save feedback to database."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO feedback (id, data) VALUES (?, ?)",
            (feedback_data["id"], json.dumps(feedback_data))
        )
        
        conn.commit()
        conn.close()
    
    def _save_to_file(self, feedback_data: Dict) -> None:
        """Save feedback to file system as backup."""
        feedback_id = feedback_data["id"]
        file_path = os.path.join(self.storage_path, f"{feedback_id}.json")
        
        with open(file_path, "w") as f:
            json.dump(feedback_data, f, indent=2)
    
    def _send_notification(self, feedback_data: Dict) -> None:
        """Send email notification about new feedback."""
        if not self.email_config.get("smtp_server"):
            return
        
        try:
            msg = MIMEMultipart()
            msg["From"] = self.email_config.get("from_email", "noreply@youtube-clip-finder.example.com")
            msg["To"] = self.email_config.get("to_email", "support@youtube-clip-finder.example.com")
            
            # Set subject based on feedback type
            feedback_type = feedback_data.get("type", "general").capitalize()
            msg["Subject"] = f"New {feedback_type} Feedback: {feedback_data.get('title', 'No Title')}"
            
            # Create email body
            body = f"""
            <html>
            <body>
                <h2>New {feedback_type} Feedback Received</h2>
                <p><strong>ID:</strong> {feedback_data.get('id')}</p>
                <p><strong>Title:</strong> {feedback_data.get('title')}</p>
                <p><strong>Description:</strong></p>
                <p>{feedback_data.get('description')}</p>
                
                <hr>
                
                <p><strong>User Email:</strong> {feedback_data.get('email', 'Not provided')}</p>
                <p><strong>Allow Contact:</strong> {'Yes' if feedback_data.get('allow_contact') else 'No'}</p>
                <p><strong>Timestamp:</strong> {feedback_data.get('timestamp')}</p>
                
                <p>View in admin panel: <a href="https://admin.youtube-clip-finder.example.com/feedback/{feedback_data.get('id')}">
                    Open Feedback #{feedback_data.get('id')}
                </a></p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, "html"))
            
            # Attach screenshot if available
            screenshot_path = feedback_data.get("screenshot_path")
            if screenshot_path and os.path.exists(screenshot_path):
                with open(screenshot_path, "rb") as img_file:
                    img = MIMEImage(img_file.read())
                    img.add_header("Content-Disposition", "attachment", filename=os.path.basename(screenshot_path))
                    msg.attach(img)
            
            # Send email
            with smtplib.SMTP(self.email_config.get("smtp_server"), self.email_config.get("smtp_port", 587)) as server:
                if self.email_config.get("use_tls", True):
                    server.starttls()
                
                if self.email_config.get("username") and self.email_config.get("password"):
                    server.login(self.email_config.get("username"), self.email_config.get("password"))
                
                server.send_message(msg)
        
        except Exception as e:
            # Log error but don't fail the feedback submission
            print(f"Error sending notification email: {str(e)}")


# Create database table if it doesn't exist
def init_feedback_database():
    """Initialize the feedback database table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close() 