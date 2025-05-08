# Tutoring Scheduler

A web application for scheduling tutoring sessions at your school. Teachers can request students for specific lunch periods and see who has been requested by other teachers.

## Features

- Teacher selection screen for login
- Request students for specific lunch periods (A, B, C, D)
- View all tutoring requests
- Cancel your own tutoring requests
- One teacher per student per day restriction
- Filter and search functionality

## Project Structure

This project consists of two main parts:
- **Server**: A Node.js/Express backend with SQLite database
- **Client**: A React.js frontend with Material-UI components

## Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)

## Installation and Setup

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

The server will run on port 5000 and create a SQLite database file (database.sqlite) in the server directory.

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the client:
   ```bash
   npm start
   ```

The React app will open in your browser at http://localhost:3000.

## API Endpoints

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get a specific teacher
- `POST /api/teachers` - Create a new teacher

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get a specific student
- `POST /api/students` - Create a new student

### Tutoring Requests
- `GET /api/tutoring` - Get all tutoring requests
- `POST /api/tutoring` - Create a new tutoring request
- `PUT /api/tutoring/cancel/:id` - Cancel a tutoring request

## Running in Production

To build the client for production:

```bash
cd client
npm run build
```

This will create a `build` folder that can be served by any static file server.

## Deploying to a Raspberry Pi

For deploying to a Raspberry Pi, you can:

1. Clone this repository on your Raspberry Pi
2. Follow the installation steps above
3. Use a process manager like PM2 to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start server/server.js
   ```
4. Serve the client build folder using a tool like serve:
   ```bash
   npm install -g serve
   serve -s client/build
   ```

## License

This project is licensed under the MIT License.
