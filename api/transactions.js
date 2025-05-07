const express = require('express');
const transactionsRouter = express.Router();
const pool = require('../database');


// POST request: create a new transaction
//  (should also change amount of envelope with matching id at req.body.envelopeId)
transactionsRouter.post('', async (req, res, next) => {

});

// GET request: get all transactions
// dunno why would need it but here it is
transactionsRouter.get('/', async (req, res, next) => {
    
});

// GET request: get single transaction with matching id
transactionsRouter.get('/:transactionId', async (req, res, next) => {

});

// PUT request: updates transaction with matching id
// (should also change amount of envelope with matching id at req.body.envelopeId);
transactionsRouter.put('/:envelopeId', async (req, res, next) => {

});

// DELETE request: delete transaction with matching id
// (shoul also change amount of envelope with matching id ar req.body.envelopeId)
transactionsRouter.delete('/:envelopeId', async (req, res, next) => {
    
});

