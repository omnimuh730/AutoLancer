# AIMS (Automated Intelligent-Sourcing for Jobs)

AIMS is a comprehensive job application automation tool designed to streamline the job search process. It consists of three main components:

-   **AIMS-frontend:** A web-based user interface for managing and tracking job applications.
-   **AIMS-backend:** A server that handles real-time communication between the frontend and the browser extension.
-   **Extension:** A browser extension that automates tasks related to job applications on various websites.

## Table of Contents

-   [AIMS-frontend](#aims-frontend)
-   [AIMS-backend](#aims-backend)
-   [Extension](#extension)
-   [Contributing](#contributing)
-   [License](#license)

## AIMS-frontend

This is the frontend for the AIMS (Automated intelligent-sourcing for jobs) application. It provides a user interface for managing and automating job applications.

### Features

-   **Dashboard:** Provides an overview of the job application process.
-   **Automation:** Allows users to automate the process of applying for jobs.
-   **Job Listings:** Displays a list of job listings from various sources.
-   **Job Details:** Shows detailed information about a specific job.
-   **Settings:** Allows users to configure the application settings.
-   **Real-time Notifications:** Provides real-time notifications using Socket.io.

### Technologies Used

-   **React:** A JavaScript library for building user interfaces.
-   **Material-UI:** A popular React UI framework.
-   **Vite:** A fast build tool for modern web development.
-   **React Router:** A routing library for React applications.
-   **Socket.io-client:** A library for real-time, bidirectional communication between web clients and servers.
-   **ESLint:** A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.

### Getting Started

To get a local copy up and running, follow these simple steps.

#### Prerequisites

-   Node.js
-   npm or yarn

#### Installation

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

### Project Structure

The project structure is as follows:

-   **public/**: Contains the public assets of the application.
-   **src/**: Contains the source code of the application.
    -   **api/**: Contains the API-related files, such as socket connection and notification hooks.
    -   **assets/**: Contains the static assets of the application, such as images and fonts.
    -   **components/**: Contains the reusable components of the application.
    -   **pages/**: Contains the pages of the application.
    -   **App.jsx**: The main component of the application.
    -   **main.jsx**: The entry point of the application.
    -   **index.css**: The global CSS file of the application.
-   **.eslintrc.cjs**: The ESLint configuration file.
-   **.gitignore**: The gitignore file.
-   **package.json**: The package.json file.
-   **vite.config.js**: The Vite configuration file.

### API Integration

The frontend communicates with the backend using Socket.io for real-time communication. The socket connection is managed in the `src/api/socket.jsx` file. The `useSocket` hook provides a socket instance to the components that need to communicate with the backend.

The `SOCKET_PROTOCOL` and `SOCKET_MESSAGE` from the `configs` directory are used to define the communication protocol between the frontend and the backend.

## AIMS-backend

This is the backend for the AIMS (Automated intelligent-sourcing for jobs) application. It provides a web server that handles real-time communication with the frontend and the browser extension using Socket.io.

### Features

-   **Real-time Communication:** Uses Socket.io to provide real-time, bidirectional communication between the frontend, the browser extension, and the backend.
-   **Connection Handling:** Handles connection and disconnection events from clients.
-   **Message Broadcasting:** Broadcasts messages received from one client to all other connected clients.

### Technologies Used

-   **Node.js:** A JavaScript runtime built on Chrome's V8 JavaScript engine.
-   **Express:** A minimal and flexible Node.js web application framework.
-   **Socket.io:** A library for real-time, bidirectional and event-based communication.
-   **Nodemon:** A tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.
-   **dotenv:** A zero-dependency module that loads environment variables from a `.env` file into `process.env`.

### Getting Started

To get a local copy up and running, follow these simple steps.

#### Prerequisites

-   Node.js
-   npm or yarn

#### Installation

1. Clone the repo
    ```sh
    git clone https://github.com/your_username_/AIMS.git
    ```
2. Navigate to the AIMS-backend directory
    ```sh
    cd AIMS-backend
    ```
3. Install NPM packages
    ```sh
    npm install
    ```
4. Create a `.env` file in the root of the `AIMS-backend` directory and add the following environment variable:
    ```
    PORT=3000
    ```
5. Start the development server
    ```sh
    npm start
    ```

### Project Structure

The project structure is as follows:

-   **core/**: Contains the core logic of the application.
    -   **test.js**: A test file for the core logic.
-   **index.js**: The main entry point of the application.
-   **package.json**: The package.json file.
-   **yarn.lock**: The yarn.lock file.

### API

The backend exposes a Socket.io API for real-time communication. The API is defined in the `index.js` file.

#### Connection

-   **Event:** `connection`
-   **Description:** Fired when a client connects to the server.

#### Disconnection

-   **Event:** `disconnect`
-   **Description:** Fired when a client disconnects from the server.

#### Message Handling

-   **Event:** `SOCKET_PROTOCOL.TYPE.CONNECTION`
-   **Description:** Fired when a client sends a message to the server. The server then broadcasts the message to all other connected clients.

The communication protocol is defined in the `configs/socket_protocol.js` file.

## Extension

This is the browser extension for the AIMS (Automated intelligent-sourcing for jobs) application. It provides a sidebar interface that allows users to interact with web pages and automate tasks related to job applications.

### Features

-   **Sidebar UI:** Provides a user interface within a side panel in the browser.
-   **Element Highlighting:** Highlights elements on the web page based on user-defined patterns.
-   **Action Execution:** Executes actions such as 'click', 'fill', and 'type' on web page elements.
-   **Real-time Communication:** Communicates with the AIMS backend in real-time using Socket.io.

### Technologies Used

-   **React:** A JavaScript library for building user interfaces.
-   **Vite:** A fast build tool for modern web development.
-   **Socket.io-client:** A library for real-time, bidirectional communication between web clients and servers.
-   **ESLint:** A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
-   **Chrome Extension APIs:** A set of APIs for creating Chrome extensions.

### Getting Started

To get a local copy up and running, follow these simple steps.

#### Prerequisites

-   Node.js
-   npm or yarn

#### Installation

1. Clone the repo
    ```sh
    git clone https://github.com/your_username_/AIMS.git
    ```
2. Navigate to the Extension directory
    ```sh
    cd Extension
    ```
3. Install NPM packages
    ```sh
    npm install
    ```
4. Build the extension
    ```sh
    npm run build
    ```
5. Open Chrome and navigate to `chrome://extensions`.
6. Enable "Developer mode".
7. Click on "Load unpacked" and select the `dist` directory within the `Extension` directory.

### Project Structure

The project structure is as follows:

-   **dist/**: Contains the built extension files.
-   **public/**: Contains the public assets of the extension.
-   **src/**: Contains the source code of the extension.
    -   **api/**: Contains the API-related files, such as socket connection and notification hooks.
    -   **assets/**: Contains the static assets of the extension, such as images and fonts.
    -   **components/**: Contains the reusable components of the extension.
    -   **App.jsx**: The main component of the extension's UI.
    -   **main.jsx**: The entry point of the extension's UI.
    -   **background.js**: The background script of the extension.
    -   **contentScript.js**: The content script of the extension.
-   **.eslintrc.cjs**: The ESLint configuration file.
-   **.gitignore**: The gitignore file.
-   **package.json**: The package.json file.
-   **vite.config.js**: The Vite configuration file.

### Architecture

The extension is composed of three main parts:

-   **Background Script (`background.js`):** The background script is the central communication hub of the extension. It listens for messages from the UI and the content script and forwards them to the appropriate destination. It also manages the side panel.
-   **Content Script (`contentScript.js`):** The content script is injected into the web page and has access to the DOM. It is responsible for highlighting elements, executing actions, and fetching data from the page.
-   **Sidebar UI (React components):** The sidebar UI is built with React and provides the user interface for interacting with the extension. It communicates with the background script to send commands and receive data.

### Communication

The different parts of the extension communicate with each other using the `chrome.runtime.onMessage` and `chrome.tabs.sendMessage` APIs. The background script acts as a message broker, relaying messages between the UI and the content script.

The extension also communicates with the AIMS backend using Socket.io. The socket connection is managed in the `src/api/socket.jsx` file.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
