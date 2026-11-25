from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)
DB = "queue.db"

def connect_db():
    return sqlite3.connect(DB)

def setup_db():
    con = connect_db()
    con.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            service TEXT NOT NULL,
            status TEXT DEFAULT 'Waiting'
        )
    """)
    con.commit()
    con.close()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/join", methods=["POST"])
def join_queue():
    data = request.json
    name = data.get("name", "").strip()
    service = data.get("service", "").strip()

    if not name or not service:
        return jsonify({"error": "Enter name and select service"}), 400

    con = connect_db()
    cur = con.execute(
        "INSERT INTO tokens (name, service) VALUES (?, ?)",
        (name, service)
    )
    token = cur.lastrowid
    con.commit()
    con.close()

    return jsonify({"token": token, "message": "Token generated successfully"})

@app.route("/queue")
def get_queue():
    con = connect_db()
    rows = con.execute(
        "SELECT id, name, service, status FROM tokens ORDER BY id"
    ).fetchall()
    con.close()

    result = []
    for row in rows:
        result.append({
            "token": row[0],
            "name": row[1],
            "service": row[2],
            "status": row[3]
        })

    return jsonify(result)

@app.route("/next", methods=["POST"])
def next_token():
    con = connect_db()
    row = con.execute(
        "SELECT id FROM tokens WHERE status='Waiting' ORDER BY id LIMIT 1"
    ).fetchone()

    if row:
        con.execute("UPDATE tokens SET status='Serving' WHERE id=?", (row[0],))
        con.commit()

    con.close()
    return jsonify({"message": "Next token called" if row else "No waiting tokens"})

@app.route("/complete/<int:token>", methods=["POST"])
def complete_token(token):
    con = connect_db()
    con.execute(
        "UPDATE tokens SET status='Completed' WHERE id=?", (token,)
    )
    con.commit()
    con.close()
    return jsonify({"message": "Token completed"})

if __name__ == "__main__":
    setup_db()
    app.run(debug=True)