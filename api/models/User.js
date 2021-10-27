const mongoose = require('mongoose');
const valid = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    login: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: value => {
            if (!valid.isEmail(value)) {
                throw new Error({ error: 'Invalid email address' });
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY);
    return token;
}

userSchema.statics.findByCredentials = async (login, email, password) => {
    const user = await User.findOne({ $or: [{ login }, { email }] });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error({ error: 'Invalid login credentials' });
    }
    return user;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
