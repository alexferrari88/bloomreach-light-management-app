# Bloomreach Management App

A modern web application for managing Bloomreach CMS content types and components through a visual interface, with comprehensive change tracking, queued operations, and Git integration.

## Features

### Content Management Features

- **Authentication**: Connect to any Bloomreach instance with host URL and authentication token
- **Content Type Management**:
  - Core and Development mode support
  - Create, read, update, and delete content types
  - Visual editor for defining content type properties
  - Property type configuration (String, Text, HTML, Boolean, Number, Date, etc.)
  - Required and multiple value settings
- \*Component Management\*\*:
  - Manage component groups
  - Create, read, update, and delete components
  - Visual editor for component parameters and field groups
  - Advanced parameter configuration including:
    - Content paths with picker configurations
    - Dropdown options with value lists
    - Image set path configurations

### Operation Queue System

- **Queue Mode**: Toggle between immediate execution and queued operations
- **Batch Operations**: Group multiple changes for review before execution
- **Operation Review**: Inspect queued operations before executing them
- **Smart Consolidation**: Automatically combines multiple operations on the same entity to avoid version conflicts
- **Error Handling**: Visual feedback for successful and failed operations

### Change Tracking & Git Integration

- **Change History**:
  - Real-time tracking of all create, update, and delete operations
  - Detailed view of each change with before/after comparison
  - Complete session history with timestamps
- **Git Integration**:
  - Download modified and deleted files for Git repositories
  - Generate Git patch files for easier application
  - Organized file structure (content-types and components folders)
  - Comprehensive change manifest with complete change log

### Export Options

- **Multiple Export Formats**:
  - Download individual content types and components as JSON
  - Download complete set of changes as ZIP
  - Generate Git patches for version control systems
  - Export complete change history

### Modern UI Features

- **User Interface**:
  - Modern UI built with React and Tailwind CSS
  - Responsive design that works on desktop and tablets
  - Interactive tables for content management
  - Form validation and error handling
  - Real-time notifications through toast messages
- **Navigation**:
  - Tab-based navigation between content types and components
  - Modal dialogs for detailed operations
  - Clean workspace areas for content editing

## Installation

### Prerequisites

- Node.js **v20.x** (LTS recommended, as specified in `package.json` engines) and npm
- Git (optional, for version control)

### Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/alexferrari88/bloomreach-management-app.git
   cd bloomreach-management-app
   ```

2. Install root dependencies (includes server dependencies and development tools):

   ```bash
   npm install
   ```

   _(Note: Client dependencies are installed automatically during the development or build process)._

3. Start the development servers:

   ```bash
   npm run dev
   ```

   This command concurrently starts:

   - The backend Express server (API proxy) using `ts-node` with hot-reloading via `nodemon` (typically on port 3001).
   - The frontend React application using the Vite development server with hot-reloading (typically on port 3000). The Vite dev server proxies API requests (`/api`) to the backend server.

   Access the application at `http://localhost:3000`.

### Production Build (Local)

To create a production-ready build locally:

```bash
npm run build
```

This command will:

1. Install client dependencies (`npm run install:client`).
2. Create an optimized static build of the React client application in `client/dist/` (`npm run build:client`).
3. Compile the backend TypeScript server code into JavaScript in `dist/` (`npm run build:server`).

You can then run the production server using:

```bash
npm start
```

This runs `node dist/server.js`. The Express server will serve the static client files from `client/dist` and handle API requests.

## Deployment (e.g., Render, Railway)

1. **Repository:** Ensure your code is pushed to a Git repository (e.g., GitHub).
2. **Platform Setup:** Connect your Git repository to the deployment platform (Render, Railway, etc.).
3. **Build Command:** Set the build command to:

   ```bash
   npm install && npm run build
   ```

   _(This installs all dependencies and runs the full client and server build process)._

4. **Start Command:** Set the start command to:

   ```bash
   npm start
   ```

   _(This runs the compiled production server)._

5. **Node Version:** Ensure the platform uses Node.js version **20.x**, matching the `engines` field in `package.json`. Most platforms allow specifying the Node version.
6. **Environment Variables:** Set `NODE_ENV` to `production`. The server uses this to determine whether to serve static client files.

## Usage

### Getting Started

1. Access the application in your web browser
   - Local development: `http://localhost:3000`
   - Deployed: Your deployment platform URL (e.g., `https://your-app.onrender.com`)
