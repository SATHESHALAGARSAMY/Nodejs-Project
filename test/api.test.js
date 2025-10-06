const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const { initializeDatabase, closeDatabase } = require('../db');

describe('Data Pusher API Tests', () => {
    let authToken;
    let accountId;
    let destinationId;
    let appSecretToken;

    before((done) => {
        // Initialize database before tests
        initializeDatabase();
        setTimeout(done, 1000); // Wait for DB to initialize
    });

    after((done) => {
        // Clean up after tests
        closeDatabase();
        setTimeout(done, 500);
    });

    describe('User Authentication', () => {
        it('should register a new user', (done) => {
            request(app)
                .post('/api/user/signup')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body).to.have.property('token');
                    authToken = res.body.token;
                    done();
                });
        });

        it('should not register user with duplicate email', (done) => {
            request(app)
                .post('/api/user/signup')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });

        it('should login with valid credentials', (done) => {
            request(app)
                .post('/api/user/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body).to.have.property('token');
                    authToken = res.body.token;
                    done();
                });
        });

        it('should fail login with invalid credentials', (done) => {
            request(app)
                .post('/api/user/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });
    });

    describe('Account Management', () => {
        it('should create a new account', (done) => {
            request(app)
                .post('/api/account/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    email: 'account@example.com',
                    accountName: 'Test Account',
                    website: 'https://example.com'
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body.data).to.have.property('accountId');
                    expect(res.body.data).to.have.property('appSecretToken');
                    accountId = res.body.data.accountId;
                    appSecretToken = res.body.data.appSecretToken;
                    done();
                });
        });

        it('should get all accounts', (done) => {
            request(app)
                .get('/api/account')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body).to.have.property('data');
                    expect(res.body.data).to.be.an('array');
                    done();
                });
        });

        it('should get account by ID', (done) => {
            request(app)
                .get(`/api/account/${accountId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body.data).to.have.property('accountId', accountId);
                    done();
                });
        });

        it('should update account', (done) => {
            request(app)
                .put(`/api/account/${accountId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountName: 'Updated Account Name'
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    done();
                });
        });
    });

    describe('Destination Management', () => {
        it('should create a new destination', (done) => {
            request(app)
                .post('/api/destination/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    url: 'https://webhook.site/test',
                    httpMethod: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token'
                    }
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body.data).to.have.property('destinationId');
                    destinationId = res.body.data.destinationId;
                    done();
                });
        });

        it('should get destinations by account ID', (done) => {
            request(app)
                .get(`/api/destination/account/${accountId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body.data).to.be.an('array');
                    done();
                });
        });

        it('should update destination', (done) => {
            request(app)
                .put(`/api/destination/${destinationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    url: 'https://webhook.site/updated'
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    done();
                });
        });
    });

    describe('Data Handler', () => {
        it('should receive and queue data with valid headers', (done) => {
            request(app)
                .post('/api/server/incoming_data')
                .set('CL-X-TOKEN', appSecretToken)
                .set('CL-X-EVENT-ID', 'test-event-' + Date.now())
                .send({
                    user_id: 123,
                    action: 'user.update',
                    data: {
                        name: 'John Doe',
                        email: 'john@example.com'
                    }
                })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body).to.have.property('message', 'Data Received');
                    done();
                });
        });

        it('should reject data without CL-X-TOKEN header', (done) => {
            request(app)
                .post('/api/server/incoming_data')
                .set('CL-X-EVENT-ID', 'test-event-' + Date.now())
                .send({
                    user_id: 123
                })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });

        it('should reject data without CL-X-EVENT-ID header', (done) => {
            request(app)
                .post('/api/server/incoming_data')
                .set('CL-X-TOKEN', appSecretToken)
                .send({
                    user_id: 123
                })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });
    });

    describe('Logs', () => {
        it('should get logs', (done) => {
            request(app)
                .get('/api/log')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body).to.have.property('data');
                    done();
                });
        });

        it('should get log statistics', (done) => {
            request(app)
                .get('/api/log/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body.data).to.have.property('total');
                    done();
                });
        });
    });

    describe('Validation Tests', () => {
        it('should reject account creation with invalid email', (done) => {
            request(app)
                .post('/api/account/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    email: 'invalid-email',
                    accountName: 'Test Account'
                })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    expect(res.body).to.have.property('message', 'Invalid Data');
                    done();
                });
        });

        it('should reject destination with invalid URL', (done) => {
            request(app)
                .post('/api/destination/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accountId: accountId,
                    url: 'not-a-valid-url',
                    httpMethod: 'POST',
                    headers: {}
                })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', false);
                    done();
                });
        });
    });

    describe('Health Check', () => {
        it('should return healthy status', (done) => {
            request(app)
                .get('/health')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success', true);
                    expect(res.body).to.have.property('status', 'OK');
                    done();
                });
        });
    });
});

