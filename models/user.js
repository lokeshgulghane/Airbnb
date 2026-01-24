const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({     //username ani password already aste there is no need to define it
    email: {
        type: String,
        required: true,
    },
});

userSchema.plugin(passportLocalMongoose);   //automatically implement karte hashing plugginf and salting la

module.exports = mongoose.model("User", userSchema);