const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();


app.use(express.json());

const port = process.env.PORT || 5000;

// database config info
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false },
};

const cors = require("cors");
const allowedOrigins = [
    "http://localhost:3000",
    "card-app-starter-seven.vercel.app",
    "https://c346-onlinecardappwebservices-1.onrender.com"
];
app.use(
    cors({
        origin: function (origin, callback) {
// allow requests with no origin (Postman/server-to-server)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    })
);

// Root route
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "MTG Cards API is running",
        routes: {
            allcards: "GET /allcards",
            addcard: "POST /addcard",
        },
    });
});

// Get all cards
app.get("/allcards", async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT * FROM cards");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error for allcards" });
    } finally {
        if (connection) await connection.end();
    }
});

// Add a new card
app.post("/addcard", async (req, res) => {
    const { card_name, card_pic } = req.body;

    if (!card_name || !card_pic) {
        return res.status(400).json({ message: "Missing card_name or card_pic" });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            "INSERT INTO cards (card_name, card_pic) VALUES (?, ?)",
            [card_name, card_pic]
        );
        res.status(201).json({ message: `Card ${card_name} added successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error - could not add card" });
    } finally {
        if (connection) await connection.end();
    }
});

// Update a card
app.put("/updatecard/:id", async (req, res) => {
    const { id } = req.params;
    const { card_name, card_pic } = req.body;

    if (!card_name || !card_pic) {
        return res.status(400).json({ message: "Missing card_name or card_pic" });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            "UPDATE cards SET card_name = ?, card_pic = ? WHERE id = ?",
            [card_name, card_pic, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Card not found" });
        }

        res.json({ message: "Card updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error - could not update card" });
    } finally {
        if (connection) await connection.end();
    }
});

// Delete a card
app.delete("/deletecard/:id", async (req, res) => {
    const { id } = req.params;

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            "DELETE FROM cards WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Card not found" });
        }

        res.json({ message: "Card deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error - could not delete card" });
    } finally {
        if (connection) await connection.end();
    }
});


app.listen(port, () => {
    console.log("Server running on port", port);
});
