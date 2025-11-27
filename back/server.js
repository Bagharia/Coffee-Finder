const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.set('json spaces', 2); 
}

const cafesRoutes = require('./routes/cafes');
app.use('/api/cafes', cafesRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
