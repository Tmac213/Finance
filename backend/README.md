# Backend Server Setup

## Prerequisites

1. **MySQL Database** - Make sure MySQL is installed and running
2. **Node.js** - Version 14 or higher

## Quick Start

1. **Create a `.env` file** in the `backend` directory:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=mishub_db
   
   PORT=3001
   JWT_SECRET=dev-secret-change-in-production
   ```

2. **Create the database**:
   ```sql
   CREATE DATABASE mishub_db;
   ```

3. **Run the schema** (optional, if tables don't exist):
   ```bash
   mysql -u root -p mishub_db < schema.sql
   ```

4. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3001`

## Testing the Connection

Test if the database connection works:
```bash
node test-db.js
```

## Troubleshooting

- **"Connection refused"**: Make sure MySQL is running
- **"Access denied"**: Check your DB_USER and DB_PASSWORD in `.env`
- **"Unknown database"**: Create the database first: `CREATE DATABASE mishub_db;`

