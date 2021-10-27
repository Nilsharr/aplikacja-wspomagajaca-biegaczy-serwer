const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const mongoose = require('mongoose');
const server = require('../Server');
const User = require('../api/models/User');
const { expect } = require('chai');

chai.use(chaiHttp);

describe('User api', () => {
    beforeEach(done => {
        var user = new User({
            login: 'uelston2',
            email: 'gbravey2@quantcast.com',
            password: 'Jzv9slTf'
        });
        user.save(err => {
            done();
        });
    });
});

afterEach(done => {
    User.collection.drop().then(() => { }).catch(() => {
        console.warn('collection may not exist');
    });
});

it('should get all users on /test GET', done => {
    chai.request(server).get('/test').end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');
        expect(res.body[0]).to.have.property('login');
        expect(res.body[0]).to.have.property('email');
        expect(res.body[0]).to.have.property('password');
        done();
    });
});