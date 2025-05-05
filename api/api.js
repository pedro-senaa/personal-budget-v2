const express = require('express');
const pool = require('../database');
const { envelopeChecker, checkForSubtractParam } = require('../utils');
const apiRouter = express.Router();

// param router for envelopeId: checks if envelope with given id
apiRouter.param('envelopeId', async (req, res, next, envelopeId) => {
    try {
        const results = await pool.query(`
            SELECT * FROM envelopes WHERE id = $1 RETURNING *
            `, [envelopeId]);
        if (results.rows.length > 0) {
            req.envelope = results.rows[0];
            next();
        } else {
            res.status(404).json({ error: `Envelope not found` })
        }
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// param router for from: checks if id of from is in db
apiRouter.param('from', async (req, res, next, from) => {
    try {
        const results = await pool.query(`
            SELECT * FROM Envelopes WHERE id = $1 RETURNING *`,
            [from])
        if (results.rows.length > 0) {
            req.body.envelopeFrom = results.rows[0];
            next();
        } else {
            res.status(404).json({ error: `Envelope not found` });
        }
    } catch (err) {
        console.error('Error fetching data: ', err);
        res.status(500).json({ error: `Internal server error` })
    }
});

// param router for to: checks if id of to is in db
apiRouter.param('to', async (req, res, next, to) => {
    try {
        const results = await pool.query(`
            SELECT * FROM Envelopes WHERE id = $1 RETURNING *`,
            [to])
        if (results.rows.length > 0) {
            req.body.envelopeTo = results.rows[0];
            next();
        } else {
            res.status(404).json({ error: `Envelope not found` });
        }
    } catch (err) {
        console.error('Error fetching data: ', err);
        res.status(500).json({ error: `Internal server error` })
    }
});

// GET all
apiRouter.get('/', async (req, res, next) => {
    try {
        const results = await pool.query('SELECT * FROM envelopes');
        res.status(200).json(results.rows);
    } catch (err) {
        console.error('Error fetching: ', err)
        res.status(500).json({ error: 'Internal server error' })
    }
});

// POST new envelope
apiRouter.post('/', async (req, res, next) => {
    const isValidEnvelope = envelopeChecker(req.body);
    if (isValidEnvelope) {
        try {
            const { name, amount } = req.body;
            const results = await pool.query(
                `INSERT INTO Envelopes (name, amount) VALUES ($1, $2) RETURNING id`,
                [name, amount]
            );
            res.status(201).json(results.rows[0]);
        } catch (err) {
            console.error(`Error: ${err}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(400).json({ error: 'Invalid Envelope Data' });
    }
});

// PUT envelope at matching id
apiRouter.put('/:envelopeId', async (req, res, next) => {
    const { name, amount } = req.body;
    const id = Number(req.params.envelopeId);
    try {
        const results = await pool.query(`
            UPDATE Envelopes
            SET name = $1, amount = $2
            WHERE id = $3`,
            [name, amount, id])
        res.status(200).json(results.rows[0])
    } catch (err) {
        console.error(`Internal server error: ${err}`)
        res.status(500).json({ error: 'Internal server error' })
    }
});

//DELETE envelope at matching id
apiRouter.delete('/:envelopeId', async (req, res, next) => {
    const id = Number(req.params.envelopeId);
    try {
        const results = await pool.query(`
            DELETE FROM Envelopes WHERE id = $1`,
            [id])
        res.status(200).send();
    } catch (err) {
        console.error(`Internal server error: ${err}`)
        res.status(500).json({ error: 'Internal server error' })
    }
});

// POST route for subtracting amount (expect query.subract on the request)
apiRouter.post('/:envelopeId', checkForSubtractParam, async (req, res, next) => {
    const subtract = req.query.subtract;
    const id = Number(req.params.envelopeId);
    try {
        const existing = await pool.query(`
            SELECT amount
            FROM Envelopes 
            WHERE id = $1`,
            [id])
        const currentAmount = existing.rows[0].amount;
        if (currentAmount - subtract < 0) {
            return res.status(400).json({ error: 'Negative amount of money' });
        }

        const results = await pool.query(`
            UPDATE Envelopes
            SET amount = amount - $1
            WHERE id = $2
            RETURNING *`,
            [subtract, id])

        res.status(200).json(results.rows[0]);
    } catch (err) {
        console.error('Error fetching data', err);
        res.status(500).json({ error: 'Internal server error' })
    }
});

//POST route for transfering from envelopeFrom to envelopeTo (expect body with amount property)
apiRouter.post('/transfer/:from/:to', async (req, res, next) => {
    const { envelopeFrom, envelopeTo } = req.body;
    const amount = Number(req.body.amount);
    // checks if envelopeFrom has enough money
    if (envelopeFrom.amount - amount < 0) {
        return res.status(400).json({error: 'Not enough money to transfer'});
    }
    // ok to transfer the money
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // takes away from envelopeFrom
        await client.query(`
            UPDATE Envelopes 
            SET amount = amount - $1
            WHERE id = $2`,
            [amount, envelopeFrom.id]);
        
            // adds to envelopeTo
        await client.query(`
            UPDATE Envelopes
            SET amount = amount + $1
            WHERE id = $2`, 
            [amount, envelopeTo.id])

        await client.query('COMMIT');
        
        res.status(200).json({message: `Transfered ${amount} from envelope ${envelopeFrom.id} to ${envelopeTo.id}`})
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error transfering money: ', err);
        res.status(500).json({error: 'Internal server error'})
    } finally {
        client.release();
    }
})












module.exports = apiRouter;