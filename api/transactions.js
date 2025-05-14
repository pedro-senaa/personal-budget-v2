const express = require('express');
const transactionsRouter = express.Router();
const pool = require('../database');

// param route for checking if there is transaction with matching id
transactionsRouter.param('transactionId', async (req, res, next, transactionId) => {
    try {
        const results = await pool.query(`
            SELECT *
            FROM Transactions
            WHERE id = $1`,
            [transactionId]);
        if (results.rows.length > 0) {
            req.transaction = results.rows[0];
            next();
        } else {
            res.status(404).json({ error: 'Transaction not found' })
        }
    } catch (err) {
        console.error('Error fetching data: ', err)
        res.status(500).json({ error: 'internal server error' })
    }
});


// POST request: create a new transaction
//  (should also subtract amount of envelope with matching id at req.body.envelopeId)
transactionsRouter.post('', async (req, res, next) => {
    const { date, amount, envelope_id, recipient } = req.body;
    const amt = Number(amount);

    // checks for invalid data
    if (!envelope_id || !recipient || isNaN(amt) || amt <= 0) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(`
            SELECT * 
            FROM Envelopes 
            WHERE id = $1`,
            [envelope_id]);

        // checks if envelope is real
        if (result.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ error: 'Envelope not found' })
        }

        // checks if amount in envelope is enough
        if (result.rows[0].amount < amt) {
            await client.query('ROLLBACK')
            return res.status(400).json({ error: 'insufficient funds' });
        }

        // subtracts from envelope
        await client.query(`
            UPDATE Envelopes
            SET amount = amount - $1
            WHERE id = $2`,
            [amt, envelope_id]);

        // insert into transactions table
        const insertTransaction = await client.query(`
            INSERT INTO Transactions (
                envelope_id, 
                recipient,
                amount, 
                date) 
            VALUES (
                $1,
                $2,
                $3,
                $4)
            RETURNING *`,
            [envelope_id, recipient, amt, date || new Date()])

        await client.query('COMMIT');
        res.status(201).json(insertTransaction.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('error fetching data: ', err)
        res.status(500).json({ error: 'Internal server error' })
    }
});

// GET request: get all transactions
// dunno why would need it but here it is
transactionsRouter.get('/', async (req, res, next) => {
    try {
        const results = await pool.query(`
            SELECT *
            FROM Transactions`)
        res.status(200).json(results.rows);
    } catch (err) {
        console.error('Error fetching data: ', err)
        res.status(500).json({ error: 'Internal server error' })
    }
});

// GET request: get single transaction with matching id
transactionsRouter.get('/:transactionId', async (req, res, next) => {
    res.status(200).json(req.transaction);
});

// PUT request: updates transaction with matching id
// (should also change amount of envelope with matching id at req.body.envelopeId);
transactionsRouter.put('/:transactionId', async (req, res, next) => {
    const { date, amount, envelope_id, recipient } = req.body;
    const amt = Number(amount);
    const id = Number(req.params.transactionId);

    // checks for invalid data
    if (!envelope_id || !recipient || isNaN(amt) || amt <= 0) {
        return res.status(400).json({ error: 'Invalid data' });
    };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const envelope = await client.query(`
            SELECT *
            FROM Envelopes
            WHERE id = $1`,
            [envelope_id]);

        // checks if envelope is real, if passes, good to go
        if (envelope.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Envelope not found' })
        }


        // corrects envelope amount considering new transaction
        await client.query(`
            UPDATE Envelopes
            SET amount = amount + $1 - $2
            WHERE id = $3`,
            [req.transaction.amount, amt, envelope_id]);

        //insert new transaction into transactions table
        const updatedTransaction = await client.query(`
            UPDATE Transactions
            SET 
              amount = $1,
              recipient = $2,
              date = $4
            WHERE id = $3
            RETURNING *`,
            [amt, recipient, id, date || new Date()]);

        await client.query('COMMIT');
        res.status(200).json(updatedTransaction.rows[0]);    

    } catch (err) {

        await client.query('ROLLBACK')
        console.error('Error fetching data: ', err)
        res.status(500).json({ error: 'Internal server error' })
    } finally {

        client.release();

    }

});

// DELETE request: delete transaction with matching id
transactionsRouter.delete('/:transactionId', async (req, res, next) => {
    const {envelope_id, amount} = req.transaction;
    const amt = Number(amount);
    
    const client = await pool.connect();
    try {
    
        await client.query('BEGIN')

        // adds amount of transaction back to envelope
        await client.query(`
            UPDATE Envelopes
            SET
              amount = amount + $1
            WHERE id = $2`, 
            [amt, envelope_id]);

        // deletes transaction

        await client.query(`
            DELETE FROM Transactions 
            WHERE id = $1`, 
            [req.params.transactionId]);

        await client.query('COMMIT');
        res.status(200).json({message: 'Transaction deleted'});
 
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error fetching data: ', err)
        res.status(500).json({error: 'Internal server error'})
    } finally {
        client.release();
    }
});

