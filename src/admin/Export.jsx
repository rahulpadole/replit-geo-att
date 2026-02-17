import { useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import { ATTENDANCE_STATUS } from '../constants';

export default function Export() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    department: "",
    status: "",
    teacherName: ""
  });
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadAttendance = async () => {
    if (!filters.fromDate || !filters.toDate) {
      showToast("Please select date range", "error");
      return;
    }

    setLoading(true);
    try {
      let q = query(
        collection(db, "attendance"),
        where("date", ">=", filters.fromDate),
        where("date", "<=", filters.toDate),
        orderBy("date", "asc")
      );

      let snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Apply filters
      if (filters.department) {
        list = list.filter(r => r.department === filters.department);
      }
      
      if (filters.status) {
        list = list.filter(r => r.status === filters.status);
      }
      
      if (filters.teacherName) {
        const searchTerm = filters.teacherName.toLowerCase();
        list = list.filter(r => 
          (r.userName || '').toLowerCase().includes(searchTerm) ||
          (r.userId || '').toLowerCase().includes(searchTerm)
        );
      }
      
      setRecords(list);
      showToast(`Found ${list.length} records`, "success");
    } catch (err) {
      console.error(err);
      showToast("Error loading records: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!records.length) {
      showToast("No records to export", "error");
      return;
    }

    setExporting(true);
    try {
      const cleanData = records.map(r => ({
        'Date': r.date,
        'Teacher Name': r.userName || r.userId || "Unknown",
        'Department': r.department || "-",
        'In Time': r.inTime?.toDate ? r.inTime.toDate().toLocaleTimeString() : (r.inTime || "-"),
        'Out Time': r.outTime?.toDate ? r.outTime.toDate().toLocaleTimeString() : (r.outTime || "-"),
        'Status': r.status || "Present",
        'Late Reason': r.lateReason || "-",
        'In Distance': r.inLocation?.distance ? `${r.inLocation.distance.toFixed(1)}m` : "-",
        'Out Distance': r.outLocation?.distance ? `${r.outLocation.distance.toFixed(1)}m` : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(cleanData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      
      const fileName = `attendance_${filters.fromDate}_to_${filters.toDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showToast("Excel exported successfully", "success");
    } catch (error) {
      showToast("Error exporting Excel", "error");
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = () => {
    if (!records.length) {
      showToast("No records to export", "error");
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Attendance Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Period: ${filters.fromDate} to ${filters.toDate}`, 14, 22);
      
      // Add filters info
      let filterText = 'Filters: ';
      if (filters.department) filterText += `Dept: ${filters.department} `;
      if (filters.status) filterText += `Status: ${filters.status} `;
      if (filters.teacherName) filterText += `Teacher: ${filters.teacherName}`;
      doc.text(filterText, 14, 29);
      
      const tableData = records.map(r => [
        r.date,
        (r.userName || r.userId || "Unknown").substring(0, 15),
        (r.department || "-").substring(0, 10),
        r.inTime?.toDate ? r.inTime.toDate().toLocaleTimeString() : (r.inTime || ""),
        r.outTime?.toDate ? r.outTime.toDate().toLocaleTimeString() : (r.outTime || ""),
        r.status || "",
        (r.lateReason || "").substring(0, 15),
      ]);

      doc.autoTable({
        head: [["Date", "Teacher", "Dept", "In Time", "Out Time", "Status", "Late Reason"]],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 118, 210] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 15 },
          6: { cellWidth: 25 }
        }
      });

      // Add summary
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Total Records: ${records.length}`, 14, finalY);
      
      const present = records.filter(r => r.status === 'Present').length;
      const late = records.filter(r => r.status === 'Late').length;
      const absent = records.filter(r => r.status === 'Absent').length;
      
      doc.text(`Present: ${present} | Late: ${late} | Absent: ${absent}`, 14, finalY + 7);
      
      const fileName = `attendance_${filters.fromDate}_to_${filters.toDate}.pdf`;
      doc.save(fileName);
      
      showToast("PDF exported successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Error exporting PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  const exportSummary = () => {
    if (!records.length) {
      showToast("No records to export", "error");
      return;
    }
    
    setExporting(true);
    try {
      // Group by department
      const deptSummary = {};
      records.forEach(r => {
        const dept = r.department || 'Unknown';
        if (!deptSummary[dept]) {
          deptSummary[dept] = { total: 0, present: 0, late: 0, absent: 0 };
        }
        deptSummary[dept].total++;
        if (r.status === 'Present') deptSummary[dept].present++;
        else if (r.status === 'Late') deptSummary[dept].late++;
        else if (r.status === 'Absent') deptSummary[dept].absent++;
      });
      
      const summaryData = Object.entries(deptSummary).map(([dept, stats]) => ({
        'Department': dept,
        'Total Teachers': stats.total,
        'Present': stats.present,
        'Late': stats.late,
        'Absent': stats.absent,
        'Attendance %': ((stats.present + stats.late) / stats.total * 100).toFixed(1) + '%'
      }));
      
      // Add overall summary
      const total = records.length;
      const present = records.filter(r => r.status === 'Present').length;
      const late = records.filter(r => r.status === 'Late').length;
      const absent = records.filter(r => r.status === 'Absent').length;
      
      summaryData.push({
        'Department': 'TOTAL',
        'Total Teachers': total,
        'Present': present,
        'Late': late,
        'Absent': absent,
        'Attendance %': ((present + late) / total * 100).toFixed(1) + '%'
      });
      
      const ws = XLSX.utils.json_to_sheet(summaryData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Summary");
      
      const fileName = `attendance_summary_${filters.fromDate}_to_${filters.toDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showToast("Summary exported successfully", "success");
    } catch (error) {
      showToast("Error exporting summary", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← Back
      </button>
      
      <h2 style={styles.title}>Export Attendance Data</h2>

      <div style={styles.filterCard}>
        <h3 style={styles.subtitle}>Filter Records</h3>
        
        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <label>From Date *</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
              style={styles.input}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <label>To Date *</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({...filters, toDate: e.target.value})}
              style={styles.input}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <label>Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              style={styles.input}
            >
              <option value="">All Departments</option>
              <option value="CS">Computer Science</option>
              <option value="IT">Information Technology</option>
              <option value="ME">Mechanical</option>
              <option value="EE">Electrical</option>
              <option value="CE">Civil</option>
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              style={styles.input}
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
          
          <div style={{...styles.filterGroup, gridColumn: 'span 2'}}>
            <label>Teacher Name/ID</label>
            <input
              type="text"
              placeholder="Search by teacher name or ID"
              value={filters.teacherName}
              onChange={(e) => setFilters({...filters, teacherName: e.target.value})}
              style={styles.input}
            />
          </div>
        </div>
        
        <button
          onClick={loadAttendance}
          disabled={loading}
          style={styles.loadButton}
        >
          {loading ? <LoadingSpinner size="small" /> : 'Load Records'}
        </button>
      </div>

      {records.length > 0 && (
        <div style={styles.exportCard}>
          <div style={styles.statsBar}>
            <span>📊 Total Records: <strong>{records.length}</strong></span>
            <span>✅ Present: <strong>{records.filter(r => r.status === 'Present').length}</strong></span>
            <span>⏰ Late: <strong>{records.filter(r => r.status === 'Late').length}</strong></span>
            <span>❌ Absent: <strong>{records.filter(r => r.status === 'Absent').length}</strong></span>
          </div>
          
          <div style={styles.buttonGroup}>
            <button
              onClick={exportExcel}
              disabled={exporting}
              style={{...styles.exportButton, backgroundColor: '#1e6f3f'}}
            >
              {exporting ? <LoadingSpinner size="small" /> : '📊 Export Excel'}
            </button>
            
            <button
              onClick={exportPDF}
              disabled={exporting}
              style={{...styles.exportButton, backgroundColor: '#d32f2f'}}
            >
              {exporting ? <LoadingSpinner size="small" /> : '📄 Export PDF'}
            </button>
            
            <button
              onClick={exportSummary}
              disabled={exporting}
              style={{...styles.exportButton, backgroundColor: '#ed6c02'}}
            >
              {exporting ? <LoadingSpinner size="small" /> : '📈 Export Summary'}
            </button>
          </div>
        </div>
      )}

      {records.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Teacher</th>
                <th>Dept</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Status</th>
                <th>Late Reason</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={styles.tableCell}>{r.date}</td>
                  <td style={styles.tableCell}>{r.userName || r.userId || "Unknown"}</td>
                  <td style={styles.tableCell}>{r.department || "-"}</td>
                  <td style={styles.tableCell}>
                    {r.inTime?.toDate ? r.inTime.toDate().toLocaleTimeString() : (r.inTime || "-")}
                  </td>
                  <td style={styles.tableCell}>
                    {r.outTime?.toDate ? r.outTime.toDate().toLocaleTimeString() : (r.outTime || "-")}
                  </td>
                  <td style={{
                    ...styles.tableCell,
                    color: r.status === 'Present' ? '#2e7d32' : 
                           r.status === 'Late' ? '#ed6c02' : '#d32f2f',
                    fontWeight: 'bold'
                  }}>
                    {r.status || "-"}
                  </td>
                  <td style={styles.tableCell}>{r.lateReason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <div style={styles.emptyState}>
            <p>No records found for selected filters.</p>
            <small>Adjust your filters and try again</small>
          </div>
        )
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 1200,
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
  title: {
    textAlign: "center",
    marginBottom: 30
  },
  subtitle: {
    marginTop: 0,
    marginBottom: 20
  },
  filterCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginBottom: 20
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 15,
    marginBottom: 20
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column"
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    marginTop: 5,
    fontSize: 14
  },
  loadButton: {
    width: "100%",
    padding: 12,
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold"
  },
  exportCard: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20
  },
  statsBar: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8
  },
  buttonGroup: {
    display: "flex",
    gap: 10,
    justifyContent: "center"
  },
  exportButton: {
    padding: "10px 20px",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    minWidth: 140
  },
  tableContainer: {
    overflowX: "auto",
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  tableCell: {
    padding: 12,
    borderBottom: "1px solid #eee",
    textAlign: "center"
  },
  emptyState: {
    textAlign: "center",
    padding: 40,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    color: "#666"
  }
};