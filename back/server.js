const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

const cafesRoutes = require('./routes/cafes');

app.use(cors());

app.use('/api/cafes', cafesRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
