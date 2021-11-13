const nodemailer = require('nodemailer');
const Email = require('email-templates');
const path = require('path');

exports.transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
        user: process.env.EMAIL_LOGIN,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.email = new Email({
    message: {
        from: process.env.EMAIL_LOGIN
    },
    send: true,
    preview: false,
    transport: this.transporter
});

// fire & forget
exports.send = (template, to, locals) => {
    this.email.send({
        template: path.join(process.env.PWD, 'mails', 'templates', template),
        message: {
            to: to
        },
        locals: locals
    }).then(console.log)
}
