const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const port = 8080;

// Load your OpenAPI spec
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Serve Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Optional: Health check or root route
app.get('/', (req, res) => {
  res.send('Personal Budget API is running. Docs available at /docs');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
});
