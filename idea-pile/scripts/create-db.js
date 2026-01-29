import sqlite3 from "sqlite3";
import bcrypt from "bcrypt"

const SALT_ROUNDS = 12;

// Open (or create) database file
const db = new sqlite3.Database("app.db");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Create tables (Entities)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

async function create_user(password, name, email){
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  db.run(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, hash]
  );
}

async function user_login(password, email){
  db.run("SELECT password_hash FROM users WHERE email = ?", [email], 
    async (err, row) => {
      if (!row) {
        console.log("Invalid credentials");
        return;
      }

      const isValid = await bcrypt.compare(
        password,
        row.password_hash
      );

    if(isValid) {
      console.log("Login success");
    } else {
      console.log("Invalid credentials");
    }
    return isValid;
  })
  return false;
}

async function init_user(){
    await create_user("password123", "John Doe", "john@example.com");
}

export default db;
