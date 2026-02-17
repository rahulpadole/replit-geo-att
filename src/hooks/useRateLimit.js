import { useState, useRef } from 'react';

export const useRateLimit = (maxAttempts = 5, timeWindow = 60000) => {
  const [attempts, setAttempts] = useState([]);
  const timeoutRef = useRef(null);

  const checkRateLimit = () => {
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < timeWindow);
    
    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = recentAttempts[0];
      const waitTime = Math.ceil((timeWindow - (now - oldestAttempt)) / 1000);
      return {
        allowed: false,
        waitTime
      };
    }
    
    return { allowed: true };
  };

  const addAttempt = () => {
    setAttempts(prev => [...prev, Date.now()]);
    
    // Clear attempts after time window
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAttempts([]);
    }, timeWindow);
  };

  const resetAttempts = () => {
    setAttempts([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return { checkRateLimit, addAttempt, resetAttempts };
};