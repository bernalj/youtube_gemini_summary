// Handles message events from content scripts and processes video summarization requests using the Gemini API
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);
    if (message.action === 'summarize') {
      const { videoUrl } = message;
      // Retrieve the API key and endpoint from browser storage
      
      // Use Promise chain instead of await
      browser.storage.local.get(['geminiApiKey', 'apiEndpoint']).then(result => {
        const { geminiApiKey, apiEndpoint } = result;
        // Verify API key existence
        
        if (!geminiApiKey) {
          console.error('API key not set');
          sendResponse({ success: false, error: 'API key not set. Please set your Gemini API key in the extension options.' });
          return;
        }
        
        // Validate the API key format to ensure it meets expected pattern
        if (!geminiApiKey.match(/^[A-Za-z0-9_-]{30,}$/)) {
          console.error('API key format appears invalid');
          sendResponse({ 
            success: false, 
            error: 'API key format appears invalid. Gemini API keys are typically long strings of letters and numbers. Please check your API key in the extension options.' 
          });
          return;
        }
    
        // Parse the video URL to extract the YouTube video ID
        let videoId = '';
        try {
          const url = new URL(videoUrl);
          if (url.hostname.includes('youtube.com')) {
            videoId = url.searchParams.get('v') || '';
          } else if (url.hostname.includes('youtu.be')) {
            videoId = url.pathname.substring(1);
          } else if (videoUrl.includes('video_id=')) {
            const match = videoUrl.match(/video_id=([^&]+)/);
            if (match) videoId = match[1];
          }
        } catch (e) {
          console.error('Error parsing URL:', e);
        }
        
        // Construct a standardized YouTube URL from the extracted video ID
        const youtubeUrl = videoId 
          ? `https://www.youtube.com/watch?v=${videoId}`
          : videoUrl;
        
        // Define the summarization prompt for the Gemini API
        const prompt = "Please summarize the video in 3 sentences.";
        // Construct the request body for the Gemini API with proper structure
        const requestBody = {
          // Content blocks containing the video URL and summarization prompt
          contents: [
            {
              role: "user",
              parts: [
                {
                  fileData: {
                    fileUri: youtubeUrl,
                    mimeType: "video/youtube"
                  }
                },
              ]
            },
            {
              role: "user",
              parts: [
                { text: prompt }
              ]
            }
          ],
        
          // Generation configuration parameters to control the AI output
          generationConfig: {
            temperature:     0.7,
            topP:            0.95,
            topK:            40,
            maxOutputTokens: 10000
          },
        
          // Safety settings to control content filtering
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_CIVIC_INTEGRITY",   threshold: "BLOCK_NONE" }
          ]
        };
        // Construct the Gemini API URL with the appropriate model
        
        // Use custom endpoint if available, otherwise use default
        const defaultApiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent';
        const apiUrl = `${apiEndpoint || defaultApiEndpoint}?key=${geminiApiKey}`;
        
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        .then(response => {
          // Check response status and handle errors
          if (!response.ok) {
            console.error('API response not OK:', response.status, response.statusText);
            
            // Special handling for 429 Too Many Requests (rate limit exceeded)
            if (response.status === 429) {
              throw new Error(`You have exceeded your Gemini API quota. Please try again later or check your rate limits at https://ai.google.dev/gemini-api/docs/rate-limits`);
            } else {
              throw new Error(`API response not OK: ${response.status} ${response.statusText}`);
            }
          }
          return response.json();
        })
        .then(data => {
          // Process the API response data
          
          let summary;
          
          // Check for API errors in the response
          if (data.error) {
            console.error('API returned an error:', data.error);
            throw new Error(`API error: ${data.error.message || JSON.stringify(data.error)}`);
          }
          
          // Extract the summary text from the API response using the expected path
          summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          
          // If the summary is not found in the expected location, try alternative response formats
          if (!summary) {
            if (data.candidates && data.candidates.length > 0) {
              if (data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                summary = data.candidates[0].content.parts[0].text;
                // Found in primary location
              } else {
                summary = data.candidates[0].text || data.candidates[0].output;
                // Found in alternative location
              }
            } else if (data.text) {
              summary = data.text;
              // Found directly in data.text
            } else if (data.choices && data.choices[0]) {
              summary = data.choices[0].message?.content || data.choices[0].text;
              // Found in choices array (alternative API format)
            } else {
              // Last resort: search for text field in the response using regex
              const jsonStr = JSON.stringify(data);
              const textMatch = jsonStr.match(/"text"\s*:\s*"([^"]+)"/);
              if (textMatch && textMatch[1]) {
                summary = textMatch[1];
                // Found through regex search
              }
            }
          }
          
          if (!summary) {
            // Handle case where no summary could be extracted
            summary = "Could not generate summary. Please check the API key and try again.";
          }
          
          // Return the extracted summary to the content script
          sendResponse({ success: true, summary });
        })
        .catch(err => {
          console.error('Error calling Gemini API:', err);
          sendResponse({ success: false, error: err.message });
        });
      });
      
      // Return true to keep the message channel open for asynchronous response
      return true;
    }
  });
