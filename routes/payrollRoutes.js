const express = require("express");
const router = express.Router();

const {
    generatePayroll,
    generatePayrollForAll,
    getMyPayslips,
    getAllPayroll,
    getPayrollDashboard,
    exportPayrollExcel
} = require("../controllers/payrollController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

// Generate Payroll for All Employees
router.post(
    "/generate-all",
    authenticateToken,
    authorizeRoles("admin"),
    generatePayrollForAll
);

// Employee Payslips
router.get(
    "/my-payslips",
    authenticateToken,
    getMyPayslips
);

// Admin View All Payroll
router.get(
    "/all",
    authenticateToken,
    authorizeRoles("admin"),
    getAllPayroll
);

// Payroll Dashboard
router.get(
    "/dashboard",
    authenticateToken,
    authorizeRoles("admin"),
    getPayrollDashboard
);

// Export Payroll
router.get(
    "/export",
    authenticateToken,
    authorizeRoles("admin"),
    exportPayrollExcel
);

module.exports = router;