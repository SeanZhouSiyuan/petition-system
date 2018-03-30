const Router = require('express').Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const Petition = require('../models/petition');
const Counter = require('../models/counter');
const utilities = require('../utilities');

const ensureLoggedIn = utilities.ensureLoggedIn;
const getFullDate = utilities.getFullDate;
const createPetition = utilities.createPetition;
const updateCounter = utilities.updateCounter;
const checkEligibility = utilities.checkEligibility;
const checkSignature = utilities.checkSignature;
const getAllPetitions = utilities.getAllPetitions;

Router.get('/', (req, res) => {
    var query = req.query;

    var condition;
    var state = query.state;
    var text = query.text ? query.text : '';
    if (state) {
        if (state === 'signable') {
            condition = {
                'attributes.state': {
                    $nin: ['pending', 'rejected', 'closed']
                },
                'attributes.action': {
                    $regex: `${text}`
                }
            };
        } else {
            condition = {
                'attributes.state': state,
                'attributes.action': {
                    $regex: `${text}`
                }
            }
        }
    } else {
        condition = {
            'attributes.action': {
                $regex: `${text}`
            }
        };
    }
    var petitions;
    getAllPetitions(Petition, condition, docs => {
        petitions = [];
        docs.forEach(doc => {
            var attributes = {
                action: doc.attributes.action,
                signatureCount: doc.attributes.signatureCount
            };
            var petition = {
                petitionId: doc.petitionId,
                attributes: attributes
            };
            if (state === 'responded') {
                petition.attributes.response = doc.attributes.response;
                petition.attributes.response.createDate = getFullDate(petition.response.createdAt);
            } else if (state === 'debated') {
                petition.attributes.debate = doc.attributes.debate;
            }
            petitions.push(petition);
        });
        petitions.sort((a, b) => {
            return b.attributes.signatureCount - a.attributes.signatureCount;
        });
        res.render('all-petitions', {
            isAuthenticated: req.isAuthenticated(),
            petitions: petitions,
            state: state,
            type: utilities.getPetitionType(state)
        });
    });
});

Router.get('/new', ensureLoggedIn, (req, res) => {
    res.render('new-petition', { isAuthenticated: req.isAuthenticated() });
});

Router.post('/new', urlencodedParser, (req, res) => {
    updateCounter(Counter, () => {
        Counter.findOne({}, (err, counter) => {
            if (err) throw err;
            var petition = createPetition(Petition, req, counter.count);
            petition.save((err, doc) => {
                if (err) throw err;
                res.redirect('/petitions/' + doc.petitionId);
            });
        });
    });
});

Router.get('/:petitionId', (req, res, next) => {
    var petitionId = req.params.petitionId;
    if (!parseInt(petitionId)) {
        next();
    } else {
        Petition.findOne({petitionId: petitionId}, (err, doc) => {
            if (err) throw err;
            if (doc) {
                var newSignature = checkSignature(req);
                var deadlineTime = utilities.getDeadlineTime(doc);
                var shouldClose = utilities.shouldClose(doc, deadlineTime);
                var deadline = utilities.getFullDate(deadlineTime);
                if (shouldClose === true) {
                    Petition.updateOne(
                        { petitionId: petitionId },
                        { $set: {
                            'attributes.state': 'closed',
                            'attributes.closedAt': deadlineTime
                        } },
                        err => {
                            if (err) throw err;
                            var eligibility = checkEligibility(doc, req);
                            res.render('petition', {
                                isAuthenticated: req.isAuthenticated(),
                                eligibility: eligibility,
                                petition: doc,
                                newSignature: newSignature,
                                deadline: deadline
                            });
                        }
                    );
                } else {
                    var eligibility = checkEligibility(doc, req);
                    res.render('petition', {
                        isAuthenticated: req.isAuthenticated(),
                        eligibility: eligibility,
                        petition: doc,
                        newSignature: newSignature,
                        deadline: deadline
                    });
                }
            } else {
                next();
            }
        });
    }
});

Router.get('/:petitionId/signatures/new', ensureLoggedIn, (req, res) => {
    var petitionId = req.params.petitionId;
    Petition.findOne({ petitionId: petitionId }, (err, doc) => {
        if (err) throw err;
        var eligibility = checkEligibility(doc, req);
        if (eligibility.eligible === true) {
            var signatureCount = doc.attributes.signatureCount;
            Petition.updateOne(
                { petitionId: petitionId },
                {
                    $set: { 'attributes.signatureCount': ++signatureCount },
                    $push: { 'attributes.signaturesById': req.user.githubId }
                },
                err => {
                    if (err) throw err;
                    if (signatureCount === 100) {
                        Petition.updateOne(
                            { petitionId: petitionId },
                            {
                                $set: { 'attributes.state': 'awaiting_response' },
                                $currentDate: { 'attributes.responseThresholdReachedAt': true }
                            },
                            err => {
                                if (err) throw err;
                                res.redirect(`/petitions/${petitionId}?msg=done`);
                            }
                        )
                    } else if (signatureCount === 1000) {
                        Petition.updateOne(
                            { petitionId: petitionId },
                            {
                                $set: { 'attributes.state': 'awaiting_debate' },
                                $currentDate: { 'attributes.debateThresholdReachedAt': true }
                            },
                            err => {
                                if (err) throw err;
                                res.redirect(`/petitions/${petitionId}?msg=done`);
                            }
                        )
                    } else {
                        res.redirect(`/petitions/${petitionId}?msg=done`);
                    }
                }
            )
        } else {
            res.redirect(`/petitions/${petitionId}?msg=${eligibility.reason}`);
        }
    })
});

Router.get('*', (req, res) => {
    res.render('404');
});

module.exports = Router;