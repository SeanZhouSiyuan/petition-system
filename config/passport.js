const passport = require('passport');
const GithubStrategy = require('passport-github').Strategy;
const keys = require('./keys');

// client ID and secret
const GITHUB_CLIENT_ID = keys.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = keys.GITHUB_CLIENT_SECRET;

const User = require('../models/user');

passport.use(
    new GithubStrategy({
        // Strategy options
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: '/auth/github/authorized'
    }, (accessToken, refreshToken, profile, done) => {
        // verify callback
        User.findOne({ githubId: profile.id }, (err, doc) => {
            if (err) done(err);
            if (doc) {
                console.log('Found existing user.');
                if (doc.displayName !== profile.displayName) {
                    User.findOneAndUpdate(
                        { githubId: profile.id },
                        { $set: { displayName: profile.displayName }},
                        { new: true },
                        (err, doc) => {
                            if (err) done(err);
                            done(null, doc);
                        }
                    );
                }
                done(null, doc);
            } else {
                new User({
                    githubId: profile.id,
                    displayName: profile.displayName
                }).save((err, user) => {
                    console.log('Saved a new user.');
                    done(err, user);
                })
            }
        });
    })
);

passport.serializeUser((user, done) => {
    done(null, user.githubId);
});

passport.deserializeUser((githubId, done) => {
    User.findOne({ githubId: githubId }, (err, user) => {
        done(err, user);
    });
});