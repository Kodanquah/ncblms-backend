const pool = require("./config/database");
const bcrypt = require("bcrypt");

async function resetPassword() {

    const newPassword = "123456";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
        `
        UPDATE employees
        SET password_hash = $1
        WHERE employee_number = $2
        RETURNING employee_number, full_name, role
        `,
        [
            hashedPassword,
            "NCB001"
        ]
    );

    console.log("Password updated:");
    console.log(result.rows[0]);

    process.exit();
}

resetPassword();