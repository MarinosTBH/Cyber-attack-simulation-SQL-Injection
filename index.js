const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const url = require('url');
const fs = require('fs');
const querystring = require('querystring');

const db = new sqlite3.Database(':memory:');

// Create a simple table for demo
db.serialize(() => {
  db.run("CREATE TABLE user (id INT, username, password TEXT)");
  db.run("INSERT INTO user (id, username, password) VALUES (?, ?, ?)", [1, 'Admin', 'Admin']);
  db.run("INSERT INTO user (id, username, password) VALUES (?, ?, ?)", [2, 'Alice', 'Alice']);
  db.run("INSERT INTO user (id, username, password) VALUES (?, ?, ?)", [3, 'Bob', 'Bob']);
  db.run("INSERT INTO user (id, username, password) VALUES (?, ?, ?)", [4, 'Charlie', 'Charlie']);
});

// Helper function to serve HTML files // // // // // // // // // // 
function serveFile(res, filepath, contentType) {
  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

// Create the server // // // // // // // // // // 
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET' && req.url === '/login') {
    // Serve the login page // // // // // // // // // // 
    serveFile(res, './login.html', 'text/html');
  } else if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        const { username, password } = querystring.parse(body);
        console.log('\x1b[31m%s\x1b[0m', `Attempting login: ${username}, ${password}`); // Debugging

        // Vulnerable SQL query with direct input concatenation
        const sql = `SELECT id, username, password FROM user WHERE username = '${username}' AND password = '${password}'`;

        db.get(sql, (err, row) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Database error');
                console.error(err);
                return;
            }

            if (!row) {
                // User not found or invalid credentials
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Invalid credentials');
                return;
            }

            // Successful login
            res.writeHead(302, {
                'Set-Cookie': `userId=${row.id}; HttpOnly; Path=/; Domain=example.com; SameSite=Lax`,
                Location: '/dashboard'
            });
            res.end();
        });
    });
} else if (req.method === 'GET' && req.url === '/dashboard') {
    // // Serve the dashboard page // // // // // // // // // // 
    serveFile(res, './dashboard.html', 'text/html');
  } else if (req.method === 'GET' && parsedUrl.pathname.startsWith('/user')) {
    // User route
    const userId = parsedUrl.query.id; // Accepting user input from query parameter
    const sql = `SELECT * FROM user WHERE id = ?`; // Parameterized query to prevent SQL injection
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Database error');
      } else {
        if (rows.length > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rows));
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('User not found');
        }
      }
    });
  }
   else if (req.method === 'GET' && parsedUrl.pathname.startsWith('/profile')) {
    // Extract user ID from query string
    const userId = parsedUrl.query.id;

    if (!userId) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('User ID is required');
        return;
    }

    // Vulnerable SQL query with direct input concatenation
    const sql = `SELECT * FROM user WHERE id = ${userId}`;
    db.all(sql, (err, list) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Database error');
        } else if (!list) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('User not found');
        } else {
            // Serve the profile page with user data injected
            fs.readFile('./profile.html', 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Profile page not found');
                } else {
                    let profilePage
                    console.log('\x1b[38m%s\x1b[0m', `Retreiving list: ${JSON.stringify(list)}`); // Debugging
                    
                    // Replace placeholders in the HTML with user data
                    if (list.length === 1) {
                     profilePage = data
                        .replace(/{{username}}/g, list[0].username)
                        .replace('{{id}}', list[0].id);
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                    } else if (list.length > 1 ) {
                         profilePage = JSON.stringify(list)
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    }

                    res.end(profilePage);
                }
            });
        }
    });
}

 else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('\x1b[32m%s\x1b[0m', 'Server running at http://localhost:3000/login');
});

