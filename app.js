const express = require('express');
const app = express();
const passport = require('passport');
const authRoutes = require('./routes/auth');
const petitionsRoutes = require('./routes/petitions');
const session = require('express-session');
const mongoose = require('mongoose');
const dbUri = 'mongodb://localhost/petition-system';
const Petition = require('./models/petition');
const utilities = require('./utilities');

const categorizePetitions = utilities.categorizePetitions;
const getFullDate = utilities.getFullDate;

mongoose.connect(dbUri, err => {
    if (err) throw err;
    console.log('Connected to database.');
});

// set view engine
app.set('view engine', 'pug');

// use express-session
app.use(session({
    secret: 'petition system created by sean',
    saveUninitialized: false,
    resave: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// serve static files
app.use('/public', express.static(__dirname + '/public'));

// serve authentication routes
app.use('/auth', authRoutes);

// serve routes relating to petitions
app.use('/petitions', petitionsRoutes);

// homepage
app.get('/', (req, res) => {
    Petition.find({}, (err, docs) => {
        if (err) throw err;
        var categorizedPetitions = categorizePetitions(docs, getFullDate);
        res.render('index', {
            isAuthenticated: req.isAuthenticated(),
            petitionGroup: categorizedPetitions,
            homepage: true
        });
    });
});

// login page
app.get('/login', (req, res) => {
    res.render('login');
});

// logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// fallback
app.get('*', (req, res) => {
    res.render('404');
});

app.listen('8080', () => {
    console.log('Server listening on port 8080.');
});