/**
 * Minimal Google Apps Script Test - Troop 468
 * Use this to test if the deployment is working correctly
 */

/**
 * Handle HTTP GET requests (browser visits)
 */
function doGet(e) {
  return ContentService
    .createTextOutput("✅ Troop 468 Email Webhook is running! Use POST requests to send data.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Handle HTTP POST requests (from React app)
 */
function doPost(e) {
  try {
    console.log('📧 POST request received');
    console.log('📦 Request data:', e.postData.contents);
    
    // Parse the request
    let requestData = {};
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    }
    
    // Create response
    const response = {
      success: true,
      message: "POST request received successfully!",
      timestamp: new Date().toISOString(),
      receivedData: requestData
    };
    
    console.log('✅ Sending response:', response);
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    
    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions(e) {
  console.log('🔄 OPTIONS request received');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

