import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import ResetDatabaseButton from '../components/ResetDatabase';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [todayPresent, setTodayPresent] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [collegeStatus, setCollegeStatus] = useState("Checking...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      /* ------------------ TOTAL TEACHERS ------------------ */
      const teacherSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "teacher"))
      );
      setTotalTeachers(teacherSnap.size);

      /* ------------------ TOTAL ADMINS ------------------ */
      const adminSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"))
      );
      setTotalAdmins(adminSnap.size);

      /* ------------------ TODAY ATTENDANCE ------------------ */
      const today = new Date().toISOString().split("T")[0];
      const attendanceSnap = await getDocs(
        query(collection(db, "attendance"), where("date", "==", today))
      );

      let present = 0;
      let late = 0;

      attendanceSnap.forEach((doc) => {
        const data = doc.data();
        if (data.status === "Present") present++;
        if (data.lateReason && data.lateReason.trim() !== "") late++;
      });

      setTodayPresent(present);
      setLateCount(late);

      /* ------------------ COLLEGE LOCATION STATUS ------------------ */
      const collegeSnap = await getDoc(doc(db, "collegeSettings", "main"));

      if (!collegeSnap.exists()) {
        setCollegeStatus("Location Not Set ❌");
      } else {
        const { latitude, longitude, radius } = collegeSnap.data();
        if (latitude && longitude && radius) {
          setCollegeStatus("Location Configured ✅");
        } else {
          setCollegeStatus("Incomplete Location ❌");
        }
      }
    } catch (error) {
      console.error("Admin Dashboard Error:", error);
      setCollegeStatus("Error Loading ❌");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 60 }}>
        <h3>Loading Dashboard...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center", marginBottom: 30 }}>
        Admin Dashboard
      </h2>

      {/* ------------------ STATS ------------------ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        <StatCard title="Total Teachers" value={totalTeachers} />
        <StatCard title="Total Admins" value={totalAdmins} />
        <StatCard title="Today Present" value={todayPresent} />
        <StatCard title="Late Arrivals" value={lateCount} />
        <StatCard title="College Location" value={collegeStatus} />
      </div>

      {/* ------------------ ACTIONS ------------------ */}
      <div
        style={{
          marginTop: 50,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 15,
        }}
      >
        <ActionButton
          text="➕ Add New Admin"
          onClick={() => navigate("/admin/admin-form")}
          highlight
        />

        <ActionButton
          text="College Settings"
          onClick={() => navigate("/admin/college-settings")}
        />

        <ActionButton
          text="Timetable & Schedule"
          onClick={() => navigate("/admin/timetable")}
        />

        <ActionButton
          text="Teachers"
          onClick={() => navigate("/admin/teachers")}
        />
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <ResetDatabaseButton />
        </div>

        <ActionButton
          text="Attendance Records"
          onClick={() => navigate("/admin/attendance")}
        />

        <ActionButton
          text="Export Data"
          onClick={() => navigate("/admin/export")}
        />

        <ActionButton
          text="Audit Logs"
          onClick={() => navigate("/admin/audit-logs")}
        />

        <ActionButton
          text="My Profile"
          onClick={() => navigate("/admin/profile")}
        />
      </div>
    </div>
  );
}

/* ------------------ UI COMPONENTS ------------------ */

function StatCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 20,
        borderRadius: 12,
        textAlign: "center",
        background: "#fff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      }}
    >
      <h4 style={{ marginBottom: 10 }}>{title}</h4>
      <p style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({ text, onClick, highlight = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 18px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        backgroundColor: highlight ? "#2e7d32" : "#1976d2",
        color: "#fff",
        fontWeight: "bold",
        minWidth: 200,
        transition: "0.2s",
      }}
      onMouseOver={(e) =>
        (e.target.style.opacity = "0.9")
      }
      onMouseOut={(e) =>
        (e.target.style.opacity = "1")
      }
    >
      {text}
    </button>
  );
}
