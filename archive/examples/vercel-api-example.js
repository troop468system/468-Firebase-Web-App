// Vercel API Routes - serverless email sending
// File: api/send-email.js

const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { type, requestData, reason } = req.body;
    
    // Configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Email sending logic similar to above...
    
    res.status(200).json({ 
      success: true, 
      message: `Sent ${emails.length} emails` 
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Frontend usage is similar to Netlify example
