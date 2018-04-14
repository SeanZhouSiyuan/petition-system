const Router = require('express').Router();
const User = require('../models/user');
const Petition = require('../models/petition');
const utilities = require('../utilities');
const ensureLoggedIn = utilities.ensureLoggedIn;

Router.get('/:userId', ensureLoggedIn, (req, res, next) => {
    var userId = req.params.userId;
    if (!parseInt(userId)) {
        next();
    }
    if (!req.user || req.user.githubId !== userId) {
        res.redirect('/access-denied?code=owner_only');
    }
    User.findOne({ githubId: userId }, (err, doc) => {
        if (err) throw err;
        if (doc) {
            Petition.find({ 'attributes.creatorId': userId }, (err, docs) => {
                if (err) throw err;
                var petitions;
                if (!docs) {
                    petitions = [];
                } else {
                    petitions = docs;
                    petitions.sort((a, b) => {
                        return b.attributes.createdAt.getTime() - 
                        a.attributes.createdAt.getTime();
                    });
                }
                res.render('profile', {
                    user: doc,
                    petitions: petitions,
                    page: 'profile',
                    query: req.query
                });
            });
        } else {
            res.redirect('/404');
        }
    });
});

module.exports = Router;