const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        required: true,
        default: null
    },
    password: {
        type: String,
        required: true,
        minlength: 5
    },
    accessToken: {
        type: String,
        required: true
    },
    tags: {
        type: Array
    },
    template_id: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

});