import { useState, useEffect, useRef } from "react";
import { db, auth } from "../services/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { calculateDistance, getLiveLocation } from "../utils/location";
import { useToast } from "../hooks/useToast";
import LoadingSpinner from "../components/LoadingSpinner";

export default function MarkAttendance() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [canMark, setCanMark] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [collegeSettings, setCollegeSettings] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState("checking");
  const [timetable, setTimetable] = useState(null);
  const { showToast } = useToast();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Load settings and status
  const loadSettingsAndStatus = async () => {
    try {
      // Load college settings
      const settingsSnap = await getDoc(doc(db, "collegeSettings", "main"));
      if (settingsSnap.exists()) {
        setCollegeSettings(settingsSnap.data());
      }

      // Load timetable for today
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const timetableSnap = await getDoc(doc(db, "timetable", today));
      if (timetableSnap.exists()) {
        setTimetable(timetableSnap.data());
      }

      // Check attendance status
      const date = new Date().toISOString().split("T")[0];
      const docId = `${auth.currentUser.uid}_${date}`;
      const attSnap = await getDoc(doc(db, "attendance", docId));
      
      if (attSnap.exists()) {
        const data = attSnap.data();
        if (data.outTime) {
          setAttendanceStatus("out");
          setMessage("Attendance completed for today ✅");
        } else {
          setAttendanceStatus("in");
          setMessage("Already marked IN. Ready to mark OUT?");
        }
      } else {
        setAttendanceStatus("none");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load data", "error");
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
      showToast("Camera access denied", "error");
    }
  };

  // Validate location
  const validateLocation = async () => {
    setLoading(true);
    setMessage("Fetching location...");
    
    try {
      if (!collegeSettings) {
        throw new Error("College settings not loaded");
      }

      const position = await getLiveLocation();
      const { latitude, longitude, accuracy } = position.coords;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        Number(collegeSettings.latitude),
        Number(collegeSettings.longitude)
      );

      const locationInfo = {
        distance,
        accuracy,
        lat: latitude,
        lng: longitude
      };

      setLocationData(locationInfo);

      const allowedRadius = Number(collegeSettings.radius) || 150; // meters

      if (distance <= allowedRadius) {
        setCanMark(true);
        setMessage(`✅ Inside campus (${distance.toFixed(1)}m from college)`);
      } else {
        setCanMark(false);
        setMessage(`❌ Outside campus (${(distance/1000).toFixed(2)}km away)`);
      }

    } catch (error) {
      console.error("Location error:", error);
      setMessage(`❌ Error: ${error.message}`);
      setCanMark(false);
    } finally {
      setLoading(false);
    }
  };

  // Take selfie
  const takeSelfie = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    setSelfieTaken(true);
    showToast("Selfie captured successfully", "success");
  };

  // Check if late
  const isLate = () => {
    if (!timetable) return false;
    
    const now = new Date();
    const [lateHour, lateMinute] = timetable.lateAfter.split(':').map(Number);
    const lateTime = new Date();
    lateTime.setHours(lateHour, lateMinute, 0, 0);
    
    return now > lateTime;
  };

  // Handle attendance
  const handleAttendance = async () => {
    if (!canMark) {
      showToast("You must be inside the campus", "error");
      return;
    }
    
    if (!selfieTaken && attendanceStatus === "none") {
      showToast("Selfie required for IN", "error");
      return;
    }

    setLoading(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const docId = `${auth.currentUser.uid}_${date}`;
      const attRef = doc(db, "attendance", docId);

      if (attendanceStatus === "none") {
        const late = isLate();
        let lateReason = "";
        if (late) {
          lateReason = prompt("You are LATE. Enter reason:");
          if (!lateReason) throw new Error("Late reason required");
        }

        await setDoc(attRef, {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email,
          date: date,
          inTime: serverTimestamp(),
          status: late ? "Late" : "Present",
          lateReason: lateReason,
          inLocation: locationData,
          createdAt: serverTimestamp(),
        });
        showToast("Marked IN successfully ✅", "success");
      } else if (attendanceStatus === "in") {
        await updateDoc(attRef, {
          outTime: serverTimestamp(),
          outLocation: locationData,
          updatedAt: serverTimestamp(),
        });
        showToast("Marked OUT successfully ✅", "success");
      }
      loadSettingsAndStatus();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    loadSettingsAndStatus();
    startCamera();
    
    // Cleanup camera
    const videoElement = videoRef.current;
    return () => {
      if (videoElement?.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array is correct here

  if (attendanceStatus === "out") {
    return (
      <div style={styles.completedContainer}>
        <h2>{message}</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>{attendanceStatus === "in" ? "Mark OUT" : "Mark IN"}</h2>
      
      <button 
        onClick={validateLocation} 
        disabled={loading}
        style={styles.button}
      >
        {loading ? <LoadingSpinner size="small" /> : "📍 Verify Location"}
      </button>
      
      {locationData && (
        <div style={styles.locationInfo}>
          <p style={styles.distance}>
            Distance: {locationData.distance < 1000 
              ? `${locationData.distance.toFixed(1)}m` 
              : `${(locationData.distance/1000).toFixed(2)}km`}
          </p>
          {locationData.accuracy && (
            <p style={styles.accuracy}>
              Accuracy: ±{locationData.accuracy.toFixed(0)}m
            </p>
          )}
        </div>
      )}
      <p style={styles.message}>{message}</p>

      {attendanceStatus === "none" && (
        <>
          <video 
            ref={videoRef} 
            width="320" 
            height="240" 
            autoPlay 
            playsInline
            style={styles.video} 
          />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
          <button 
            onClick={takeSelfie} 
            style={{
              ...styles.button,
              ...(canMark ? styles.primaryButton : styles.button)
            }}
            disabled={!canMark}
          >
            📸 Take Selfie
          </button>
          {selfieTaken && <p style={styles.success}>✅ Selfie captured</p>}
        </>
      )}

      <button 
        onClick={handleAttendance} 
        disabled={loading || !canMark || (attendanceStatus === "none" && !selfieTaken)}
        style={{
          ...styles.button,
          ...styles.primaryButton,
          opacity: loading || !canMark || (attendanceStatus === "none" && !selfieTaken) ? 0.6 : 1,
          marginTop: attendanceStatus === "none" ? 10 : 20
        }}
      >
        {loading ? <LoadingSpinner size="small" /> : (attendanceStatus === "in" ? "✅ Mark OUT" : "✅ Mark IN")}
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 420,
    margin: "30px auto",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  button: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    backgroundColor: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    transition: "all 0.3s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px"
  },
  primaryButton: {
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    fontWeight: "bold"
  },
  video: {
    width: "100%",
    maxWidth: 320,
    height: "auto",
    borderRadius: 8,
    background: "#000",
    marginTop: 10,
    marginLeft: "auto",
    marginRight: "auto",
    display: "block"
  },
  locationInfo: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 6,
    marginTop: 10
  },
  distance: {
    margin: 0,
    fontWeight: "bold",
    color: "#1976d2"
  },
  accuracy: {
    margin: "5px 0 0 0",
    fontSize: 12,
    color: "#666"
  },
  message: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    textAlign: "center",
    color: "#666"
  },
  success: {
    color: "#2e7d32",
    marginTop: 5,
    textAlign: "center",
    fontWeight: "bold"
  },
  completedContainer: {
    textAlign: "center",
    padding: 50,
    maxWidth: 500,
    margin: "40px auto",
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  }
};