const express = require("express");
const router = express.Router();

const {
    getDashboardSummary
} = require("../controllers/dashboardController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

router.get(
    "/summary",
    authenticateToken,
    authorizeRoles("admin"),
    getDashboardSummary
);

module.exports = router;