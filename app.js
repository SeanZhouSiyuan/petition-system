const express = require('express');
const app = express();
const passport = require('passport');
const authRoutes = require('./routes/auth');
const petitionsRoutes = require('./routes/petitions');
const profilesRoutes = require('./routes/profiles');
const session = require('express-session');
const mongoose = require('mongoose');
const dbUri = 'mongodb://localhost/petition-system';
const Petition = require('./models/petition');
const utilities = require('./utilities');

const categorizePetitions = utilities.categorizePetitions;
const getFullDate = utilities.getFullDate;
const sortPetitions = utilities.sortPetitions;

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

// serve profile routes
app.use('/profiles', profilesRoutes);

// homepage
app.get('/', (req, res) => {
    Petition.find({}, (err, docs) => {
        if (err) throw err;
        var {popularPetitions, respondedPetitions, debatedPetitions} = 
            categorizePetitions(docs, getFullDate);
        var deleteCheck = utilities.checkDelete(req);
        res.render('index', {
            isAuthenticated: req.isAuthenticated(),
            user: req.user,
            popularPetitions: sortPetitions(popularPetitions, 'popular'),
            respondedPetitions: sortPetitions(respondedPetitions, 'responded'),
            debatedPetitions: sortPetitions(debatedPetitions, 'debated'),
            deleteCheck: deleteCheck,
            homepage: true,
            query: req.query
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
    res.redirect('/?logged_out=yes');
});

app.get('/access-denied', (req, res) => {
    var code = req.query.code;
    var message;
    if (code === 'admin_only') {
        message = '此页面仅允许系统管理员访问。我们对由此带来的不便感到抱歉。';
    } else if (code === 'owner_only') {
        message = '此用户页仅允许该用户访问。我们对由此带来的不便感到抱歉。';
    } else {
        message = '我们对由此带来的不便感到抱歉。';
    }
    res.render('access-denied', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        message: message
    });
});

// fallback
app.get('*', (req, res) => {
    res.render('404', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user
    });
});

app.listen('8080', '0.0.0.0', () => {
    console.log('Server listening on port 8080.');
});