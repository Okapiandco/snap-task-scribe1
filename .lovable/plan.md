

# Meeting Notes Organizer

## Overview
A simple app where you photograph handwritten meeting notes, upload the image, and AI automatically transcribes and organizes them into formal meeting notes with extracted tasks.

## Pages & Features

### Home / Upload Page
- Clean, minimal interface with a prominent upload area
- Drag-and-drop or tap to upload a photo of your notes
- Camera capture option for mobile users
- Shows a preview of the uploaded image before processing
- "Process Notes" button to kick off the AI transcription

### Results View
- **Meeting Notes section**: The AI-formatted, clean version of your handwritten notes with date, attendees (if mentioned), and key discussion points
- **Tasks section**: Extracted action items displayed as a checklist with the ability to mark tasks as done
- Option to copy notes or tasks to clipboard
- "Upload Another" button to start fresh

## How It Works (Behind the Scenes)
- Uses Lovable Cloud with the Lovable AI Gateway (Gemini model with vision)
- The uploaded image is sent to AI which reads the handwriting, structures the meeting notes, and identifies action items — all in a single step
- No database needed — keeps things simple and lightweight

## Design
- Clean, minimal white design
- Mobile-friendly since you'll likely be uploading photos from your phone
- Simple card-based layout for notes and tasks

