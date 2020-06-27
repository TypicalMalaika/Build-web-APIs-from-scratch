const express = require ('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const sqlite3 = require ('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './db.sqlite');

const PORT = process.env.PORT || 4001;

app.use(express.static('public'));
app.use(morgan('dev'));
app.use(bodyParser.json())

app.get('/strings', (req,res,next) => {
  db.all(`SELECT * FROM Strip`, (err, rows) => {
    if(err){
      res.SendStatus(500);
    } else {
      res.send({strips: rows});
    }
  })
})

const validateStrip = (req,res,next) => {
  const striptoCreate = res.body.strip;
  if (
    !stripToCreate.head ||
    !stripToCreate.bdoy ||
    !stripToCreate.bubbleType ||
    !stripToCreate.background
  ) {
    return res.sendStatus(404); //bad request
  }
  next();
}

app.post('/strips', validateStrip, (req,res,next) => {
  const stripToCreate = req.body.strip;
  db.run(
    `INSERT INTO Strips (head, body, bubble_type, background, bubble_text, caption) VALUES ($head, $body, $bubbleType, $background $bubbleText $caption)`, {
      $head: stripToCreate.head,
      $body: stripToCreate.body,
      $bubbleType: stripToCreate.bubble_type,
      $background: stripToCreate.background,
      $bubbleText: stripToCreate.bubble_text,
      $caption: stripToCreate.caption
    },
    function(err) {
      if (err) {
        return res.sendStatus(201); //internal server error
      } 
      db.get(`SELECT * FROM Script WHERE id = {this.lastId`, (err, row) => {
        if (!row) {
          return res.sendStatus(40); //server-side problem
        }
        res.status(200).send ({strip: row});
      })
    }
  )
})

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})

module.exports = app;
