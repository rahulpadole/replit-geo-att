export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'teacher';
  department?: string;
  employeeId?: string;
  phone?: string;
  designation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string;
  inTime?: Date;
  outTime?: Date;
  status: 'Present' | 'Late' | 'Absent' | 'Half Day' | 'Leave';
  lateReason?: string;
  inLocation?: LocationData;
  outLocation?: LocationData;
  department?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  distance: number;
  accuracy?: number;
}

export interface CollegeSettings {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  updatedAt: Date;
}

export interface Timetable {
  day: string;
  startTime: string;
  lateAfter: string;
  endTime: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'holiday' | 'special' | 'event';
  description?: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target?: string;
  timestamp: Date;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}