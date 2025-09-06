# Image Support in Chat

This document describes the image support functionality added to the Compass chat application.

## Features

### Image Upload and Pasting
- **File Upload**: Users can click the image button in the chat input to select and upload images
- **Paste Support**: Users can paste images directly from their clipboard (web only)
- **Drag & Drop**: Images can be dragged and dropped into the chat input area
- **Multiple Images**: Multiple images can be uploaded and sent in a single message

### Image Processing
- **Base64 Encoding**: All images are converted to base64 format for consistent handling
- **Compression**: Large images (>2MB) are automatically compressed to reduce file size
- **Validation**: Only image files are accepted, with size limits enforced
- **Preview**: Uploaded images are shown as thumbnails before sending

### Image Display
- **Message Rendering**: Images are displayed in chat messages with proper styling
- **Clickable Thumbnails**: Users can click on image thumbnails to view them in full size
- **Modal Viewer**: Full-size image viewing in an overlay modal
- **Responsive Design**: Images adapt to different screen sizes

## Technical Implementation

### Core Types
- `ChatMessage` interface extended with optional `images?: string[]` field
- Base64 encoded images stored as data URLs

### Components Modified
1. **ChatInput**: Added image upload UI, paste handling, and preview functionality
2. **Message**: Extended to display user-uploaded images
3. **VercelAIProvider**: Updated to handle multipart messages with images

### Utility Functions
- `fileToBase64()`: Converts File objects to base64 data URLs
- `isImageFile()`: Validates file type
- `isValidImageSize()`: Checks file size limits
- `compressImage()`: Reduces image file size while maintaining quality

### Image Format Support
- JPEG, PNG, GIF, WebP, and other common image formats
- Maximum file size: 10MB (configurable)
- Automatic compression for files >2MB

## Usage

### For Users
1. **Upload Images**: Click the image button (📷) in the chat input
2. **Paste Images**: Copy an image and paste it into the chat input (web)
3. **Send Messages**: Images can be sent with or without text
4. **View Images**: Click on any image thumbnail to view it full-size

### For Developers
```typescript
// Sending a message with images
onSend(messageText, mentionedCharacters, mentionedDocuments, images);

// Message structure with images
const message: ChatMessage = {
  content: "Check out these images!",
  role: "user",
  images: ["data:image/jpeg;base64,/9j/4AAQ...", "data:image/png;base64,iVBOR..."]
};
```

## AI Model Integration

Images are passed to AI models using the Vercel AI SDK's multipart message format:

```typescript
{
  role: "user",
  content: [
    { type: "text", text: "What's in this image?" },
    { type: "image", image: "data:image/jpeg;base64,..." }
  ]
}
```

This format is compatible with vision-capable AI models like:
- OpenAI GPT-4 Vision
- Anthropic Claude 3
- Google Gemini Pro Vision
- And other multimodal AI models

## Configuration

### Image Limits
```typescript
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // 2MB
const COMPRESSION_QUALITY = 0.8; // 80% quality
```

### Supported Platforms
- **Web**: Full support including paste, drag & drop
- **Mobile**: File picker and camera support (platform dependent)

## Future Enhancements

- [ ] Camera capture integration
- [ ] Image editing tools (crop, resize, rotate)
- [ ] Batch image operations
- [ ] Image metadata preservation
- [ ] Cloud storage integration
- [ ] Advanced compression options
- [ ] Image format conversion
