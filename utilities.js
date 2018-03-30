module.exports.ensureLoggedIn = function (req, res, next) {
    if (!req.isAuthenticated()) {
        if (req.session) req.session.returnTo = req.originalUrl;
        return res.redirect('/login');
    }
    next();
}

module.exports.getFullDate = function (time) {
    var year = time.getFullYear() === new Date().getFullYear() ? '' : time.getFullYear();
    var month = time.getMonth() + 1;
    var date = time.getDate();
    return `${year}${year ? '年' : ''}${month}月${date}日`;
}

module.exports.createPetition = function (Petition, req, petitionId) {
    var action = req.body.petition_action,
        background = req.body.petition_background,
        details = req.body.petition_additional_details;

    var attributes = {
        action: action,
        background: background,
        additionalDetails: details === '' ? null : details,
        state: 'pending',
        signatureCount: 0,
        createdAt: new Date(),
        creatorName: req.user.displayName,
        creatorId: req.user.githubId,
        signaturesById: []
    };
    var petition = new Petition({
        petitionId: petitionId,
        attributes: attributes
    });
    return petition;
}

module.exports.updateCounter = function (Counter, callback) {
    Counter.findOne({}, (err, doc) => {
        if (err) throw err;
        if (doc) {
            Counter.findOneAndUpdate({}, { count: doc.count + 1 }, err => {
                if (err) throw err;
                callback();
            });
        } else {
            new Counter({
                count: 1
            }).save(err => {
                if (err) throw err;
                callback();
            });
        }
    });
}

module.exports.checkEligibility = function (petition, req) {
    if (!req.user) {
        return {
            eligible: true,
        };
    } else if (petition.attributes.state === 'closed') {
        return {
            eligible: false,
            reason: 'closed'
        };
    } else if (req.user.githubId === '22345231') {
        return {
            eligible: true
        };
    } else if (petition.attributes.signaturesById.indexOf(req.user.githubId) !== -1) {
        return {
            eligible: false,
            reason: 'signed'
        };
    } else if (petition.attributes.creatorId === req.user.githubId) {
        return {
            eligible: false,
            reason: 'author'
        };
    } else {
        return {
            eligible: true,
        };
    }
}

module.exports.checkSignature = function (req) {
    if (req.query.msg === 'author') {
        return {
            successful: false,
            message: '签名失败：你不可以给自己的信件签名'
        };
    } else if (req.query.msg === 'signed') {
        return {
            successful: false,
            message: '签名失败：你已经给这封信签过名'
        };
    } else if (req.query.msg === 'closed') {
        return {
            successful: false,
            message: '签名失败：信件已关闭'
        };
    } else if (req.query.msg === 'done') {
        return {
            successful: true,
            message: '签名成功'
        }
    }
}

module.exports.getAllPetitions = function (Petition, condition, callback) {
    Petition.find(condition, (err, docs) => {
        if (err) throw err;
        callback(docs);
    });
}

module.exports.categorizePetitions = function (petitions, getFullDate) {
    var popularPetitions = [];
    var respondedPetitions = [];
    var debatedPetitions = [];
    petitions.forEach(petition => {
        var attributes = {
            action: petition.attributes.action
        }
        doc = {
            petitionId: petition.petitionId,
            attributes: attributes
        }
        var state = petition.attributes.state;
        if (state === 'open' || state === 'awaiting_response') {
            doc.attributes.signatureCount = petition.attributes.signatureCount;
            popularPetitions.push(doc);
        } else if (state === 'responded') {
            doc.attributes.response = petition.attributes.response;
            doc.attributes.response.createDate = getFullDate(petition.attributes.response.createdAt);
            respondedPetitions.push(doc);
        } else if (state === 'debated') {
            doc.attributes.debate = petition.attributes.debate;
            doc.attributes.debate.debateDate = getFullDate(petition.attributes.response.debateDate);
            debatedPetitions.push(doc);
        }
    });
    popularPetitions.sort((a, b) => {
        return b.attributes.signatureCount - 
        a.attributes.signatureCount;
    });
    respondedPetitions.sort((a, b) => {
        return b.attributes.response.createdAt.getTime() - 
        a.attributes.response.createdAt.getTime();
    });
    debatedPetitions.sort((a, b) => {
        return b.attributes.debate.debateDate.getTime() - 
        a.attributes.debate.debateDate.getTime();
    });
    var categorizedPetitions = {
        popularPetitions: popularPetitions,
        respondedPetitions: respondedPetitions,
        debatedPetitions: debatedPetitions
    };
    return categorizedPetitions;
}

module.exports.getDeadlineTime = function (petition) {
    var createdAt = petition.attributes.createdAt;
    var deadlineTime = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    return deadlineTime;
}

module.exports.shouldClose = function (petition, deadlineTime) {
    var currentDate = new Date();
    var currentTime = currentDate.getTime();
    if (petition.attributes.state !== 'closed' && deadlineTime - currentTime <= 0) {
        return true;
    } else {
        return false;
    }
}

module.exports.getPetitionType = function (state) {
    if (state === 'signable') {
        return '开放信件';
    } else if (state === 'closed') {
        return '关闭的信件';
    } else if (state === 'rejected') {
        return '拒收的信件';
    } else if (state === 'awaiting_response') {
        return '等待回复的信件';
    } else if (state === 'responded') {
        return '已回复的信件';
    } else if (state === 'awaiting_debate') {
        return '等待讨论的信件';
    } else if (state === 'debated') {
        return '已讨论的信件';
    } else if (state === 'not_debated') {
        return '不予讨论的信件';
    } else {
        return '所有信件';
    }
}