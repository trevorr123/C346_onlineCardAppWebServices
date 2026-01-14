const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

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
    ssl: { rejectUnauthorized: false }, // add if you are using Aiven SSL
};

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

app.listen(port, () => {
    console.log("Server running on port", port);
});
