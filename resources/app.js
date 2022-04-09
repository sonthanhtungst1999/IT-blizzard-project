const express = require('express');
const handlebars  = require('express-handlebars');
const path = require('path');
const route = require('./routes');
const db = require('./config/db');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const app = express();
require('dotenv').config({ path: './resources/.env' }) // Environments Place
const port = process.env.PORT || 5000;
const helpers = require('./util/helpersHandlebars');


// Connect to Database
db.connect();

// Express session config
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.ES_SECRET_KEY,
  cookie: { maxAge: null }
}))

//Template Engine
app.engine('hbs', handlebars({
  extname : '.hbs',
  helpers
}));
app.set('view engine', 'hbs');

// Public folder
app.use(express.static(path.join(__dirname, 'public')));

// Add views folder link
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

//Read method POST
app.use(express.urlencoded({
  extended : true,
}));
app.use(express.json());

// Override with the X-HTTP-Method-Override header in the request
app.use(methodOverride('_method'))

//Read Cookie
app.use(cookieParser('secret'));

//Middleware message used express-session

// Route init
route(app);

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
