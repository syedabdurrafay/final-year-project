import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_email(to_email: str, subject: str, body: str):
    """
    Send email using SMTP (simplified - use a proper email service in production)
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv('SMTP_FROM', 'noreply@yourapp.com')
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        # In production, configure proper SMTP
        # Example:
        # with smtplib.SMTP(os.getenv('SMTP_SERVER'), int(os.getenv('SMTP_PORT'))) as server:
        #     server.login(os.getenv('SMTP_USERNAME'), os.getenv('SMTP_PASSWORD'))
        #     server.send_message(msg)

        # For now, just print to console
        print(f"Email would be sent to: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")

    except Exception as e:
        print(f"Error sending email: {e}")

def send_verification_email(email: str, token: str):
    """
    Send an email verification link to the user
    """
    subject = "Verify Your Email"
    verification_link = f"http://localhost:8000/auth/verify-email?token={token}"
    body = f"""
    <h1>Email Verification</h1>
    <p>Please click the link below to verify your email address:</p>
    <a href="{verification_link}">Verify Email</a>
    <p>Or copy this link: {verification_link}</p>
    """
    send_email(email, subject, body)

def send_welcome_email(email: str, username: str):
    """
    Send a welcome email to a new user
    """
    subject = "Welcome to AI Data Analyst!"
    body = f"""
    <h1>Welcome to AI Data Analyst, {username}!</h1>
    <p>Thank you for joining our platform. You can now start analyzing your data with AI-powered insights.</p>
    <p>If you have any questions, please contact our support team.</p>
    <br>
    <p>Best regards,<br>AI Data Analyst Team</p>
    """
    send_email(email, subject, body)

def send_password_reset_email(email: str, reset_token: str):
    """
    Send a password reset email with a link containing the reset token
    """
    subject = "Password Reset Request"
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
    body = f"""
    <h1>Password Reset Request</h1>
    <p>You requested to reset your password. Click the link below to proceed:</p>
    <a href="{reset_link}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <br>
    <p>If you didn't request this reset, please ignore this email.</p>
    """
    send_email(email, subject, body)