require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('\n==================================================');
    console.log('  DATABASE CONNECTION TROUBLESHOOTER');
    console.log('==================================================\n');

    console.log('Checking configuration in .env file...');
    const host = process.env.DB_HOST || 'via default';
    const user = process.env.DB_USER || 'via default';
    const hasPassword = !!process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME || 'via default';

    console.log(`  Host: ${host}`);
    console.log(`  User: ${user}`);
    console.log(`  Password Set?: ${hasPassword ? 'YES' : 'NO'}`);
    console.log(`  Database: ${dbName}`);
    console.log('\nAttempting to connect...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        console.log('  ✅ Connection VALID! (User/Password are correct)');

        console.log('Checking database existence...');
        await connection.query(`USE \`${process.env.DB_NAME}\``);
        console.log(`  ✅ Database '${dbName}' FOUND!`);

        console.log('\nSUCCESS: Your database settings are correct.');
        console.log('You can now run "node backend/server.js" and it should work.');
        await connection.end();
    } catch (error) {
        console.log('\n❌ CONNECTION FAILED');
        console.log(`  Error: ${error.code}`);
        console.log(`  Message: ${error.message}\n`);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('SUGGESTION: Your Username or Password is wrong.');
            if (!hasPassword) {
                console.log('  -> You did not set a password in .env, but your MySQL seems to require one.');
            }
            console.log('  -> Open the file ".env" and check DB_PASSWORD.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log(`SUGGESTION: The database '${dbName}' does not exist.`);
            console.log('  -> You might need to create it using MySQL Workbench or command line.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('SUGGESTION: MySQL is not running!');
            console.log('  -> Make sure your MySQL server (XAMPP/WAMP/Service) is STARTED.');
        }
    }
    console.log('\n==================================================\n');
}

testConnection();
