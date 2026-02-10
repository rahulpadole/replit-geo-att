import { useState, useEffect } from "react";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { useParams, useNavigate } from "react-router-dom";
import { logAdminAction } from "../utils/logger";

export default function TeacherForm() {
  const { id } = useParams(); // teacher doc id (for edit)
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load teacher when editing
  useEffect(() => {
    if (!id) return;

    const loadTeacher = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (!snap.exists()) {
          alert("Teacher not found");
          navigate("/admin/teachers");
          return;
        }
        const data = snap.data();
        setName(data.name || "");
        setEmail(data.email || "");
        setDepartment(data.department || "");
        setEmployeeId(data.employeeId || "");
        setPhone(data.phone || "");
        setDesignation(data.designation || "");
        setJoiningDate(data.joiningDate || "");
        setActive(data.active !== false);
      } catch (err) {
        console.error(err);
        alert("Failed to load teacher");
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, [id, navigate]);

  // Save teacher
  const saveTeacher = async () => {
    if (!name.trim() || !email.trim() || !department.trim() || !employeeId.trim() || (!id && !password.trim())) {
      alert("Please fill all mandatory fields (Name, Email, Dept, ID, Password)");
      return;
    }

    setLoading(true);
    try {
      const teacherData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department: department.trim(),
        employeeId: employeeId.trim(),
        phone: phone.trim(),
        designation: designation.trim(),
        joiningDate: joiningDate,
        active: active,
      };

      if (id) {
        // Update
        await updateDoc(doc(db, "users", id), teacherData);
        await logAdminAction(auth.currentUser?.email || "Admin", "Updated Teacher", name);
        alert("✅ Teacher updated");
      } else {
        // Create
        await addDoc(collection(db, "users"), {
          ...teacherData,
          initialPassword: password,
          role: "teacher",
          createdAt: new Date(),
        });
        await logAdminAction(auth.currentUser?.email || "Admin", "Added Teacher", name);
        alert("✅ Teacher added. Remember to create Auth account with this email/password.");
      }

      navigate("/admin/teachers");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "30px auto", padding: "20px", border: "1px solid #ddd", borderRadius: 8 }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: 20, padding: "8px 16px", cursor: "pointer", borderRadius: 4, border: "1px solid #ccc", background: "#f9f9f9" }}
      >
        ← Back
      </button>
      <h2>{id ? "Edit Teacher" : "Add Teacher"}</h2>

      <div style={{ display: "grid", gap: "12px" }}>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Full Name*</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Email*</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Employee ID*</label>
            <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Department*</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
        </div>

        {!id && (
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Initial Password*</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Designation</label>
            <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Date of Joining</label>
          <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active Status
          </label>
        </div>

        <button
          onClick={saveTeacher}
          disabled={loading}
          style={{ padding: "12px", cursor: "pointer", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold" }}
        >
          {loading ? "Saving..." : "Save Teacher"}
        </button>
      </div>
    </div>
  );
}
