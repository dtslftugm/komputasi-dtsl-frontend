/**
 * Configuration File
 * Update API_URL with your actual Google Apps Script deployment URL
 */
const CONFIG = {
  // TODO: Replace with your actual GAS deployment URL after deployment
  API_URL: 'https://script.google.com/macros/s/AKfycbyPCAs7bebTWcXkWsJ9Qi0paL2o88HT-4z5c-bTNVsQ73n4t_2mTndXsGC7dYIXIyIN/exec',

  APP_NAME: 'Layanan Komputasi DTSL FT UGM',
  APP_VERSION: '17.0',
  ENVIRONMENT: 'production'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
