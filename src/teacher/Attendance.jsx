import { useState, useEffect, useRef } from "react";
import { db, auth } from "../services/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { calculateDistance, getLiveLocation } from "../utils/location";

export default function MarkAttendance() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [locationData, setLocationData] = useState(null);
  const [canMark, setCanMark] = useState(false);
  const [selfieTaken, setSelfieTaken] = useState(false);
  const [collegeSettings, setCollegeSettings] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState("checking"); // checking, none, in, out

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadSettingsAndStatus();
    startCamera();
  }, []);

  const loadSettingsAndStatus = async () => {
    try {
      const settingsSnap = await getDoc(doc(db, "collegeSettings", "main"));
      if (settingsSnap.exists()) {
        setCollegeSettings(settingsSnap.data());
      }

      const today = new Date().toISOString().split("T")[0];
      const docId = `${auth.currentUser.uid}_${today}`;
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
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const validateLocation = async () => {
    setLoading(true);
    setMessage("Fetching location...");
    try {
      const pos = await getLiveLocation();
      const { latitude, longitude, accuracy } = pos.coords;
      
      if (!collegeSettings) {
        throw new Error("College settings not loaded");
      }

      const dist = calculateDistance(
        latitude,
        longitude,
        Number(collegeSettings.latitude),
        Number(collegeSettings.longitude)
      );

      setLocationData({ distance: dist, accuracy });

      const allowedRadius = Number(collegeSettings.radius) || 150;

      if (dist <= allowedRadius) {
        setCanMark(true);
        setMessage(`Inside campus (${dist.toFixed(1)}m) ✅`);
      } else {
        setCanMark(false);
        setMessage(`Outside campus (${(dist / 1000).toFixed(2)}km) ❌`);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setCanMark(false);
    } finally {
      setLoading(false);
    }
  };

  const takeSelfie = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    setSelfieTaken(true);
  };

  const isLate = () => {
    const now = new Date();
    const start = new Date();
    start.setHours(9, 40, 0, 0); 
    return now > start;
  };

  const handleAttendance = async () => {
    if (!canMark) return alert("You must be inside the campus");
    if (!selfieTaken && attendanceStatus === "none") return alert("Selfie required for IN");

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const docId = `${auth.currentUser.uid}_${today}`;
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
          date: today,
          inTime: serverTimestamp(),
          status: late ? "Late" : "Present",
          lateReason: lateReason,
          inLocation: locationData,
          createdAt: serverTimestamp(),
        });
        alert("Marked IN successfully ✅");
      } else if (attendanceStatus === "in") {
        await updateDoc(attRef, {
          outTime: serverTimestamp(),
          outLocation: locationData,
          updatedAt: serverTimestamp(),
        });
        alert("Marked OUT successfully ✅");
      }
      loadSettingsAndStatus();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (attendanceStatus === "out") {
    return <div style={{ textAlign: "center", padding: 50 }}><h2>{message}</h2></div>;
  }

  return (
    <div style={{ maxWidth: 420, margin: "30px auto", padding: 20 }}>
      <h2>{attendanceStatus === "in" ? "Mark OUT" : "Mark IN"}</h2>
      
      <button onClick={validateLocation} disabled={loading}>
        {loading ? "Checking..." : "Verify Location"}
      </button>
      
      {locationData && (
        <p>Distance: {locationData.distance < 1000 ? `${locationData.distance.toFixed(1)}m` : `${(locationData.distance/1000).toFixed(2)}km`}</p>
      )}
      <p>{message}</p>

      {attendanceStatus === "none" && (
        <>
          <video ref={videoRef} width="320" height="240" autoPlay style={{ borderRadius: 8, background: "#000" }} />
          <canvas ref={canvasRef} width="320" height="240" hidden />
          <button onClick={takeSelfie} style={{ marginTop: 10 }}>Take Selfie</button>
          {selfieTaken && <p>✅ Selfie captured</p>}
        </>
      )}

      <button 
        onClick={handleAttendance} 
        disabled={loading || !canMark || (attendanceStatus === "none" && !selfieTaken)}
        style={{ marginTop: 20, width: "100%", padding: 12, fontSize: 16 }}
      >
        {loading ? "Processing..." : (attendanceStatus === "in" ? "Mark OUT" : "Mark IN")}
      </button>
    </div>
  );
}

