const pool = require("../config/database");


// Dashboard summary
exports.getDashboardSummary = async (req, res) => {

    try {

        const employees = await pool.query(
            `
            SELECT COUNT(*) 
            FROM employees
            `
        );


        const pending = await pool.query(
            `
            SELECT COUNT(*)
            FROM leave_requests
            WHERE status = 'Pending'
            `
        );


        const approved = await pool.query(
            `
            SELECT COUNT(*)
            FROM leave_requests
            WHERE status = 'Approved'
            `
        );


        const rejected = await pool.query(
            `
            SELECT COUNT(*)
            FROM leave_requests
            WHERE status = 'Rejected'
            `
        );


        res.json({

            total_employees:
            Number(employees.rows[0].count),


            pending_leaves:
            Number(pending.rows[0].count),


            approved_leaves:
            Number(approved.rows[0].count),


            rejected_leaves:
            Number(rejected.rows[0].count)

        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            error: "Server error"

        });

    }

};