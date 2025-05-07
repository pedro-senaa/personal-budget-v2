const express = require('express');
const envelopesRouter = require('./api/envelopes');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use('/envelopes', envelopesRouter);


app.get('', (req, res, next) => {
    console.log('server is running smooth as butter!')
})

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});

