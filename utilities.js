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
            Counter.findOneAndUpdate(
                {},
                { $inc: { count: 1 } },
                err => {
                    if (err) throw err;
                    callback();
                }
            );
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
    var eligibility = {
        eligible: false
    };
    if (req.user && req.user.githubId === '22345231') {
        eligibility.eligible = true;
        return eligibility;
    }
    if (petition.attributes.state === 'closed') {
        eligibility.reason = 'closed';
    } else if (req.user && petition.attributes.signaturesById.indexOf(req.user.githubId) !== -1) {
        eligibility.reason = 'signed';
    } else if (req.user && petition.attributes.creatorId === req.user.githubId) {
        eligibility.reason = 'author';
    } else {
        eligibility.eligible = true;
    }
    return eligibility;
}

module.exports.checkSignature = function (req) {
    if (!req.query.new_signature) {
        return;
    } else {
        var signatureCheck = {};
        if (req.query.new_signature === 'success') {
            signatureCheck.successful = true;
            signatureCheck.message = '签名成功';
        } else {
            signatureCheck.successful = false;
            if (req.query.new_signature === 'author') {
                signatureCheck.message = '签名失败：你不可以给自己的信件签名';
            } else if (req.query.new_signature === 'signed') {
                signatureCheck.message = '签名失败：你已经给这封信签过名';
            } else if (req.query.new_signature === 'closed') {
                signatureCheck.message = '签名失败：信件已关闭';
            }
        }
        return signatureCheck;
    }
}

module.exports.checkResponse = function (req) {
    if (!req.query.new_response) {
        return;
    } else {
        var responseCheck = {};
        if (req.query.new_response === 'success') {
            responseCheck.successful = true;
            responseCheck.message = '编辑回复成功';
        } else {
            responseCheck.successful = false;
            responseCheck.message = '编辑回复失败';
        }
        return responseCheck;
    }
}

module.exports.checkDelete = function (req) {
    if (!req.query.delete) {
        return;
    } else {
        var deleteCheck = {};
        if (req.query.delete === 'success') {
            deleteCheck.successful = true;
            deleteCheck.message = '信件删除成功';
        } else {
            deleteCheck.successful = false;
            deleteCheck.message = '信件删除失败';
        }
        return deleteCheck;
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
        };
        var doc = {
            petitionId: petition.petitionId,
            attributes: attributes
        }
        var state = petition.attributes.state;
        var response = petition.attributes.response;
        var debate = petition.attributes.debate;
        if (debate) {
            doc.attributes.debate = debate;
            doc.attributes.debate.createdOn = getFullDate(debate.debateDate);
            debatedPetitions.push(doc);
        } else if (response) {
            doc.attributes.response = response;
            doc.attributes.response.createdOn = getFullDate(response.createdAt);
            respondedPetitions.push(doc);
        } else if (state === 'open') {
            doc.attributes.signatureCount = petition.attributes.signatureCount;
            popularPetitions.push(doc);
        }
    });
    var categorizedPetitions = {
        popularPetitions: popularPetitions,
        respondedPetitions: respondedPetitions,
        debatedPetitions: debatedPetitions
    };
    return categorizedPetitions;
}

module.exports.sortPetitions = function (petitions, type) {
    if (type === 'responded') {
        petitions.sort((a, b) => {
            return b.attributes.response.createdAt.getTime() - 
            a.attributes.response.createdAt.getTime();
        });
    } else if (type === 'debated') {
        petitions.sort((a, b) => {
            return b.attributes.debate.debateDate.getTime() - 
            a.attributes.debate.debateDate.getTime();
        });
    } else {
        petitions.sort((a, b) => {
            return b.attributes.signatureCount - 
            a.attributes.signatureCount;
        });
    }
    return petitions;
}

module.exports.getDeadlineTime = function (petition) {
    var createdAt = petition.attributes.createdAt;
    var deadlineTime = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    return deadlineTime;
}

module.exports.checkExpiration = function (petition, deadlineTime) {
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

module.exports.addResponse = function (req, Petition, petition, callback) {
    var createdAt = petition.attributes.response.createdAt;
    var response = {
        summary: req.body.response_summary,
        details: req.body.response_details,
        createdAt: createdAt ? createdAt : new Date()
    };
    if (petition.attributes.response) {
        response.updatedAt = new Date();
    }
    Petition.findOneAndUpdate(
        { petitionId: petition.petitionId },
        {
            $set: {
                'attributes.response': response,
                'attributes.state': 'responded'
            }
        },
        (err, doc) => {
            if (err) throw err;
            callback();
        }
    );
}