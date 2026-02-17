// User roles
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher'
};

// Attendance status
export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  LEAVE: 'Leave'
};

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  ATTENDANCE: 'attendance',
  TIMETABLE: 'timetable',
  HOLIDAYS: 'holidays',
  COLLEGE_SETTINGS: 'collegeSettings',
  AUDIT_LOGS: 'auditLogs',
  ACTIVITY_LOGS: 'activity_logs'
};

// Default values
export const DEFAULTS = {
  ATTENDANCE_RADIUS: 150, // meters
  PAGINATION_LIMIT: 40,
  RATE_LIMIT_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  SESSION_TIMEOUT: 3600000 // 1 hour
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.'
};

// Days of week
export const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  USER_PREFERENCES: 'userPreferences',
  SESSION: 'session'
};