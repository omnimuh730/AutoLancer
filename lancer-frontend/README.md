# AIMS-frontend

This is the frontend for the AIMS (Automated intelligent-sourcing for jobs) application. It provides a user interface for managing and automating job applications.

## Features

- **Dashboard:** Provides an overview of the job application process.
- **Automation:** Allows users to automate the process of applying for jobs.
- **Job Listings:** Displays a list of job listings from various sources.
- **Job Details:** Shows detailed information about a specific job.
- **Settings:** Allows users to configure the application settings.
- **Real-time Notifications:** Provides real-time notifications using Socket.io.

## Technologies Used

- **React:** A JavaScript library for building user interfaces.
- **Material-UI:** A popular React UI framework.
- **Vite:** A fast build tool for modern web development.
- **React Router:** A routing library for React applications.
- **Socket.io-client:** A library for real-time, bidirectional communication between web clients and servers.
- **ESLint:** A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username_/AIMS.git
   ```
2. Navigate to the AIMS-frontend directory
   ```sh
   cd AIMS-frontend
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Start the development server
   ```sh
   npm run dev
   ```

## Project Structure

The project structure is as follows:

- **public/**: Contains the public assets of the application.
- **src/**: Contains the source code of the application.
  - **api/**: Contains the API-related files, such as socket connection and notification hooks.
  - **assets/**: Contains the static assets of the application, such as images and fonts.
  - **components/**: Contains the reusable components of the application.
  - **pages/**: Contains the pages of the application.
  - **App.jsx**: The main component of the application.
  - **main.jsx**: The entry point of the application.
  - **index.css**: The global CSS file of the application.
- **.eslintrc.cjs**: The ESLint configuration file.
- **.gitignore**: The gitignore file.
- **package.json**: The package.json file.
- **vite.config.js**: The Vite configuration file.

## API Integration

The frontend communicates with the backend using Socket.io for real-time communication. The socket connection is managed in the `src/api/socket.jsx` file. The `useSocket` hook provides a socket instance to the components that need to communicate with the backend.

The `SOCKET_PROTOCOL` and `SOCKET_MESSAGE` from the `configs` directory are used to define the communication protocol between the frontend and the backend.
