import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";

export default function CollegeSettings() {
  const navigate = useNavigate();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState(150); // meters
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "collegeSettings", "main"));
        if (snap.exists()) {
          const data = snap.data();
          setLat(data.latitude ?? "");
          setLng(data.longitude ?? "");
          setRadius(data.radius ?? 150);
        }
      } catch (err) {
        console.error(err);
        setStatus("❌ Failed to load college settings");
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    if (!lat || !lng) {
      alert("Latitude & Longitude required");
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "collegeSettings", "main"), {
        latitude: Number(lat),
        longitude: Number(lng),
        radius: Number(radius), // meters
        updatedAt: new Date(),
      });

      setStatus("✅ College location saved successfully");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error saving college location");
    } finally {
      setLoading(false);
    }
  };

  // Use browser location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        console.error(err);
        alert("Failed to get location");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ maxWidth: 420, margin: "30px auto", padding: "0 20px" }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: 20, padding: "8px 16px", cursor: "pointer", borderRadius: 4, border: "1px solid #ccc", background: "#f9f9f9" }}
      >
        ← Back
      </button>
      <h2>College Settings</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Latitude</label>
        <input
          type="number"
          step="0.000001"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Enter latitude"
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Longitude</label>
        <input
          type="number"
          step="0.000001"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="Enter longitude"
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Allowed Radius (meters)</label>
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      <button onClick={useCurrentLocation} style={{ width: "100%", marginBottom: 10, padding: 10, cursor: "pointer" }}>
        📍 Use Current Location
      </button>

      <button onClick={saveSettings} disabled={loading} style={{ width: "100%", padding: 10, cursor: "pointer", backgroundColor: "#1976d2", color: "#fff", border: "none", borderRadius: 4 }}>
        {loading ? "Saving..." : "Save Settings"}
      </button>

      {status && <p style={{ marginTop: 10, textAlign: "center" }}>{status}</p>}
    </div>
  );
}
