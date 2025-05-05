const express = require('express');
const apiRouter = require('./api/api');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use('/envelopes', apiRouter);


app.get('', (req, res, next) => {
    console.log('server is running smooth as butter!')
})

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});

