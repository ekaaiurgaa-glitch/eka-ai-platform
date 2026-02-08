import os
import resend

# Initialize API Key
resend.api_key = os.getenv("RESEND_API_KEY")

class EmailService:
    @staticmethod
    def send_transactional(to_email, subject, html_content):
        try:
            params = {
                "from": "EKA-AI <notifications@app.eka-ai.com>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            
            email = resend.Emails.send(params)
            return {"status": "success", "id": email.id}
        except Exception as e:
            print(f"Email Error: {str(e)}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def send_welcome(to_email, user_name):
        html = f"<h1>Welcome to EKA-AI, {user_name}!</h1><p>Your workshop is now powered by intelligence.</p>"
        return EmailService.send_transactional(to_email, "Welcome to the Future of Repair", html)
