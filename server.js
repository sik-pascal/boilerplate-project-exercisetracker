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

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
})

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  exercises: [exerciseSchema]
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
    username: username
  });

  user.save()
    .then(doc => {
      console.log('New user created: ' + doc);
      res.json(doc)
    })
    .catch(error => {
      console.log('Failed to create new user: ' + error);
      const e = error.code === 11000
        ? { status: 409, message: 'Username already exists' }
        : { status: 500, message: error.message };

      res.status(e.status).json({ error: e.message });
    });
});

app.get('/api/exercise/users', async (req, res) => {
  res.json(await UserModel.find().select('_id username'));
});

app.post('/api/exercise/add', async (req, res) => {
  console.log('Received new exercise: ' + JSON.stringify(req.body));
  const {
    userId,
    description,
    duration,
    date
  } = req.body;

  const user = await UserModel.findById(userId);
  if (!user) {
    res.send('Unknown user');
    return;
  };

  const exDate = new Date(date || new Date().toDateString());
  user.exercises.push({ description, duration, date: exDate });

  user.save()
    .then(doc => {
      console.log('Added new exercise: ' + doc);
      res.json({
        username: doc.username,
        description,
        duration: parseInt(duration),
        _id: doc._id,
        date: exDate.toDateString(),
      });
    })
    .catch(error => {
      console.log('Failed to add exercise: ' + error);
      res.status(e.status).json({ error: e.message });
    });
});

app.get('/api/exercise/log', (req, res) => {
  const {
    userId,
    from,
    to,
    limit
  } = req.query;

  UserModel.findById(userId)
    .then(doc => {
      let log = [];
      log = doc.exercises
        .filter(l => l.date >= new Date(from || -8640000000000000) && l.date <= new Date(to || 8640000000000000))
        .slice(0, limit || doc.exercises.length)
        .map(l => ({
          duration: l.duration,
          description: l.description,
          date: l.date.toDateString()
        }));
      res.status(200).json({
        _id: doc._id,
        username: doc.username,
        count: doc.exercises.length,
        log
      })
    })
    .catch(e => res.json({ error: e }));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
