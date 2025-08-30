// EmailJS implementation - no backend required
import emailjs from '@emailjs/browser';

// Initialize EmailJS (add to src/index.js)
emailjs.init("your_public_key");

// Email service for approval/rejection
const sendApprovalEmailsViaEmailJS = async (requestData) => {
  const emails = [];
  
  // Scout email
  if (requestData.scoutEmail) {
    emails.push({
      to_email: requestData.scoutEmail,
      to_name: requestData.scoutPreferredName || 
        `${requestData.scoutFirstName} ${requestData.scoutLastName}`,
      role: 'scout',
      signup_link: `https://troop468-manage.web.app/signup?token=scout-token`
    });
  }
  
  // Father email (if included)
  if (requestData.includeFather && requestData.fatherEmail) {
    emails.push({
      to_email: requestData.fatherEmail,
      to_name: requestData.fatherPreferredName || 
        `${requestData.fatherFirstName} ${requestData.fatherLastName}`,
      role: 'parent',
      signup_link: `https://troop468-manage.web.app/signup?token=father-token`
    });
  }
  
  // Mother email (if included)
  if (requestData.includeMother && requestData.motherEmail) {
    emails.push({
      to_email: requestData.motherEmail,
      to_name: requestData.motherPreferredName || 
        `${requestData.motherFirstName} ${requestData.motherLastName}`,
      role: 'parent',
      signup_link: `https://troop468-manage.web.app/signup?token=mother-token`
    });
  }
  
  // Send all emails using EmailJS
  const promises = emails.map(email => 
    emailjs.send(
      'your_service_id',
      'approval_template_id',
      email,
      'your_public_key'
    )
  );
  
  try {
    await Promise.all(promises);
    console.log(`✅ Sent ${emails.length} approval emails via EmailJS`);
  } catch (error) {
    console.error('❌ Error sending emails:', error);
    throw error;
  }
};

// Usage in authService.js
export const emailService = {
  sendApprovalEmailsViaEmailJS,
  sendRejectionEmailsViaEmailJS: async (requestData, reason) => {
    // Similar implementation for rejection emails
  }
};
