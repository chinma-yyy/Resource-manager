const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const cacheSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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

module.exports=mongoose.model("Cache", cacheSchema);