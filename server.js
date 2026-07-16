require("dotenv").config();
require("./config/database");

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");


const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);



console.log("✅ Routes loaded");

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "NCBLMS Backend API is running"
    });
});

app.listen(PORT, () => {
    console.log(`🚀 NCBLMS Server running on port ${PORT}`);
});