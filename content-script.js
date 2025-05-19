// Maintains a cache of video summaries to prevent redundant API requests
const summaryCache = new Map();

function createSummarizeButton() {
  const button = document.createElement('button');
  button.className = 'yt-summary-button';
  button.textContent = 'Summarize';
  return button;
}

// Creates an SVG loading animation to indicate processing
function createLoadingAnimation() {
  // Create SVG element for the spinner
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'loading-spinner');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  
  // Create circular path for the spinner
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'white');
  circle.setAttribute('stroke-width', '2');
  circle.setAttribute('stroke-dasharray', '30 60');
  
  svg.appendChild(circle);
  
  return svg;
}

// Creates animated loading dots
function createLoadingDots() {
  const container = document.createElement('div');
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  
  // Create three dots with different animation delays
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'loading-dot';
    container.appendChild(dot);
  }
  
  return container;
}

function createOverlay(text) {
  const overlay = document.createElement('div');
  overlay.className = 'yt-summary-overlay';
  overlay.textContent = text;
  return overlay;
}

function handleSummarizeClick(event) {
  event.stopPropagation(); // Prevent clicking through to the video
  // Handle the summarize button click event
  
  const button = event.currentTarget;
  const thumb = button.closest('ytd-rich-item-renderer') || 
                button.closest('ytd-video-renderer') || 
                button.closest('ytd-compact-video-renderer') || 
                button.closest('ytd-grid-video-renderer') ||
                button.parentElement.parentElement;
  
  if (thumb.dataset.summarying) {
    // Prevent multiple simultaneous summarization requests for the same video
    return;
  }
  
  // Update button with loading animation and text
  button.innerHTML = '';
  button.appendChild(createLoadingAnimation());
  const textSpan = document.createElement('span');
  textSpan.textContent = 'Summarizing';
  button.appendChild(textSpan);
  button.appendChild(createLoadingDots());
  // Extract the video URL from various possible DOM elements
  let videoUrl;
  const link = thumb.querySelector('a#thumbnail');
  
  if (link && link.href) {
    videoUrl = link.href;
  } else {
    // Try alternative DOM elements that might contain the video URL
    const anyLink = thumb.querySelector('a[href*="youtube.com/watch"]') || 
                   thumb.querySelector('a[href*="youtu.be"]') ||
                   thumb.querySelector('a[href*="video_id"]');
    
    if (anyLink && anyLink.href) {
      videoUrl = anyLink.href;
    } else {
      // Extract video ID from data attributes if direct URL not found
      const videoIdElement = thumb.querySelector('[data-video-id]');
      if (videoIdElement && videoIdElement.dataset.videoId) {
        videoUrl = `https://www.youtube.com/watch?v=${videoIdElement.dataset.videoId}`;
      } else {
        // Last resort: search for elements with video ID in their attributes
        const videoIdAttr = thumb.querySelector('[id*="video-"]') || 
                           thumb.querySelector('[class*="video-"]') ||
                           thumb.querySelector('[data-videoid]');
        
        if (videoIdAttr) {
          const idMatch = videoIdAttr.id?.match(/video[-_]([a-zA-Z0-9_-]{11})/) ||
                         videoIdAttr.className?.match(/video[-_]([a-zA-Z0-9_-]{11})/) ||
                         videoIdAttr.dataset.videoid;
          
          if (idMatch) {
            const extractedId = typeof idMatch === 'string' ? idMatch : idMatch[1];
            videoUrl = `https://www.youtube.com/watch?v=${extractedId}`;
          } else {
            console.log('No video ID found in attributes');
            return;
          }
        } else {
          console.log('No video link found');
          return;
        }
      }
    }
  }
  // Process the found video URL
  if (summaryCache.has(videoUrl)) {
    showOverlay(thumb, summaryCache.get(videoUrl));
    // Update button text for cached summaries
    button.innerHTML = '';
    button.textContent = 'Summarized!';
    return;
  }
  thumb.dataset.summarying = true;
  // Send summarization request to the background script
  browser.runtime.sendMessage({action: 'summarize', videoUrl})
    .then(response => {
      // Process the response from the background script
      if (response && response.success) {
        if (response.summary) {
          // Store successful summary in cache and display it
          summaryCache.set(videoUrl, response.summary);
          showOverlay(thumb, response.summary);
          // Update button text to indicate successful summarization
          button.innerHTML = '';
          button.textContent = 'Summarized!';
        } else {
          // Handle case where response indicates success but summary is missing
          showOverlay(thumb, "Could not generate summary. Please check the console for errors.");
          // Reset button text when summary generation fails
          button.innerHTML = '';
          button.textContent = 'Summarize';
        }
      } else {
        const errorMsg = response && response.error ? response.error : 'Unknown error';
        console.error('Error getting summary:', errorMsg);
        showOverlay(thumb, `Error: ${errorMsg}`);
        // Reset button text when an error occurs
        button.innerHTML = '';
        button.textContent = 'Summarize';
      }
    })
    .catch(err => {
      console.error('Error sending message:', err);
      showOverlay(thumb, `Error: ${err.message || 'Unknown error'}`);
      // Reset button text when message sending fails
      button.innerHTML = '';
      button.textContent = 'Summarize';
    })
    .finally(() => {
      delete thumb.dataset.summarying;
    });
}

