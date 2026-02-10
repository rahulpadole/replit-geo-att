# Geo Attendance System

Geo Attendance System is a location-based attendance management solution for educational institutions. It ensures teachers mark their attendance only when they are within the designated campus area.

## Key Features

- **Geofencing**: Attendance can only be marked within campus radius.
- **Admin Panel**: Manage teachers, view/export attendance records, and manage holidays.
- **Teacher Dashboard**: Mark attendance, view history, and apply for leave.
- **Special Events**: Support for working holidays and special events.
- **Reports**: Export attendance data in PDF and Excel formats.
- **Security**: Role-based access control for Admins and Teachers.

## Tech Stack

- **Frontend**: React 19, Material UI
- **Backend**: Firebase (Firestore, Auth)
- **Reporting**: jsPDF, XLSX

## Setup & Installation

1. Clone the repository.
2. Install dependencies: `npm install`
3. Configure Firebase: Create a `.env` file with your Firebase credentials.
4. Start development server: `npm start`

## Configuration

Add the following to your `.env`:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
