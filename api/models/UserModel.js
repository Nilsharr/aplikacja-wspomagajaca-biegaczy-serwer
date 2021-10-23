const valid = require('validator');
const bcrypt = require('bcryptjs');
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
    before_save: (instance, options) => {
        if (instance.isModified('password')) {
            //instance.password = await bcrypt.hash(instance.password, 10);
            instance.password = bcrypt.hashSync(instance.password, 10);
        }
        return true;
    },
    methods: {
        // todo
        // for some reason this(instance) is empty
        /*generateAuthToken: () => {
            const token = jwt.sign({ _email: this.email }, process.env.JWT_KEY);
            this.tokens = !this.tokens ? [token] : this.tokens.concat(token);
            await this.saveAsync();
            return token;
        },*/
    },
}
