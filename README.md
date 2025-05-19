# YouTube Video Summarizer

A Firefox extension that summarizes YouTube videos directly from the front page using Google's Gemini AI.

![YouTube Video Summarizer](assets/screenshot.png)

## Features

- **Quick Video Summaries**: Get concise 3-sentence summaries of YouTube videos without watching them
- **Hover Interface**: Adds a "Summarize" button to each video thumbnail on YouTube
- **Caching**: Stores summaries to avoid redundant API calls for videos you've already summarized
- **Customizable API Endpoint**: Configure which Gemini API endpoint to use
- **User-friendly UI**: Clean overlay design with animations for loading states

## Installation

### From Firefox Add-ons Store

1. Visit the [Firefox Add-ons Store page](https://addons.mozilla.org/en-US/firefox/addon/youtube-thumbnail-sumarizer/)
2. Click "Add to Firefox"
3. Follow the prompts to complete installation

### Manual Installation

1. Download the `.zip` file the top right corner: <> Code > Download ZIP
2. In Firefox, navigate to `about:addons`
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded `.zip` file

## Setup

1. Get a Gemini API key from [Google AI Studio](https://ai.google.dev/)
2. After installing the extension, click on the extension icon in the toolbar
3. Go to "Extension Options"
4. Enter your Gemini API key
5. (Optional) Customize the API endpoint if needed
6. Click "Save"

## Usage

1. Navigate to YouTube.com
2. Hover over any video thumbnail to see the "Summarize" button
3. Click the button to generate a summary
4. The summary will appear as an overlay on the thumbnail

## Configuration Options

The extension provides the following configuration options:

- **Gemini API Key**: Your personal API key for accessing the Gemini API
- **API Endpoint**: The Gemini API endpoint URL (defaults to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent`)

## How It Works

1. The extension injects a "Summarize" button onto each YouTube video thumbnail
2. When clicked, it extracts the video URL and sends it to the background script
3. The background script uses the Gemini API to analyze the video and generate a summary
4. The summary is displayed as an overlay on the video thumbnail
5. Summaries are cached to improve performance for repeated views

## Privacy

- The extension only sends video URLs to the Gemini API
- Your API key is stored locally in your browser's storage
- No user data is collected or transmitted beyond what's needed for summarization

## Development

### Prerequisites

- Node.js and npm
- Firefox Developer Edition (recommended for testing)

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/youtube-gemini-summary.git
   cd youtube-gemini-summary
   ```

2. Load the extension in Firefox:
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on..."
   - Select any file in the extension directory

3. Make changes to the code
4. Reload the extension to see your changes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google's Gemini API for providing the AI summarization capabilities
- Firefox Add-ons for the extension platform
- Cline and Claude Sonnet 3.7
