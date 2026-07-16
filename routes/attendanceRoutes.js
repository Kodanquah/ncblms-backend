

const express = require("express");
const router = express.Router();

const {
    checkIn,
    checkOut,
    getMyAttendance,
    getAllAttendance,
    getAttendanceDashboard,
    getMonthlyAttendanceReport,
    exportAttendanceExcel
} = require("../controllers/attendanceController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

// Test Route
router.get("/", (req, res) => {
    res.json({
        message: "Attendance route working"
    });
});

// Employee Check In
router.post(
    "/check-in",
    authenticateToken,
    checkIn
);

// Employee Check Out
router.put(
    "/check-out",
    authenticateToken,
    checkOut
);

// Employee Attendance History
router.get(
    "/my-attendance",
    authenticateToken,
    getMyAttendance
);

// Admin - View All Attendance
router.get(
    "/all",
    authenticateToken,
    authorizeRoles("admin"),
    getAllAttendance
);

// Admin Dashboard
router.get(
    "/dashboard",
    authenticateToken,
    authorizeRoles("admin"),
    getAttendanceDashboard
);

// Monthly Report
router.get(
    "/monthly-report",
    authenticateToken,
    authorizeRoles("admin"),
    getMonthlyAttendanceReport
);

// Export Excel
router.get(
    "/export",
    authenticateToken,
    authorizeRoles("admin"),
    exportAttendanceExcel
);

module.exports = router;



