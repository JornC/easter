# Technical Architecture

## Client-Side Structure

### Build Setup

- TypeScript project using Vite
- Output: Single minified JavaScript bundle
- No external dependencies except OpenLayers types

### Module Structure

The game exposes itself through a global window object with the following structure:

```typescript
window.__MAP_GAME__ = {
    available: boolean,
    instance: {
        activate: (mapElementId: string) => void,
        deactivate: () => void
    }
}
```

### Key Components

1. **Game Controller**

   - Main entry point
   - Manages game state
   - Handles OpenLayers integration
   - Coordinates between all other components

2. **Feature Manager**

   - Handles drawing/managing game elements
   - Uses OpenLayers Vector layers
   - Manages interactions with game objects
   - Collision detection and spatial queries

3. **UI Manager**

   - Creates overlay elements
   - Score display
   - Game controls
   - Leaderboard display
   - Modal dialogs for game events

4. **API Client**
   - Handles communication with backend
   - Score submission
   - Leaderboard fetching
   - Error handling and retry logic

## Backend Structure

### Technology Stack

- Spring Boot application
- H2 database (existing)
- RESTful API endpoints

### API Endpoints

    GET  /api/scores      - Fetch highscores
    POST /api/scores      - Submit new score
    GET  /api/leaderboard - Get formatted leaderboard

## Build & Distribution

1. Client build produces single 'game-bundle.js'
2. Host applications include bundle via script tag
3. Check for window.**MAP_GAME**.available
4. Activate using window.**MAP_GAME**.instance.activate('map-id')

## Security Considerations

- CORS configuration for API endpoints
- Rate limiting for score submission
- Basic validation of game results
- XSS prevention in leaderboard display

## Development Workflow

1. Develop and test client in isolation
2. Build and integrate with test applications
3. Deploy backend separately
4. Distribute client bundle to host applications
