const pool = require("../config/database");
const ExcelJS = require("exceljs");

exports.generatePayroll = async (req, res) => {

    try {

        const { employee_id, month, year } = req.body;

        // Check salary structure
        const salary = await pool.query(
            `
            SELECT *
            FROM salary_structure
            WHERE employee_id = $1
            `,
            [employee_id]
        );

        if (salary.rows.length === 0) {
            return res.status(404).json({
                message: "Salary structure not found."
            });
        }

        const s = salary.rows[0];

        // Attendance summary
        const attendance = await pool.query(
            `
            SELECT
                COALESCE(SUM(overtime_minutes),0) AS overtime_minutes,
                COALESCE(SUM(late_minutes),0) AS late_minutes
            FROM attendance
            WHERE employee_id = $1
            AND EXTRACT(MONTH FROM attendance_date) = $2
            AND EXTRACT(YEAR FROM attendance_date) = $3
            `,
            [employee_id, month, year]
        );

        const overtimeMinutes =
            Number(attendance.rows[0].overtime_minutes);

        const lateMinutes =
            Number(attendance.rows[0].late_minutes);

        // Salary calculations
        const allowances =
            Number(s.housing_allowance) +
            Number(s.transport_allowance) +
            Number(s.medical_allowance) +
            Number(s.utility_allowance) +
            Number(s.other_allowance);

        const overtimePay =
            (overtimeMinutes / 60) *
            Number(s.overtime_rate);

        const lateDeduction =
            lateMinutes *
            Number(s.late_deduction_rate);

        const grossSalary =
            Number(s.basic_salary) +
            allowances +
            overtimePay;

        const ssnit =
            grossSalary *
            (Number(s.ssnit_percentage) / 100);

        const paye =
            grossSalary *
            (Number(s.paye_percentage) / 100);

        const netSalary =
            grossSalary -
            ssnit -
            paye -
            lateDeduction;

        // Save payroll
        const payroll = await pool.query(
            `
            INSERT INTO payroll
            (
                employee_id,
                payroll_month,
                payroll_year,
                basic_salary,
                allowances,
                overtime_pay,
                late_deduction,
                gross_salary,
                ssnit,
                paye,
                net_salary
            )

            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
            )

            RETURNING *
            `,
            [
                employee_id,
                month,
                year,
                s.basic_salary,
                allowances,
                overtimePay,
                lateDeduction,
                grossSalary,
                ssnit,
                paye,
                netSalary
            ]
        );

        res.json({
            message: "Payroll generated successfully.",
            payroll: payroll.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};exports.getMyPayslips = async (req, res) => {

    try {

        const employee_id = req.user.employee_id;

        const result = await pool.query(
            `
            SELECT
                payroll_id,
                payroll_month,
                payroll_year,
                basic_salary,
                allowances,
                overtime_pay,
                late_deduction,
                gross_salary,
                ssnit,
                paye,
                net_salary,
                status,
                generated_at

            FROM payroll

            WHERE employee_id = $1

            ORDER BY
                payroll_year DESC,
                payroll_month DESC
            `,
            [employee_id]
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getAllPayroll = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                p.payroll_id,
                e.employee_number,
                e.full_name,
                p.payroll_month,
                p.payroll_year,
                p.basic_salary,
                p.allowances,
                p.overtime_pay,
                p.late_deduction,
                p.gross_salary,
                p.ssnit,
                p.paye,
                p.net_salary,
                p.status,
                p.generated_at

            FROM payroll p

            JOIN employees e
            ON p.employee_id = e.employee_id

            ORDER BY
                p.payroll_year DESC,
                p.payroll_month DESC,
                e.full_name
            `
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getPayrollDashboard = async (req, res) => {

    try {

        const totalPayroll = await pool.query(`
            SELECT COUNT(*) FROM payroll
        `);

        const totalGross = await pool.query(`
            SELECT COALESCE(SUM(gross_salary),0) AS total
            FROM payroll
        `);

        const totalNet = await pool.query(`
            SELECT COALESCE(SUM(net_salary),0) AS total
            FROM payroll
        `);

        const totalSSNIT = await pool.query(`
            SELECT COALESCE(SUM(ssnit),0) AS total
            FROM payroll
        `);

        const totalPAYE = await pool.query(`
            SELECT COALESCE(SUM(paye),0) AS total
            FROM payroll
        `);

        res.json({

            total_payrolls:
                Number(totalPayroll.rows[0].count),

            total_gross_salary:
                Number(totalGross.rows[0].total),

            total_net_salary:
                Number(totalNet.rows[0].total),

            total_ssnit:
                Number(totalSSNIT.rows[0].total),

            total_paye:
                Number(totalPAYE.rows[0].total)

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.exportPayrollExcel = async (req, res) => {

    try {

        const ExcelJS = require("exceljs");

        const result = await pool.query(
            `
            SELECT
                e.employee_number,
                e.full_name,
                p.payroll_month,
                p.payroll_year,
                p.basic_salary,
                p.allowances,
                p.overtime_pay,
                p.late_deduction,
                p.gross_salary,
                p.ssnit,
                p.paye,
                p.net_salary,
                p.status

            FROM payroll p

            JOIN employees e
            ON p.employee_id = e.employee_id

            ORDER BY
                p.payroll_year DESC,
                p.payroll_month DESC
            `
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Payroll Report");

        worksheet.columns = [
            { header: "Employee No", key: "employee_number", width: 18 },
            { header: "Employee Name", key: "full_name", width: 30 },
            { header: "Month", key: "payroll_month", width: 10 },
            { header: "Year", key: "payroll_year", width: 10 },
            { header: "Basic Salary", key: "basic_salary", width: 15 },
            { header: "Allowances", key: "allowances", width: 15 },
            { header: "Overtime", key: "overtime_pay", width: 15 },
            { header: "Late Deduction", key: "late_deduction", width: 18 },
            { header: "Gross Salary", key: "gross_salary", width: 15 },
            { header: "SSNIT", key: "ssnit", width: 12 },
            { header: "PAYE", key: "paye", width: 12 },
            { header: "Net Salary", key: "net_salary", width: 15 },
            { header: "Status", key: "status", width: 15 }
        ];

        result.rows.forEach(row => {
            worksheet.addRow(row);
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Payroll_Report.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};
exports.generatePayrollForAll = async (req, res) => {

    try {

        const { month, year } = req.body;

        const employees = await pool.query(`
            SELECT *
            FROM salary_structure
        `);

        let processed = 0;

        for (const s of employees.rows) {

            // Prevent duplicate payroll
            const existing = await pool.query(
                `
                SELECT payroll_id
                FROM payroll
                WHERE employee_id = $1
                AND payroll_month = $2
                AND payroll_year = $3
                `,
                [
                    s.employee_id,
                    month,
                    year
                ]
            );

            if (existing.rows.length > 0) {
                continue;
            }

            // Attendance
            const attendance = await pool.query(
                `
                SELECT
                    COALESCE(SUM(overtime_minutes),0) AS overtime_minutes,
                    COALESCE(SUM(late_minutes),0) AS late_minutes
                FROM attendance
                WHERE employee_id = $1
                AND EXTRACT(MONTH FROM attendance_date) = $2
                AND EXTRACT(YEAR FROM attendance_date) = $3
                `,
                [
                    s.employee_id,
                    month,
                    year
                ]
            );

            const overtimeMinutes =
                Number(attendance.rows[0].overtime_minutes);

            const lateMinutes =
                Number(attendance.rows[0].late_minutes);

            const allowances =
                Number(s.housing_allowance) +
                Number(s.transport_allowance) +
                Number(s.medical_allowance) +
                Number(s.utility_allowance) +
                Number(s.other_allowance);

            const overtimePay =
                (overtimeMinutes / 60) *
                Number(s.overtime_rate);

            const lateDeduction =
                lateMinutes *
                Number(s.late_deduction_rate);

            const grossSalary =
                Number(s.basic_salary) +
                allowances +
                overtimePay;

            const ssnit =
                grossSalary *
                (Number(s.ssnit_percentage) / 100);

            const paye =
                grossSalary *
                (Number(s.paye_percentage) / 100);

            const netSalary =
                grossSalary -
                ssnit -
                paye -
                lateDeduction;

            await pool.query(
                `
                INSERT INTO payroll
                (
                    employee_id,
                    payroll_month,
                    payroll_year,
                    basic_salary,
                    allowances,
                    overtime_pay,
                    late_deduction,
                    gross_salary,
                    ssnit,
                    paye,
                    net_salary
                )

                VALUES
                (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
                )
                `,
                [
                    s.employee_id,
                    month,
                    year,
                    s.basic_salary,
                    allowances,
                    overtimePay,
                    lateDeduction,
                    grossSalary,
                    ssnit,
                    paye,
                    netSalary
                ]
            );

            processed++;

        }

        res.json({

            message: "Payroll generated successfully.",

            employees_processed: processed,

            payroll_month: month,

            payroll_year: year

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};