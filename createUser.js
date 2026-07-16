const pool = require("./config/database");
const bcrypt = require("bcrypt");

async function createUser() {

    const password = "123456";

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        `INSERT INTO employees
        (
        employee_number,
        full_name,
        email,
        phone,
        position,
        department_id,
        password_hash,
        role
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [
            "NCB001",
            "System Administrator",
            "admin@ncblms.com",
            "0200000000",
            "IT Administrator",
            1,
            hashedPassword,
            "admin"
        ]
    );

    console.log("User created successfully:");
    console.log(result.rows[0]);

    process.exit();
}

createUser();