function showOverlay(thumb, text) {
  // Create or update the summary overlay for a thumbnail
  let overlay = thumb.querySelector('.yt-summary-overlay');
  if (!overlay) {
    overlay = createOverlay(text);
    
    // Ensure proper positioning context for the overlay
    if (getComputedStyle(thumb).position === 'static') {
      thumb.style.position = 'relative';
    }
    
    // Find the appropriate container for the overlay
    const thumbnailContainer = thumb.querySelector('#thumbnail') || thumb;
    if (thumbnailContainer !== thumb) {
      thumbnailContainer.style.position = 'relative';
      thumbnailContainer.appendChild(overlay);
      // Append overlay to the thumbnail container
    } else {
      thumb.appendChild(overlay);
      // Append overlay directly to the thumbnail element
    }
  } else {
    overlay.textContent = text;
    // Update text in existing overlay
  }
  
  // Ensure the overlay is visible to the user
  overlay.style.display = 'block';
  // Overlay is now displayed
  
  // Add click handler to dismiss the overlay
  overlay.style.pointerEvents = 'auto';
  overlay.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
}

function addSummarizeButton(thumb) {
  // Prevent duplicate buttons on the same thumbnail
  if (thumb.querySelector('.yt-summary-button')) {
    return;
  }
  
  // Locate the container for the button
  const thumbnailContainer = thumb.querySelector('#thumbnail') || thumb;
  
  // Ensure proper positioning context for the button
  if (getComputedStyle(thumbnailContainer).position === 'static') {
    thumbnailContainer.style.position = 'relative';
  }
  
  // Create and append the summarize button
  const button = createSummarizeButton();
  thumbnailContainer.appendChild(button);
  
  // Attach click event handler to the button
  button.addEventListener('click', handleSummarizeClick);
  // Button successfully added to thumbnail
}

function attachButtons() {
  // Find all video thumbnails on the page using various YouTube selectors
  const thumbs = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer');
  // Process found thumbnails
  
  if (thumbs.length === 0) {
    // Try alternative selectors if primary selectors don't match any elements
    const altThumbs = document.querySelectorAll('a#thumbnail');
    // Process thumbnails found with alternative selectors
    
    altThumbs.forEach(el => {
      const parent = el.closest('ytd-rich-item-renderer') || el.closest('ytd-video-renderer') || el.parentElement;
      if (parent) {
        addSummarizeButton(parent);
      }
    });
  } else {
    thumbs.forEach(el => {
      addSummarizeButton(el);
    });
  }
}

const observer = new MutationObserver(attachButtons);
observer.observe(document.body, { childList: true, subtree: true });
attachButtons();
