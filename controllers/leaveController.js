const pool = require("../config/database");

// Apply for leave
exports.applyLeave = async (req, res) => {

    try {

        const employee_id = req.user.employee_id;

        const {
            leave_type_id,
            start_date,
            end_date,
            reason
        } = req.body;


        const start = new Date(start_date);
        const end = new Date(end_date);

        const leave_days =
            Math.ceil(
                (end - start) / (1000 * 60 * 60 * 24)
            ) + 1;


        // Check balance
        const balance = await pool.query(
            `
            SELECT remaining_days
            FROM leave_balances
            WHERE employee_id = $1
            AND leave_type_id = $2
            `,
            [
                employee_id,
                leave_type_id
            ]
        );


        if (balance.rows.length === 0) {

            return res.status(404).json({
                message: "Leave balance not found"
            });

        }


        if (leave_days > balance.rows[0].remaining_days) {

            return res.status(400).json({
                message: "Insufficient leave balance",
                available_days: balance.rows[0].remaining_days,
                requested_days: leave_days
            });

        }


        const result = await pool.query(
            `
            INSERT INTO leave_requests
            (
                employee_id,
                leave_type_id,
                start_date,
                end_date,
                reason,
                status
            )

            VALUES
            ($1,$2,$3,$4,$5,'Pending')

            RETURNING *
            `,
            [
                employee_id,
                leave_type_id,
                start_date,
                end_date,
                reason
            ]
        );


        res.json({

            message: "Leave application submitted successfully",

            leave_days,

            leave: result.rows[0]

        });


    } catch(error){

        console.error(error);

        res.status(500).json({
            error:"Server error"
        });

    }

};

// Get employee leave history
exports.getMyLeaves = async (req, res) => {

    try {

        const employee_id = req.user.employee_id;

        const result = await pool.query(
            `
            SELECT
                lr.request_id,
                lt.leave_name,
                lr.start_date,
                lr.end_date,
                lr.reason,
                lr.status,
                lr.created_at

            FROM leave_requests lr

            JOIN leave_types lt
            ON lr.leave_type_id = lt.leave_type_id

            WHERE lr.employee_id = $1

            ORDER BY lr.created_at DESC
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



// Get pending leave requests
exports.getPendingLeaves = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                lr.request_id,
                e.full_name AS employee_name,
                e.employee_number,
                lt.leave_name,
                lr.start_date,
                lr.end_date,
                lr.reason,
                lr.status,
                lr.created_at

            FROM leave_requests lr

            JOIN employees e
            ON lr.employee_id = e.employee_id

            JOIN leave_types lt
            ON lr.leave_type_id = lt.leave_type_id

            WHERE lr.status = 'Pending'

            ORDER BY lr.created_at DESC
            `
        );


        res.json(result.rows);


    } catch(error){

        console.error(error);

        res.status(500).json({
            error:"Server error"
        });

    }

};



// Approve leave
exports.approveLeave = async (req,res)=>{

    try{

        const {id}=req.params;


        const result = await pool.query(
            `
            UPDATE leave_requests
            SET status='Approved'
            WHERE request_id=$1
            RETURNING *
            `,
            [id]
        );


        res.json({
            message:"Leave approved successfully",
            leave:result.rows[0]
        });


    }catch(error){

        console.error(error);

        res.status(500).json({
            error:"Server error"
        });

    }

};



// Reject leave
exports.rejectLeave = async (req,res)=>{

    try{

        const {id}=req.params;


        const result = await pool.query(
            `
            UPDATE leave_requests
            SET status='Rejected'
            WHERE request_id=$1
            RETURNING *
            `,
            [id]
        );


        res.json({
            message:"Leave rejected successfully",
            leave:result.rows[0]
        });


    }catch(error){

        console.error(error);

        res.status(500).json({
            error:"Server error"
        });

    }

};
// Get employee leave balance
exports.getLeaveBalance = async (req, res) => {

    try {

        const employee_id = req.user.employee_id;


        const result = await pool.query(
            `
            SELECT
                lt.leave_name,
                lb.total_days,
                lb.used_days,
                lb.remaining_days

            FROM leave_balances lb

            JOIN leave_types lt
            ON lb.leave_type_id = lt.leave_type_id

            WHERE lb.employee_id = $1
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