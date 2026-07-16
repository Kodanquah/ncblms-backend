const pool = require("../config/database");
const ExcelJS = require("exceljs");

// ======================================================
// EMPLOYEE CHECK IN
// ======================================================
exports.checkIn = async (req, res) => {

    try {

        const employee_id = req.user.employee_id;

        // Check whether employee already checked in
        const existing = await pool.query(
            `
            SELECT *
            FROM attendance
            WHERE employee_id = $1
            AND attendance_date = CURRENT_DATE
            `,
            [employee_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                message: "You have already checked in today"
            });
        }

        // Get official work schedule
        const schedule = await pool.query(
            `
            SELECT start_time
            FROM work_schedule
            LIMIT 1
            `
        );

        const officialStart = schedule.rows[0].start_time;

        const now = new Date();
        const checkInTime = now.toTimeString().substring(0, 8);

        // Calculate late minutes
        let late_minutes = 0;

        const [sh, sm] = officialStart.split(":");
        const [ch, cm] = checkInTime.split(":");

        const officialMinutes =
            Number(sh) * 60 + Number(sm);

        const actualMinutes =
            Number(ch) * 60 + Number(cm);

        if (actualMinutes > officialMinutes) {
            late_minutes =
                actualMinutes - officialMinutes;
        }

        let status = "Present";

if (late_minutes > 0 && late_minutes <= 30) {
    status = "Late";
}

if (late_minutes > 30) {
    status = "Very Late";
}

const result = await pool.query(
    `
    INSERT INTO attendance
    (
        employee_id,
        attendance_date,
        check_in,
        status,
        late_minutes
    )

    VALUES
    (
        $1,
        CURRENT_DATE,
        CURRENT_TIME,
        $2,
        $3
    )

    RETURNING *
    `,
    [
        employee_id,
        status,
        late_minutes
    ]
);

        res.json({
            message: "Check-in successful",
            attendance: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};
// ======================================================
// EMPLOYEE CHECK OUT
// ======================================================
exports.checkOut = async (req, res) => {

    try {

        const employee_id = req.user.employee_id;

        // Find today's attendance
        const attendance = await pool.query(
            `
            SELECT *
            FROM attendance
            WHERE employee_id = $1
            AND attendance_date = CURRENT_DATE
            `,
            [employee_id]
        );

        if (attendance.rows.length === 0) {
            return res.status(404).json({
                message: "No check-in record found for today"
            });
        }

        if (attendance.rows[0].check_out) {
            return res.status(400).json({
                message: "You have already checked out today"
            });
        }

        // Get work schedule
        const schedule = await pool.query(
            `
            SELECT end_time
            FROM work_schedule
            LIMIT 1
            `
        );

        const officialEnd = schedule.rows[0].end_time;

        // Current checkout time
        const currentTime = new Date();
        const checkOutTime = currentTime.toTimeString().substring(0, 8);

        // Current check-in time from database
        const checkInTime = attendance.rows[0].check_in;

        // Convert to Date objects
        const checkInDate = new Date(`1970-01-01T${checkInTime}`);
        const checkOutDate = new Date(`1970-01-01T${checkOutTime}`);

        // Calculate working hours
        const working_hours =
            Number(
                ((checkOutDate - checkInDate) / (1000 * 60 * 60)).toFixed(2)
            );

        // Calculate early departure & overtime
        let early_departure_minutes = 0;
        let overtime_minutes = 0;

        const [eh, em] = officialEnd.split(":");
        const [oh, om] = checkOutTime.split(":");

        const officialMinutes =
            Number(eh) * 60 + Number(em);

        const actualMinutes =
            Number(oh) * 60 + Number(om);

        if (actualMinutes < officialMinutes) {
            early_departure_minutes =
                officialMinutes - actualMinutes;
        }

        if (actualMinutes > officialMinutes) {
            overtime_minutes =
                actualMinutes - officialMinutes;
        }

        // Update attendance
        const result = await pool.query(
            `
            UPDATE attendance
            SET
                check_out = CURRENT_TIME,
                early_departure_minutes = $2,
                overtime_minutes = $3,
                working_hours = $4

            WHERE employee_id = $1
            AND attendance_date = CURRENT_DATE

            RETURNING *
            `,
            [
                employee_id,
                early_departure_minutes,
                overtime_minutes,
                working_hours
            ]
        );

        res.json({
            message: "Check-out successful",
            attendance: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};
// ======================================================
// EMPLOYEE ATTENDANCE HISTORY
// ======================================================
exports.getMyAttendance = async (req, res) => {

    try {

        const employee_id = req.user.employee_id;

        const result = await pool.query(
            `
            SELECT
                attendance_id,
                attendance_date,
                check_in,
                check_out,
                late_minutes,
                early_departure_minutes,
                overtime_minutes,
                working_hours,
                status

            FROM attendance

            WHERE employee_id = $1

            ORDER BY attendance_date DESC
            `,
            [employee_id]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};
// ======================================================
// ADMIN VIEW ALL ATTENDANCE
// ======================================================
exports.getAllAttendance = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                a.attendance_id,
                e.employee_number,
                e.full_name AS employee_name,
                a.attendance_date,
                a.check_in,
                a.check_out,
                a.late_minutes,
                a.early_departure_minutes,
                a.overtime_minutes,
                a.working_hours,
                a.status

            FROM attendance a

            JOIN employees e
            ON a.employee_id = e.employee_id

            ORDER BY
                a.attendance_date DESC,
                e.employee_number
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};
// ======================================================
// ATTENDANCE DASHBOARD
// ======================================================
exports.getAttendanceDashboard = async (req, res) => {

    try {

        const totalEmployees = await pool.query(
            `SELECT COUNT(*) FROM employees`
        );

        const presentToday = await pool.query(
            `
            SELECT COUNT(*)
            FROM attendance
            WHERE attendance_date = CURRENT_DATE
            `
        );

        const absentToday = await pool.query(
            `
            SELECT COUNT(*)
            FROM employees e
            WHERE NOT EXISTS
            (
                SELECT 1
                FROM attendance a
                WHERE a.employee_id = e.employee_id
                AND a.attendance_date = CURRENT_DATE
            )
            `
        );

        const onLeaveToday = await pool.query(
            `
            SELECT COUNT(*)
            FROM leave_requests
            WHERE status='Approved'
            AND CURRENT_DATE BETWEEN start_date AND end_date
            `
        );

        const pendingLeaves = await pool.query(
            `
            SELECT COUNT(*)
            FROM leave_requests
            WHERE status='Pending'
            `
        );

        res.json({

            total_employees:
                Number(totalEmployees.rows[0].count),

            present_today:
                Number(presentToday.rows[0].count),

            absent_today:
                Number(absentToday.rows[0].count),

            on_leave_today:
                Number(onLeaveToday.rows[0].count),

            pending_leave_requests:
                Number(pendingLeaves.rows[0].count)

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};
// ======================================================
// MONTHLY ATTENDANCE REPORT
// ======================================================
exports.getMonthlyAttendanceReport = async (req, res) => {

    try {

        const { month, year } = req.query;

        const result = await pool.query(
            `
            SELECT
                e.employee_id,
                e.employee_number,
                e.full_name AS employee_name,

                COUNT(a.attendance_id) AS present_days,

                COUNT(
                    CASE
                        WHEN a.check_out IS NOT NULL
                        THEN 1
                    END
                ) AS completed_days

            FROM employees e

            LEFT JOIN attendance a
            ON e.employee_id = a.employee_id

            AND EXTRACT(MONTH FROM a.attendance_date) = $1
            AND EXTRACT(YEAR FROM a.attendance_date) = $2

            GROUP BY
                e.employee_id,
                e.employee_number,
                e.full_name

            ORDER BY e.employee_number
            `,
            [month, year]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};
// ======================================================
// EXPORT ATTENDANCE EXCEL
// ======================================================
exports.exportAttendanceExcel = async (req, res) => {

    try {

        const { month, year } = req.query;

        const result = await pool.query(
            `
            SELECT
                e.employee_number,
                e.full_name AS employee_name,
                a.attendance_date,
                a.check_in,
                a.check_out,
                a.late_minutes,
                a.early_departure_minutes,
                a.overtime_minutes,
                a.working_hours,
                a.status

            FROM attendance a

            JOIN employees e
            ON e.employee_id = a.employee_id

            WHERE EXTRACT(MONTH FROM a.attendance_date) = $1
            AND EXTRACT(YEAR FROM a.attendance_date) = $2

            ORDER BY a.attendance_date DESC
            `,
            [month, year]
        );

        const workbook = new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet("Attendance");

        worksheet.columns = [

            {
                header: "Employee Number",
                key: "employee_number",
                width: 20
            },

            {
                header: "Employee Name",
                key: "employee_name",
                width: 30
            },

            {
                header: "Date",
                key: "attendance_date",
                width: 18
            },

            {
                header: "Check In",
                key: "check_in",
                width: 15
            },

            {
                header: "Check Out",
                key: "check_out",
                width: 15
            },

            {
                header: "Late (mins)",
                key: "late_minutes",
                width: 15
            },

            {
                header: "Early Departure",
                key: "early_departure_minutes",
                width: 20
            },

            {
                header: "Overtime",
                key: "overtime_minutes",
                width: 15
            },

            {
                header: "Working Hours",
                key: "working_hours",
                width: 18
            },

            {
                header: "Status",
                key: "status",
                width: 15
            }

        ];

        result.rows.forEach(row => worksheet.addRow(row));

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Attendance_${month}_${year}.xlsx`
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};