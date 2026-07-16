const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// Employee Login
exports.login = async (req, res) => {

    try {

        const {
            employee_number,
            password
        } = req.body;


        const result = await pool.query(
            `
            SELECT *
            FROM employees
            WHERE employee_number = $1
            `,
            [employee_number]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Employee not found"
            });

        }


        const employee = result.rows[0];


        // Verify password
        const validPassword = await bcrypt.compare(
            password,
            employee.password_hash
        );


        if (!validPassword) {

            return res.status(401).json({
                message: "Invalid password"
            });

        }


        // Generate JWT
        const token = jwt.sign(
            {
                employee_id: employee.employee_id,
                employee_number: employee.employee_number,
                role: employee.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );


        res.json({

            message: "Login successful",

            token,

            employee: {

                employee_id: employee.employee_id,

                employee_number: employee.employee_number,

                full_name: employee.full_name,

                email: employee.email,

                phone: employee.phone,

                position: employee.position,

                department_id: employee.department_id,

                role: employee.role,

                annual_leave_balance: employee.annual_leave_balance

            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};