const express = require("express");
const router = express.Router();

const {
    applyLeave,
    getMyLeaves,
    getPendingLeaves,
    approveLeave,
    rejectLeave,
    getLeaveBalance
} = require("../controllers/leaveController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");


// Employee/Admin can apply for leave
router.post(
    "/apply",
    authenticateToken,
    applyLeave
);


// Logged-in employee can view own leave history
router.get(
    "/my-leaves",
    authenticateToken,
    getMyLeaves
);


// Logged-in employee can view leave balance
router.get(
    "/balance",
    authenticateToken,
    getLeaveBalance
);


// Admin only - view pending requests
router.get(
    "/pending",
    authenticateToken,
    authorizeRoles("admin"),
    getPendingLeaves
);


// Admin only - approve leave
router.put(
    "/approve/:id",
    authenticateToken,
    authorizeRoles("admin"),
    approveLeave
);


// Admin only - reject leave
router.put(
    "/reject/:id",
    authenticateToken,
    authorizeRoles("admin"),
    rejectLeave
);

module.exports = router;