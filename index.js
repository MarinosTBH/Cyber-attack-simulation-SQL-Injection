const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const url = require('url');
const db = new sqlite3.Database(':memory:'); // In-memory database for lightweight testing

// Create a simple table for demo
db.serialize(() => {
  db.run("CREATE TABLE user (id INT, name TEXT)");
  db.run("INSERT INTO user (id, name) VALUES (?, ?)", [1, 'Alice']);
  db.run("INSERT INTO user (id, name) VALUES (?, ?)", [2, 'Bob']);
  db.run("INSERT INTO user (id, name) VALUES (?, ?)", [3, 'Charlie']);
});

// Create the server
const server = http.createServer((req, res) => {
  const query = url.parse(req.url, true).query;
  const userId = query.id; // Accepting user input from query parameter
  
  if (req.url.startsWith('/user') && userId) {
    // Vulnerable SQL query that does not sanitize user input
    const sql = `SELECT * FROM user WHERE id = ${userId}`;
    console.log("sql", sql)
    db.all(sql, (err, row) => { // db.all allows returning multiple records, db.get no
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Database error');
      } else {
        if (row) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(row));
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('User not found');
        }
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
