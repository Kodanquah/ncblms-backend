const express = require("express");
const router = express.Router();

const {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee
} = require("../controllers/employeeController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

// Get all employees
router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    getEmployees
);

// Get one employee
router.get(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    getEmployeeById
);

// Create employee
router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    createEmployee
);

// Update employee
router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    updateEmployee
);

module.exports = router;