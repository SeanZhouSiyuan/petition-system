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
    var type = utilities.getPetitionType(state);
    if (state) {
        if (state === 'signable') {
            state = { $nin: ['pending', 'rejected', 'closed'] };
        }
        condition = {
            'attributes.state': state,
            'attributes.action': { $regex: `${text}` }
        };
    } else {
        condition = {
            'attributes.action': { $regex: `${text}` }
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
                petition.attributes.response.createDate = getFullDate(doc.attributes.response.createdAt);
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
            type: type
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
                var signatureCheck = utilities.checkSignature(req);
                var responseCheck =  utilities.checkResponse(req);
                var deadlineTime = utilities.getDeadlineTime(doc);
                var shouldClose = utilities.shouldClose(doc, deadlineTime);
                var deadline = utilities.getFullDate(deadlineTime);
                var renderOptions = {
                    isAuthenticated: req.isAuthenticated(),
                    user: req.user,
                    petition: doc,
                    signatureCheck: signatureCheck,
                    responseCheck: responseCheck,
                    deadline: deadline
                };
                if (shouldClose === true) {
                    Petition.updateOne(
                        { petitionId: petitionId },
                        { $set: {
                            'attributes.state': 'closed',
                            'attributes.closedAt': deadlineTime
                        } },
                        err => {
                            if (err) throw err;
                            var eligibility = {
                                eligible: false,
                                reason: 'closed'
                            };
                            renderOptions.eligibility = eligibility;
                            res.render('petition', renderOptions);
                        }
                    );
                } else {
                    var eligibility = checkEligibility(doc, req);
                    renderOptions.eligibility = eligibility;
                    res.render('petition', renderOptions);
                }
            } else {
                next();
            }
        });
    }
});

Router.get('/:petitionId/manage', ensureLoggedIn, (req, res) => {
    if (req.user.githubId !== '22345231') {
        res.redirect('/access-denied?from=manage_petition');
    } else {
        var petitionId = req.params.petitionId;
        Petition.findOne({ petitionId: petitionId }, (err, doc) => {
            if (err) throw err;
            res.render('manage-petition', {
                isAuthenticated: req.isAuthenticated(),
                user: req.user,
                petition: doc
            });
        });
    }
});

Router.post('/:petitionId/manage/new-response', urlencodedParser, (req, res) => {
    var petitionId = req.params.petitionId;
    Petition.findOne({ petitionId: petitionId }, (err, doc) => {
        if (err) throw err;
        utilities.addResponse(req, Petition, doc, () => {
            res.redirect(`/petitions/${petitionId}?newResponse=success`);
        });
    });
});

Router.get('/:petitionId/manage/delete', (req, res) => {
    var petitionId = req.params.petitionId;
    Petition.findOneAndRemove({ petitionId: petitionId }, (err, doc) => {
        if (err) throw err;
        res.redirect(`/?delete=success`);
    });
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
                                res.redirect(`/petitions/${petitionId}?newSignature=success`);
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
                                res.redirect(`/petitions/${petitionId}?newSignature=success`);
                            }
                        )
                    } else {
                        res.redirect(`/petitions/${petitionId}?newSignature=success`);
                    }
                }
            )
        } else {
            res.redirect(`/petitions/${petitionId}?newSignature=${eligibility.reason}`);
        }
    })
});

Router.get('*', (req, res) => {
    res.render('404');
});

module.exports = Router;