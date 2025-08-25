# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Environment
```bash
# Start local development server (Python HTTP server on port 3000)
npm run dev

# Install dependencies (uuid, axios)
npm install
```

### Build and Deployment
```bash
# Build for production (placeholder command)
npm run build

# Deploy to Vercel (requires Vercel CLI and OPENAI_API_KEY env var)
vercel --prod

# Preview build locally (builds then serves on port 8080)
npm run preview
```

### OpenAI Configuration
```bash
# Create .env file with OpenAI API key (required for transcription)
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Alternative: Edit public/js/config.js directly
# Set window.OPENAI_API_KEY = 'your-key-here'
```

## Application Architecture

### Serverless Web Application
This is a serverless web application for managing military inquiries (sindicâncias) deployed on Vercel with the following architecture:

**Static Web Pages (`public/` directory)**:
- `login.html` - Authentication page
- `dashboard-simple.html` - Main inquiry management interface  
- `sindicancia-detalhes.html` - Individual inquiry management
- `realizar-oitiva.html` - Hearing/interview interface
- CSS files in `css/` directory for styling
- JavaScript modules in `js/` directory for functionality

### Firebase Integration
The app uses Firebase v9.23.0 SDK with:

**Authentication (`src/js/auth.js`)**:
- Email/password authentication using Firebase Auth
- AuthService class with login/logout methods
- Automatic navigation based on auth state

**Database (`src/js/database.js`)**:
- Firestore for storing inquiries and hearings data
- Firebase Storage for document uploads (PDFs)
- DatabaseService class with CRUD operations
- Real-time listeners for data synchronization

**Configuration**:
- `firebase-electron.js` - Web-compatible Firebase initialization using ES6 modules
- `firebase-config.js` - Alternative Firebase config (ES6 modules)
- Firebase credentials are hardcoded in configuration files

### AI Transcription Service
**OpenAI Whisper + GPT-4 (`public/js/transcription.js`)**:
- Two-stage transcription: Whisper for audio-to-text, GPT-4 for formatting
- Audio recorded in 5-second segments, automatically converted to WAV format
- Intelligent legal document formatting with military terminology
- OpenAI API key configured via environment variables or config.js
- Microphone access through Web APIs (getUserMedia)

### Data Structure
**Firestore Collections**:
```
sindicancias/
├── {inquiry-id}
│   ├── numeroProcesso: string
│   ├── objetoApuracao: string  
│   ├── sindicanteId: string (auth user id)
│   └── oitivas/ (subcollection)
│       └── {hearing-id}
│           ├── nomeTestemunha: string
│           ├── dataOitiva: timestamp
│           ├── termoOitivaManual: string
│           └── transcricaoIA: string
```

**Firebase Storage**:
```
oficios/
└── {hearing-id}/
    └── {timestamp}_{filename}.pdf
```

## Development Workflow

### When Firebase Changes Are Needed
1. The app uses Firebase ES6 modules initialization:
   - `firebase-electron.js` - Main Firebase initialization with ES6 modules
   - `firebase-config.js` - Alternative Firebase config
2. Firebase functions are exposed to `window` global for compatibility
3. Firebase credentials are hardcoded - update configuration files if needed

### When Working with Authentication
- Firebase Auth is configured for email/password only
- Test credentials: `sindicante@gocg.com` / `Sind123456`
- AuthService handles automatic redirects between login/dashboard
- Navigation uses `window.location.href` for page transitions

### When Working with UI
- Main page is `dashboard-simple.html` 
- Navigation between pages uses URL parameters and `window.location`
- CSS files are modular (login.css, dashboard.css, hearing.css, inquiry.css)
- No build process for CSS - plain CSS files served directly

### When Working with Transcription
- OpenAI Whisper + GPT-4 configured for web environment
- API key must be set in `.env` file or `public/js/config.js`
- Audio automatically converted to WAV format for Whisper compatibility
- GPT-4 formats transcription into professional legal document structure
- TranscriptionService uses Web APIs for microphone access
- Audio recording uses WebRTC APIs (getUserMedia)

## Important Development Notes

### Web Security Settings
- All scripts use ES6 modules (`<script type="module">`)
- CORS and Firebase security rules handle access control
- No special security configurations needed for web deployment

### Firebase Compatibility
- Using Firebase v9.23.0 with ES6 modules for web compatibility
- All Firebase imports use ES6 syntax
- Analytics is disabled to prevent initialization errors

### File Structure Critical Points
- Main files are in `public/` directory for Vercel deployment
- Assets (icons, images) are in `assets/` directory  
- CSS and JS files served directly without build process
- Firebase configuration embedded in JavaScript files

### Deployment Considerations
- Optimized for Vercel serverless deployment
- Static files served from `public/` directory
- No server-side processing required
- Firebase handles all backend functionality

### Development Workflow
- Use local development server for testing
- Firebase rules and security handle data access
- All navigation handled client-side with `window.location`

## Troubleshooting Common Issues

### Firebase Import Errors
- Ensure all Firebase imports use ES6 modules syntax
- Check that Firebase v9.23.0 is installed (not newer versions)
- Verify Analytics is not imported or initialized
- Ensure `<script type="module">` is used for all Firebase scripts

### Authentication Problems
- Confirm user exists in Firebase Authentication console
- Check that Firebase config credentials match your project
- Verify network connectivity and Firebase project status
- Check browser console for CORS errors

### Transcription Not Working
- Verify OpenAI API key is correctly configured in `.env` or `config.js`
- Check microphone permissions in browser settings
- Ensure HTTPS is used for microphone access (required by browsers)
- Confirm sufficient OpenAI API credits are available
- Check browser console for audio format conversion errors

### Deployment Issues
- Ensure `public/` directory contains all necessary files for Vercel static deployment
- Set `OPENAI_API_KEY` environment variable in Vercel dashboard
- Check that Vercel configuration matches file structure (serves from `public/`)
- Verify Firebase security rules allow web access
- Confirm all assets paths are correct for static deployment
- Ensure HTTPS is enabled in production for microphone access

##### foque sempre em fazer tudo componentizado
##### mantenha em serverless para deploy no vercel
##### sempre revise toda a integração entre banco de dados e funcionalidade