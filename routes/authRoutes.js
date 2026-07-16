const express = require("express");
const router = express.Router();

const {
    login,
    changePassword
} = require("../controllers/authController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

// ===============================
// Employee Login
// ===============================
router.post(
    "/login",
    login
);

// ===============================
// Change Password
// ===============================


module.exports = router;