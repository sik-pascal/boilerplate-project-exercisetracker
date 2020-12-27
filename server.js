const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const mongoConnectionString = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`;
mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(succ => console.log('Connected to mongodb: ' + succ))
  .catch(fail => console.log('Failed to connect to mongodb: ' + fail));

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true, required: true }
});
const UserModel = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/api/exercise/new-user", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).end();
  };
  const user = new UserModel({
    userName: username
  });

  user.save()
    .then(doc => {
      console.log('New user created: ' + doc);
      res.json(doc)
    })
    .catch(error => {
      console.log('Failed to create new user:' + error);
      const e = error.code === 11000
        ? { status: 409, message: 'Username already exists' }
        : { status: 500, message: error.message };

      res.status(e.status).json({ error: e.message });
    });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
