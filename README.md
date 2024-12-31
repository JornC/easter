# Easter Map Game

An injectable OpenLayers-based game module that can be added to any web application using OpenLayers maps.

## Project Structure

- `/easter` - Main game module (TypeScript)

  - Builds to a single injectable JavaScript file
  - Uses OpenLayers for map interactions
  - Zero dependencies except OpenLayers types

- `/example` - Test application

  - Simple OpenLayers map setup
  - Dutch projection (EPSG:28992)
  - PDOK background layer
  - Example of game integration

- `/dev` - Development environment
  - Gateway server for development
  - Development scripts
  - tmux-based development setup

## Development

1. Start the development environment:

```
   ./dev/serve.sh
```

This will start:

- Gateway on port 8080
- Easter module build in watch mode
- Example project
- (Future) API server

2. Visit http://localhost:8080 to see the example application

## Integration

1. Include the built JavaScript file:

```html
<script src="path/to/easter.js"></script>
```

2. Check for availability and activate:

   if (window.**MAP_GAME**?.available) {
   window.**MAP_GAME**.instance.activate(olMap); // Pass OpenLayers map instance
   }

## Building

From the easter directory:

```
    cd easter
    npm run build
```

The built file will be available at `easter/dist/easter.js`
