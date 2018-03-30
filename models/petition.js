const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var rejectionSchema = new Schema({
    reason: String,
    details: String
}, { _id: false });

var responseSchema = new Schema({
    summary: String,
    details: String,
    createdAt: Date,
    updatedAt: Date
}, { _id: false });

var debateSchema = new Schema({
    overview: String,
    transcriptUrl: String,
    debateDate: Date
}, { _id: false });

var attributesSchema = new Schema({
    action: String,
    background: String,
    additionalDetails: String,
    state: String,
    signatureCount: Number,
    createdAt: Date,
    updatedAt: Date,
    rejectedAt: Date,
    openedAt: Date,
    closedAt: Date,
    responseThresholdReachedAt: Date,
    responseAt: Date,
    debateThresholdReachedAt: Date,
    scheduledDebateDate: Date,
    debateOutcomeAt: Date,
    creatorName: String,
    creatorId: String,
    rejection: rejectionSchema,
    response: responseSchema,
    debate: debateSchema,
    signaturesById: [String]
}, { _id: false });

var petitionSchema = new Schema({
    petitionId: Number,
    attributes: attributesSchema
});

var Petition = mongoose.model('petition', petitionSchema);

module.exports = Petition;

