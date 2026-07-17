const pool = require("../config/database");
const bcrypt = require("bcrypt");

// ==========================================
// Get All Employees
// ==========================================
exports.getEmployees = async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT
                employee_id,
                employee_number,
                full_name,
                email,
                phone,
                position,
                department_id,
                role,
                annual_leave_balance
            FROM employees
            ORDER BY employee_id
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }
};

// ==========================================
// Get One Employee
// ==========================================
exports.getEmployeeById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                employee_id,
                employee_number,
                full_name,
                email,
                phone,
                position,
                department_id,
                role,
                annual_leave_balance
            FROM employees
            WHERE employee_id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};

// ==========================================
// Create Employee
// ==========================================
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

        const hashedPassword = await bcrypt.hash(password, 10);

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

        res.status(201).json({
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

// ==========================================
// Update Employee
// ==========================================
exports.updateEmployee = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            employee_number,
            full_name,
            email,
            phone,
            position,
            department_id,
            role
        } = req.body;

        const result = await pool.query(
            `
            UPDATE employees
            SET
                employee_number = $1,
                full_name = $2,
                email = $3,
                phone = $4,
                position = $5,
                department_id = $6,
                role = $7
            WHERE employee_id = $8
            RETURNING *
            `,
            [
                employee_number,
                full_name,
                email,
                phone,
                position,
                department_id,
                role,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        res.json({
            message: "Employee updated successfully.",
            employee: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server error"
        });

    }

};