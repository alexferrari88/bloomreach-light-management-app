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
- **Component Management**:
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

- Node.js 18+ and npm
- Git (optional, for version control)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/bloomreach-management-app.git
cd bloomreach-management-app
```

2. Install dependencies for both server and client:

```bash
npm install
cd client
npm install
cd ..
```

3. Start the development server:

```bash
npm run dev
```

This will start both the backend Express server (port 3001) and the frontend React application (port 3000).

## Usage

### Getting Started

1. Access the application at http://localhost:3000
2. Enter your Bloomreach host URL and authentication token
3. Select the section you want to work with (Content Types or Components)

### Working with Content Types

1. Choose between Core and Development mode
2. Browse existing content types or create new ones
3. Define properties for your content types:
   - Add String, Text, HTML, Boolean, Number, Date fields
   - Configure required/multiple values settings
   - Set display names for better readability
4. Use queue mode to batch multiple operations when needed

### Working with Components

1. Enter your channel ID
2. Select or create a component group
3. Create new components with parameters and field groups
4. Configure advanced parameter settings:
   - Content paths with picker configurations
   - Dropdown selections with value options
   - Image path settings

### Using Operation Queue

1. Toggle "Queue Mode" to start batching operations
2. Make your changes to content types or components
3. Review queued operations in the queue panel
4. Execute all operations at once when ready
5. View success/error status for each operation

### Managing Change History

1. Track all modifications in the Change History panel
2. Review detailed information including before/after states
3. Export changes in various formats:
   - Download modified files as a ZIP archive
   - Generate Git patch files
   - Export change history as JSON

## Project Structure

```
.
├── server.ts                 # Express server for API proxy
├── client/                   # React frontend
│   ├── src/
│   │   ├── App.tsx           # Main application component
│   │   ├── components/       # React components
│   │   │   ├── ContentTypeManager.tsx
│   │   │   ├── ContentTypeEditor.tsx
│   │   │   ├── ComponentManager.tsx
│   │   │   ├── ComponentEditor.tsx
│   │   │   ├── ChangeHistory.tsx
│   │   │   ├── OperationQueue.tsx
│   │   │   └── ...
│   │   ├── contexts/         # React contexts
│   │   │   └── ApiContext.tsx # API and queue management
│   │   ├── types/            # TypeScript interfaces
│   │   ├── hooks/            # React hooks
│   │   └── lib/              # Utility functions
```

## Technical Details

### Backend Technologies

- **Express**: API proxy to handle authentication and Bloomreach API requests
- **Axios**: HTTP client for making API requests
- **TypeScript**: Type-safe JavaScript for the server

### Frontend Technologies

- **React**: UI library for building the interface
- **TypeScript**: Type-safe JavaScript
- **Vite**: Modern build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Sonner**: Toast notifications
- **JSZip**: Creating ZIP files for download
- **FileSaver**: Downloading generated files
- **UUID**: Generating unique IDs for operations

## API Context and Operation Queue

The application uses a React context (`ApiContext`) to manage API interactions and the operation queue. This provides:

- Consistent authentication across all API requests
- Ability to toggle between immediate and queued operation modes
- Smart consolidation of operations to avoid version conflicts
- Comprehensive tracking of changes for history and export

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- Bloomreach CMS for their API
- ShadCN UI for the accessible component library base
