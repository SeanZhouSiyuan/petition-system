const router = require('express').Router();
const passport = require('passport');
const passportConfig = require('../config/passport');

router.get('/github', passport.authenticate('github'));
router.get('/github/authorized', passport.authenticate('github'), (req, res) => {
    res.redirect(req.session.returnTo || '/');
    req.session.returnTo = null;
});

module.exports = router;