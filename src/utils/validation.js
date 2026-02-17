export const validateAttendance = (data) => {
  const errors = [];
  
  if (!data.userId) errors.push('User ID required');
  if (!data.date) errors.push('Date required');
  if (!data.inTime && !data.outTime) errors.push('At least one time required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTeacher = (data) => {
  const errors = [];
  
  if (!data.name?.trim()) errors.push('Name required');
  if (!data.email?.trim()) errors.push('Email required');
  if (!data.email?.includes('@')) errors.push('Invalid email');
  if (!data.department?.trim()) errors.push('Department required');
  if (!data.employeeId?.trim()) errors.push('Employee ID required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCollegeSettings = (data) => {
  const errors = [];
  
  if (!data.latitude || isNaN(data.latitude)) errors.push('Valid latitude required');
  if (!data.longitude || isNaN(data.longitude)) errors.push('Valid longitude required');
  if (!data.radius || data.radius < 1) errors.push('Radius must be at least 1 meter');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};