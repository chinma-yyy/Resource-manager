const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const credentialsSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  bearerToken: {
    type: String,
    required: true,
  }
});
