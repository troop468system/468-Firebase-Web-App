// Netlify Functions - serverless email sending
// File: netlify/functions/send-email.js

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  
  try {
    const { type, requestData, reason } = JSON.parse(event.body);
    
    // Configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Set in Netlify env vars
        pass: process.env.EMAIL_PASSWORD // Gmail app password
      }
    });
    
    let emails = [];
    
    if (type === 'approval') {
      // Build approval emails
      if (requestData.scoutEmail) {
        emails.push({
          to: requestData.scoutEmail,
          subject: '🎉 Welcome to Troop 468 - Account Setup Required',
          html: generateApprovalEmail(requestData, 'scout')
        });
      }
      // Add father and mother emails...
    } else if (type === 'rejection') {
      // Build rejection emails
      // Similar structure...
    }
    
    // Send all emails
    const promises = emails.map(email => 
      transporter.sendMail({
        from: 'troop468.system@gmail.com',
        ...email
      })
    );
    
    await Promise.all(promises);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Sent ${emails.length} emails` 
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Frontend usage:
const sendEmails = async (type, requestData, reason = '') => {
  const response = await fetch('/.netlify/functions/send-email', {
    method: 'POST',
    body: JSON.stringify({ type, requestData, reason })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send emails');
  }
  
  return response.json();
};
