const express = require("express");
const router = express.Router();

const {
    getEmployees,
    createEmployee
} = require("../controllers/employeeController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");


// Admin can view employees
router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    getEmployees
);


// Admin can create employees
router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    createEmployee
);


module.exports = router;