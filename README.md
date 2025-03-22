# Bloomreach (Light) Management App

A modern web application for managing Bloomreach CMS content types and components through a visual interface, with comprehensive change tracking and Git integration.

![Bloomreach Management App](/path/to/app-screenshot.png)

## Features

### Content Management Features

- **Authentication**: Connect to your Bloomreach instance with your host URL and authentication token
- **Content Type Management**:
  - Core and Development modes
  - Create, read, update, and delete content types
  - Visual editor for defining content type properties
  - Property type selection with options for String, Text, HTML, Boolean, Number, Date, etc.
  - Property configuration including required and multiple value settings
- **Component Management**:
  - Manage component groups
  - Create, read, update, and delete components
  - Visual editor for component parameters and field groups
  - Advanced parameter configuration options (content paths, dropdowns, image sets)

### Change Tracking & Git Integration

- **Change History**:
  - Real-time tracking of all create, update, and delete operations
  - Detailed view of each change with before/after comparison
  - Complete session history with timestamps
- **Version Control Integration**:
  - Download modified and deleted files for Git repositories
  - Organized file structure (content-types and components folders)
  - Comprehensive change manifest with complete change log
  - Automated Git change application script
- **Export Options**:
  - Export individual content types and components as JSON
  - Download complete set of changes as ZIP
  - Copy any configuration to clipboard
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

- Node.js 14+ and npm

### Setup

1. Clone the repository

```bash
git clone https://github.com/alexferrari88/bloomreach-light-management-app.git
cd bloomreach-management-app
```

2. Install dependencies for both server and client

```bash
npm install
cd client
npm install
cd ..
```

3. Start the development server

```bash
npm run dev
```

This will start both the backend Express server and the frontend React application.

## Usage

### Getting Started

1. Access the application at http://localhost:3000
2. Enter your Bloomreach host URL and authentication token
3. Select the section you want to work with (Content Types or Components)

### Working with Content Types

1. Choose between Core and Development mode
2. Browse the list of existing content types
3. Create a new content type with the "New Content Type" button
4. Define properties for your content type:
   - Add String, Text, HTML, Boolean, Number, Date fields
   - Configure if properties are required or support multiple values
   - Set display names for better readability
5. Save your content type
6. Export individual content types as JSON when needed

### Working with Components

1. Enter your channel ID
2. Select or create a component group
3. Create new components with parameters and field groups
4. Configure advanced parameter settings:
   - Content paths with picker configurations
   - Dropdown selections with value options
   - Image path settings and upload options
5. Manage component field groups to organize parameters
6. Save components to your Bloomreach instance

### Using Change History & Git Integration

1. Make your changes to content types and components
2. Review the Change History section to see all modifications
3. Click on any change to view detailed information including before/after states
4. When ready to update your Git repository:
   - Click "Download Files" in the Change History section
   - Review the list of created, updated, and deleted files
   - Download the ZIP file containing:
     - All modified content type and component files
     - A manifest.md file listing all changes
     - An apply-changes.sh script for automated Git updates
5. Apply changes to your Git repository:
   - Either use the provided script: `./apply-changes.sh`
   - Or manually add, update, and remove files as listed in the manifest
6. Commit changes to your repository

## Configuration

### Environment Variables

No additional configuration is required. The application uses environment variables for configuration in production.

### React Client Configuration

The React client is configured with Vite and can be customized by editing the `client/vite.config.ts` file.

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
│   │   │   └── ...
│   │   ├── types/            # TypeScript interfaces
│   │   ├── hooks/            # React hooks
│   │   └── lib/              # Utility functions
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

This will create a production build of the React frontend in the `client/build` directory and prepare the application for deployment.

## Deployment

The application can be deployed to any hosting service that supports Node.js applications, such as Heroku, Netlify, or Vercel.

### Heroku Deployment

```bash
heroku create
git push heroku main
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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- Bloomreach CMS for their API
- ShadCN UI for the accessible component library base
