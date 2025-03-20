# Bloomreach (Light) Management App

A web application for managing Bloomreach CMS content types and components through a visual interface.

## Features

- **Authentication**: Connect to your Bloomreach instance with your host URL and authentication token
- **Content Type Management**:
  - Core and Development modes
  - Create, read, update, and delete content types
  - Visual editor for defining content type properties
- **Component Management**:
  - Manage component groups
  - Create, read, update, and delete components
  - Visual editor for component parameters and field groups
- **Export and Share**:
  - Export content types and components as JSON
  - Copy to clipboard or download as files

## Installation

### Prerequisites

- Node.js 14+ and npm

### Setup

1. Clone the repository

```bash
git clone https://github.com/alexferrari88/bloomreach-light-management-app.git
cd bloomreach-light-management-app
```

2. Install dependencies

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

1. Access the application at http://localhost:3000
2. Enter your Bloomreach host URL and authentication token
3. Select the section you want to work with (Content Types or Components)
4. For Content Types:
   - Select either Core or Development mode
   - Create or edit content types via the visual editor
5. For Components:
   - Enter your channel ID
   - Select or create a component group
   - Create or edit components via the visual editor

## Building for Production

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

## Configuration

No additional configuration is required. The application uses environment variables for configuration in production.

## License

MIT
