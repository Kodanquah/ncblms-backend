const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {

    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }


    const token = authHeader.split(" ")[1];


    if (!token) {
        return res.status(401).json({
            message: "Invalid token format."
        });
    }


    try {

        console.log("Received Token:", token);
        console.log("JWT SECRET:", process.env.JWT_SECRET);


        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        console.log("Decoded User:", decoded);


        req.user = decoded;

      console.log("Logged User:", req.user);

        next();


    } catch (error) {


        console.log("JWT Error:", error.message);


        return res.status(401).json({
            message: "Invalid or expired token."
        });

    }

};