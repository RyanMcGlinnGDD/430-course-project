const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

let ScoreModel = {};

const ScoreSchema = new mongoose.Schema({
  score: {
    type: Number,
    min: 0,
    required: true,
  },
});

ScoreModel = mongoose.model('Score', ScoreSchema);

module.exports.ScoreModel = ScoreModel;
module.exports.ScoreSchema = ScoreSchema;
