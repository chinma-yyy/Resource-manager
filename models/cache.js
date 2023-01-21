const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const cacheSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    tags: {
        type: Array,
        required: true,
    }
});