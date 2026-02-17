import { db } from "../services/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

// Default admin credentials
const DEFAULT_ADMIN = {
  email: "admin@geoattendance.com",
  password: "Admin@123",
  name: "System Administrator",
  adminId: "ADMIN001",
  designation: "Chief Administrator",
  department: "Administration",
  phone: "+1234567890",
  role: "admin",
  isActive: true
};

// Default teacher credentials
const DEFAULT_TEACHER = {
  email: "teacher@geoattendance.com",
  password: "Teacher@123",
  name: "John Teacher",
  employeeId: "TCH001",
  department: "Computer Science",
  designation: "Senior Lecturer",
  phone: "+1234567891",
  role: "teacher",
  isActive: true,
  joiningDate: new Date().toISOString().split('T')[0]
};

// Default college settings
const DEFAULT_COLLEGE_SETTINGS = {
  latitude: 0, // Will be updated when admin sets it
  longitude: 0,
  radius: 150,
  updatedAt: new Date()
};

// Default timetable
const DEFAULT_TIMETABLE = {
  monday: { startTime: "09:00", lateAfter: "09:15", endTime: "17:00" },
  tuesday: { startTime: "09:00", lateAfter: "09:15", endTime: "17:00" },
  wednesday: { startTime: "09:00", lateAfter: "09:15", endTime: "17:00" },
  thursday: { startTime: "09:00", lateAfter: "09:15", endTime: "17:00" },
  friday: { startTime: "09:00", lateAfter: "09:15", endTime: "17:00" },
  saturday: { startTime: "09:00", lateAfter: "09:15", endTime: "13:00" }
};

// Default holidays
const DEFAULT_HOLIDAYS = [
  {
    name: "New Year's Day",
    date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    type: "holiday",
    description: "New Year Holiday"
  },
  {
    name: "Independence Day",
    date: new Date(new Date().getFullYear(), 7, 15).toISOString().split('T')[0],
    type: "holiday",
    description: "Independence Day"
  },
  {
    name: "Christmas",
    date: new Date(new Date().getFullYear(), 11, 25).toISOString().split('T')[0],
    type: "holiday",
    description: "Christmas Day"
  }
];

export const initializeDatabase = async () => {
  console.log("🚀 Starting database initialization...");

  try {
    // Check if any users exist
    const usersQuery = query(collection(db, "users"), where("role", "==", "admin"));
    const existingAdmins = await getDocs(usersQuery);

    if (!existingAdmins.empty) {
      console.log("✅ Database already initialized");
      return { success: true, message: "Database already initialized" };
    }

    console.log("📝 Creating default admin user...");
    
    // Create admin in Firebase Auth
    const adminCredential = await createUserWithEmailAndPassword(
      auth,
      DEFAULT_ADMIN.email,
      DEFAULT_ADMIN.password
    );

    // Create admin document in Firestore
    await setDoc(doc(db, "users", adminCredential.user.uid), {
      ...DEFAULT_ADMIN,
      uid: adminCredential.user.uid,
      createdAt: new Date()
    });

    console.log("✅ Admin created successfully");

    console.log("📝 Creating default teacher user...");
    
    // Create teacher in Firebase Auth
    const teacherCredential = await createUserWithEmailAndPassword(
      auth,
      DEFAULT_TEACHER.email,
      DEFAULT_TEACHER.password
    );

    // Create teacher document in Firestore
    await setDoc(doc(db, "users", teacherCredential.user.uid), {
      ...DEFAULT_TEACHER,
      uid: teacherCredential.user.uid,
      createdAt: new Date()
    });

    console.log("✅ Teacher created successfully");

    // Create college settings
    console.log("📝 Creating college settings...");
    await setDoc(doc(db, "collegeSettings", "main"), DEFAULT_COLLEGE_SETTINGS);
    console.log("✅ College settings created");

    // Create timetable
    console.log("📝 Creating timetable...");
    for (const [day, times] of Object.entries(DEFAULT_TIMETABLE)) {
      await setDoc(doc(db, "timetable", day), times);
    }
    console.log("✅ Timetable created");

    // Create holidays
    console.log("📝 Creating holidays...");
    for (const holiday of DEFAULT_HOLIDAYS) {
      await setDoc(doc(db, "holidays", `holiday_${Date.now()}_${Math.random()}`), {
        ...holiday,
        createdAt: new Date()
      });
    }
    console.log("✅ Holidays created");

    console.log("\n🎉 Database initialization complete!");
    console.log("\n📝 Default Credentials:");
    console.log("----------------------");
    console.log("ADMIN:");
    console.log(`  Email: ${DEFAULT_ADMIN.email}`);
    console.log(`  Password: ${DEFAULT_ADMIN.password}`);
    console.log("\nTEACHER:");
    console.log(`  Email: ${DEFAULT_TEACHER.email}`);
    console.log(`  Password: ${DEFAULT_TEACHER.password}`);
    console.log("\n⚠️ IMPORTANT: Change these passwords after first login!");

    return {
      success: true,
      message: "Database initialized successfully",
      admin: DEFAULT_ADMIN,
      teacher: DEFAULT_TEACHER
    };

  } catch (error) {
    console.error("❌ Error initializing database:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default initializeDatabase;