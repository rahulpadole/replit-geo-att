import { useState, useEffect } from "react";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [adminId, setAdminId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadAdmin = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setEmail(data.email || "");
          setPosition(data.position || "");
          setAdminId(data.adminId || "");
          setPhone(data.phone || "");
          setActive(data.active !== false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAdmin();
  }, [id]);

  const saveAdmin = async () => {
    if (!name.trim() || !email.trim() || (!id && !password.trim())) {
      alert("Name, Email and Password are required");
      return;
    }
    setLoading(true);
    try {
      const adminData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        position: position.trim(),
        adminId: adminId.trim(),
        phone: phone.trim(),
        active: active,
        role: "admin",
      };
      if (id) {
        await updateDoc(doc(db, "users", id), adminData);
        alert("✅ Admin updated");
      } else {
        await addDoc(collection(db, "users"), {
          ...adminData,
          initialPassword: password,
          createdAt: new Date(),
        });
        alert("✅ Admin added");
      }
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "30px auto", padding: "20px", border: "1px solid #ddd", borderRadius: 8 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>← Back</button>
      <h2>{id ? "Edit Admin" : "Add Admin"}</h2>
      <div style={{ display: "grid", gap: "12px" }}>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: 8 }} />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8 }} />
        <input type="text" placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} style={{ padding: 8 }} />
        <input type="text" placeholder="Admin ID" value={adminId} onChange={e => setAdminId(e.target.value)} style={{ padding: 8 }} />
        <input type="text" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: 8 }} />
        {!id && <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 8 }} />}
        <label><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        <button onClick={saveAdmin} disabled={loading} style={{ padding: 12, background: "#1976d2", color: "#fff", border: "none", borderRadius: 4 }}>
          {loading ? "Saving..." : "Save Admin"}
        </button>
      </div>
    </div>
  );
}