2. Enter your Bloomreach host URL and authentication token.
3. Select the section you want to work with (Content Types or Components).

### Working with Content Types

1. Choose between Core and Development mode.
2. Browse existing content types or create new ones.
3. Define properties for your content types:
   - Add String, Text, HTML, Boolean, Number, Date fields.
   - Configure required/multiple values settings.
   - Set display names for better readability.
4. Use queue mode to batch multiple operations when needed.

### Working with Components

1. Enter your channel ID.
2. Select or create a component group.
3. Create new components with parameters and field groups.
4. Configure advanced parameter settings:
   - Content paths with picker configurations.
   - Dropdown selections with value options.
   - Image path settings.

### Using Operation Queue

1. Toggle "Queue Mode" to start batching operations.
2. Make your changes to content types or components.
3. Review queued operations in the queue panel.
4. Execute all operations at once when ready.
5. View success/error status for each operation.

### Managing Change History

1. Track all modifications in the Change History panel.
2. Review detailed information including before/after states.
3. Export changes in various formats:
   - Download modified files as a ZIP archive.
   - Generate Git patch files.
   - Export change history as JSON.

## Project Structure

```markdown
.
├── server.ts # Express server: API proxy & serves client build in prod
├── dist/ # Compiled server code (generated by `npm run build:server`)
├── client/ # React frontend source code
│ ├── dist/ # Static client build output (generated by `npm run build:client`)
│ ├── public/
│ ├── src/
│ │ ├── App.tsx # Main application component
│ │ ├── components/ # React components (UI, features)
│ │ ├── contexts/ # React contexts (ApiContext)
│ │ ├── types/ # TypeScript interfaces
│ │ ├── hooks/ # React hooks
│ │ └── lib/ # Utility functions
│ ├── vite.config.ts # Vite configuration (dev server, proxy, build settings)
│ └── package.json # Client dependencies and scripts
├── tsconfig.json # TypeScript config for the server
├── package.json # Root dependencies, build/dev scripts
└── README.md # This file
```

## Technical Details

### Backend Technologies

- **Express**: API proxy to handle authentication and Bloomreach API requests. Serves static client build in production.
- **Axios**: HTTP client for making API requests.
- **TypeScript**: Type-safe JavaScript for the server.
- **`@types/node`**: Placed in `dependencies` for better compatibility with certain build environments.

### Frontend Technologies

- **React**: UI library for building the interface.
- **TypeScript**: Type-safe JavaScript.
- **Vite**: Modern build tool and development server.
  - Handles Hot Module Replacement (HMR) during development.
  - Bundles the client application for production (`client/dist`).
  - The `server.proxy` setting in `vite.config.ts` is **only** used during local development to forward `/api` calls from `localhost:3000` to `localhost:3001`. It is **not** used in the production build.
- **Tailwind CSS**: Utility-first CSS framework.
- **Radix UI**: Accessible component primitives.
- **Lucide React**: Icon library.
- **Sonner**: Toast notifications.
- **JSZip**: Creating ZIP files for download.
- **FileSaver**: Downloading generated files.
- **UUID**: Generating unique IDs for operations.

### Server/Client Interaction (Production)

- The client is built into static assets (`client/dist`).
- The Express server (`dist/server.js`) uses `express.static` to serve these assets.
- A catch-all route (`app.get('*', ...)`) in the server serves `client/dist/index.html` for any routes not matched by the API or static files, enabling client-side routing (SPA).
- API calls from the client (e.g., `/api/execute`) are made relative to the origin and handled directly by the Express server running on the same service.

## API Context and Operation Queue

The application uses a React context (`ApiContext`) to manage API interactions and the operation queue. This provides:

- Consistent authentication across all API requests.
- Ability to toggle between immediate and queued operation modes.
- Smart consolidation of operations to avoid version conflicts.
- Comprehensive tracking of changes for history and export.

## Environment Variables

- **`NODE_ENV`**: Set to `production` for production builds/deployments. The server uses this to enable serving static client files.
- **`PORT`**: Port for the Express server (defaults to 3001 locally if not set, assigned automatically by platforms like Render).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- My wife for her unweavering support
- Claude 3.7 Sonnet for providing the majority of the code
- Google Gemini 2.5 Pro for helping fixing deployment issues
- Bloomreach CMS for their API
- ShadCN UI for the awesome component library
