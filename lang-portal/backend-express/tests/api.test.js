const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const db = require('../db');

describe('Language Learning API', () => {
    // Words endpoints
    describe('GET /api/words', () => {
        it('should return paginated list of words', async () => {
            const res = await request(app)
                .get('/api/words')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body).to.have.property('pagination');
            expect(res.body.pagination).to.have.property('current_page');
            expect(res.body.pagination).to.have.property('total_pages');
        });
    });

    // Groups endpoints
    describe('GET /api/groups', () => {
        it('should return a list of groups', async () => {
            const res = await request(app)
                .get('/api/groups')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body.items).to.be.an('array');
        });
    });

    // Study sessions endpoints
    describe('POST /api/study_sessions', () => {
        it('should create a new study session', async () => {
            const res = await request(app)
                .post('/api/study_sessions')
                .send({
                    group_id: 1,
                    study_activity_id: 1
                })
                .expect('Content-Type', /json/)
                .expect(201);

            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('group_id');
            expect(res.body).to.have.property('created_at');
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app)
                .post('/api/study_sessions')
                .send({})
                .expect('Content-Type', /json/)
                .expect(400);

            expect(res.body).to.have.property('error');
            expect(res.body).to.have.property('required');
        });
    });
}); 