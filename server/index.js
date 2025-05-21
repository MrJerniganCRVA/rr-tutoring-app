const express = require('express');
const app = express();
const PORT = 5000;
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./test.db', sqlite3.OPEN_READWRITE, (err)=>{
  if (err) return console.error;
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is working!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
