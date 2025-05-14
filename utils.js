function envelopeChecker(envelope) {
    if (!envelope.name || !envelope.amount || typeof envelope.name !== 'string' || typeof envelope.amount !== 'number') {
        return false;
    } else {
        return true;
    }
};

function checkForSubtractParam(req, res, next) {
    const subtract = Number(req.query.subtract);
    if (isNaN(subtract) || subtract <= 0) {
        res.status(400).send('enter subtract query greater than 0');
    } else {
        req.query.subtract = subtract;
        next();
    }
};

module.exports = envelopeChecker, checkForSubtractParam;