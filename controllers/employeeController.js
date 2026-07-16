const pool = require("../config/database");
const bcrypt = require("bcrypt");


// Get all employees
exports.getEmployees = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                employee_id,
                employee_number,
                full_name,
                email,
                phone,
                position,
                role,
                annual_leave_balance
            FROM employees
            ORDER BY employee_id
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





// Create employee
exports.createEmployee = async (req, res) => {

    const client = await pool.connect();


    try {

        const {
            employee_number,
            full_name,
            email,
            phone,
            position,
            department_id,
            password,
            role
        } = req.body;



        await client.query("BEGIN");



        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);



        // Insert employee
        const employee = await client.query(
            `
            INSERT INTO employees
            (
                employee_number,
                full_name,
                email,
                phone,
                position,
                department_id,
                password_hash,
                role,
                annual_leave_balance
            )

            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9)

            RETURNING *
            `,
            [
                employee_number,
                full_name,
                email,
                phone,
                position,
                department_id,
                hashedPassword,
                role || "employee",
                21
            ]
        );



        await client.query("COMMIT");



        res.json({

            message: "Employee created successfully",

            employee: employee.rows[0]

        });



    } catch (error) {


        await client.query("ROLLBACK");


        console.error(error);


        res.status(500).json({

            error: error.message

        });



    } finally {

        client.release();

    }

};