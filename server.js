const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database("./tasks.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL
    )
  `);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  db.all("SELECT id, text FROM tasks ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB read failed" });
    res.json(rows);
  });
});

app.post("/tasks", (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Task text is required" });
  }

  db.run("INSERT INTO tasks (text) VALUES (?)", [text.trim()], function (err) {
    if (err) return res.status(500).json({ error: "DB insert failed" });
    res.status(201).json({ id: this.lastID, text: text.trim() });
  });
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "DB delete failed" });
    res.json({ success: true, deleted: this.changes });
  });
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
