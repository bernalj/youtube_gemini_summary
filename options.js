// Manages the Gemini API key and endpoint storage and UI interactions for the extension options page

document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const status = document.getElementById('status');
    
    // Default API endpoint
    const defaultApiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent';
  
    // Retrieve and display any previously saved settings
    browser.storage.local.get(['geminiApiKey', 'apiEndpoint']).then(res => {
      if (res.geminiApiKey) apiKeyInput.value = res.geminiApiKey;
      if (res.apiEndpoint) {
        apiEndpointInput.value = res.apiEndpoint;
      } else {
        apiEndpointInput.value = defaultApiEndpoint;
      }
    }).catch(err => {
      console.error('Error loading settings:', err);
    });
  
    document.getElementById('save').addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      const endpoint = apiEndpointInput.value.trim() || defaultApiEndpoint;
      
      browser.storage.local.set({
        geminiApiKey: key,
        apiEndpoint: endpoint
      }).then(() => {
        status.textContent = 'Settings saved.';
        setTimeout(() => (status.textContent = ''), 2000);
        // Settings successfully saved to browser storage
      }).catch(err => {
        status.textContent = 'Error saving settings.';
        console.error('Error saving settings:', err);
      });
    });
  });
