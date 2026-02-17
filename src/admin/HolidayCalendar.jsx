import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmDialog from "../components/ConfirmDialog";

export default function HolidayCalendar() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });
  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "holiday",
    description: ""
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "holidays"), orderBy("date", "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHolidays(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load holidays", "error");
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "holidays"), {
        name: form.name,
        date: form.date,
        type: form.type,
        description: form.description,
        createdAt: new Date()
      });

      showToast("Holiday added successfully", "success");
      setForm({ name: "", date: "", type: "holiday", description: "" });
      setShowForm(false);
      fetchHolidays();
    } catch (err) {
      showToast("Error adding holiday", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteHoliday = async () => {
    const { id, name } = deleteDialog;
    try {
      await deleteDoc(doc(db, "holidays", id));
      showToast(`Deleted: ${name}`, "success");
      fetchHolidays();
    } catch (err) {
      showToast("Error deleting holiday", "error");
    } finally {
      setDeleteDialog({ isOpen: false, id: null, name: '' });
    }
  };

  // Group holidays by month
  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const month = holiday.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  const months = Object.keys(groupedHolidays).sort();

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← Back
      </button>
      
      <div style={styles.header}>
        <h2 style={styles.title}>Holiday Calendar</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          {showForm ? '✕ Close' : '+ Add Holiday'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addHoliday} style={styles.form}>
          <h3 style={styles.formTitle}>Add New Holiday/Event</h3>
          
          <div style={styles.formGroup}>
            <label>Event Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="e.g., Independence Day"
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label>Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({...form, date: e.target.value})}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
                style={styles.input}
              >
                <option value="holiday">Holiday</option>
                <option value="special">Special Working Day</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Additional details..."
              style={{...styles.input, minHeight: 80}}
              rows={3}
            />
          </div>
          
          <div style={styles.formActions}>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? <LoadingSpinner size="small" /> : 'Save Event'}
            </button>
          </div>
        </form>
      )}

      {loading && !showForm ? (
        <LoadingSpinner />
      ) : (
        <div style={styles.calendar}>
          {months.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No holidays added yet</p>
              <small>Click "Add Holiday" to get started</small>
            </div>
          ) : (
            months.map(month => (
              <div key={month} style={styles.monthCard}>
                <h3 style={styles.monthTitle}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                
                <div style={styles.holidayList}>
                  {groupedHolidays[month].map(holiday => (
                    <div key={holiday.id} style={styles.holidayItem}>
                      <div style={styles.holidayInfo}>
                        <div style={styles.holidayDate}>
                          {new Date(holiday.date + 'T12:00:00').toLocaleDateString('en-US', {
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </div>
                        <div style={styles.holidayDetails}>
                          <div style={styles.holidayName}>
                            {holiday.name}
                            <span style={{
                              ...styles.holidayBadge,
                              backgroundColor: holiday.type === 'holiday' ? '#d32f2f' :
                                             holiday.type === 'special' ? '#2e7d32' : '#ed6c02'
                            }}>
                              {holiday.type}
                            </span>
                          </div>
                          {holiday.description && (
                            <div style={styles.holidayDesc}>{holiday.description}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteDialog({ 
                          isOpen: true, 
                          id: holiday.id, 
                          name: holiday.name 
                        })}
                        style={styles.deleteButton}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={deleteHoliday}
        title="Delete Holiday"
        message={`Are you sure you want to delete "${deleteDialog.name}"?`}
        confirmText="Delete"
      />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "30px auto",
    padding: "0 20px"
  },
  backButton: {
    padding: "8px 16px",
    marginBottom: 20,
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #ccc",
    background: "#f9f9f9"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30
  },
  title: {
    margin: 0
  },
  addButton: {
    padding: "10px 20px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold"
  },
  form: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  formTitle: {
    marginTop: 0,
    marginBottom: 20
  },
  formGroup: {
    marginBottom: 15,
    flex: 1
  },
  formRow: {
    display: "flex",
    gap: 15,
    marginBottom: 15
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    fontFamily: "inherit"
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#f5f5f5",
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "pointer"
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#2e7d32",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold"
  },
  calendar: {
    display: "grid",
    gap: 20
  },
  monthCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  monthTitle: {
    margin: "0 0 15px 0",
    paddingBottom: 10,
    borderBottom: "2px solid #1976d2",
    color: "#1976d2"
  },
  holidayList: {
    display: "grid",
    gap: 10
  },
  holidayItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    border: "1px solid #eee"
  },
  holidayInfo: {
    display: "flex",
    gap: 15,
    alignItems: "center",
    flex: 1
  },
  holidayDate: {
    minWidth: 70,
    fontWeight: "bold",
    color: "#666"
  },
  holidayDetails: {
    flex: 1
  },
  holidayName: {
    fontWeight: "bold",
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  holidayBadge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 12,
    color: "#fff",
    textTransform: "capitalize"
  },
  holidayDesc: {
    fontSize: 13,
    color: "#666"
  },
  deleteButton: {
    padding: "5px 10px",
    backgroundColor: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    opacity: 0.6,
    transition: "opacity 0.2s"
  },
  emptyState: {
    textAlign: "center",
    padding: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    color: "#666"
  }
};