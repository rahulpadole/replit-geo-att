# Geo Attendance System

## Overview
A geo-location based attendance management system built with React and Firebase. The app supports two user roles: Teachers and Admins. Teachers can mark attendance based on their geographic location, while Admins can manage teachers, timetables, and view attendance reports.

## Current State
- Frontend: React (Create React App) running on port 5000
- Backend: Firebase (Firestore, Auth, Storage, Cloud Functions)
- UI Framework: Material UI (MUI)

## Project Architecture
```
src/
  admin/         - Admin panel components (Dashboard, Teachers, Attendance, etc.)
  auth/          - Authentication components (Login, ForgotPassword)
  components/    - Shared components (Navbar, Footer)
  pages/         - Page-level components (MarkAttendance, AdminTimetable)
  routes/        - Route guards (AdminRoute, TeacherRoute)
  services/      - Firebase service configuration
  teacher/       - Teacher panel components (Dashboard, Attendance, Leave, etc.)
  utils/         - Utility functions (distance, location)
functions/       - Firebase Cloud Functions
public/          - Static assets
```

## Key Configuration
- Firebase config is loaded via environment variables (REACT_APP_FIREBASE_*)
- Dev server runs on port 5000 with host 0.0.0.0
- Host checking disabled for Replit proxy compatibility

## Dependencies
- React 19, React Router 7, MUI 7
- Firebase 12 (Auth, Firestore, Storage)
- jspdf + jspdf-autotable (PDF export)
- xlsx (Excel export)
