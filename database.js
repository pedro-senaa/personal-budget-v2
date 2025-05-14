const { Pool } = require('pg');

// Create a new pool instance; down the road change user and set password @ render
const pool = new Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'personal_budget',
    password: 'postgres',
    port: 5432, // Default PostgreSQL port
});

// Function to test the connection
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Connected to the database successfully!');
        client.release(); // Release the client back to the pool
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
}

// function to create table (in case it gives error)
async function createEnvelopesTable() {
    const query = `
    CREATE TABLE IF NOT EXISTS Envelopes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0))`

    try {
        await pool.query(query)
        console.log('Envelopes table online');
    } catch (err) {
        console.error(`Error creating table : ${err}`);
    }
}

async function createTransactionsTable() {
    const query = `
    CREATE TABLE IF NOT EXISTS Transactions (
    id SERIAL PRIMARY KEY,
    envelope_id INTEGER NOT NULL REFERENCES Envelopes(id) ON DELETE CASCADE,
    recipient TEXT NOT NULL, 
    amount INTEGER NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE
    )`;
    try {
        await pool.query(query);
        console.log('Transactions table online');
    } catch(err) {
        console.error(`Error creating table: ${err}`)
    }
};



testConnection();
createEnvelopesTable();
createTransactionsTable();


module.exports = pool;