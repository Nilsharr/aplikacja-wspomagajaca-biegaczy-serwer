const valid = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

module.exports = {
    fields: {
        login: {
            type: "text",
            rule: {
                required: true
            }
        },
        email: {
            type: "text",
            rule: {
                validator: value => valid.isEmail(value),
                message: "Email is not valid or empty",
                required: true
            }
        },
        password: {
            type: "text",
            rule: {
                // validates hash instead of password
                //validator: value => valid.isLength(value, { min: 6, max: undefined }),
                //message: "Password is too short or empty",
                required: true
            }
        },
        // find how to change to array
        tokens: {
            // maybe set?
            type: "list",
            typeDef: "<text>",
        }
    },
    key: ["email"],
    // async/await ...
    before_save: function (instance, options) {
        //instance.password = await bcrypt.hash(instance.password, 10);
        instance.password = bcrypt.hashSync(instance.password, 10);
        return true;
    },
    methods: {

        generateAuthToken: async function () {
            // id??
            const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY);
            // this.tokens = this.tokens.concat({ token });
            // to change - concat
            this.tokens = [token];
            return token;
        },
    },
}

exports.findByCredentials = async (email, password) => {
    const user = await User.findOneAsync({ email: email });
    if (!user) {
        throw new Error({ error: 'Invalid login credentiasl' });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error({ error: 'Invalid login credentiasl' });
    }
    return user;
}