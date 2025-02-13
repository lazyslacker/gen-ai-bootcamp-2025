const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('API Tests', () => {
    describe('Groups API', () => {
        it('should return a paginated list of groups', async () => {
            const res = await request(app)
                .get('/api/groups')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body).to.have.property('pagination');
            expect(res.body.items).to.be.an('array');
            expect(res.body.items[0]).to.have.property('name');
        });

        it('should return a single group', async () => {
            const res = await request(app)
                .get('/api/groups/1')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('name');
        });
    });

    describe('Words API', () => {
        it('should return a paginated list of words', async () => {
            const res = await request(app)
                .get('/api/words')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body).to.have.property('pagination');
            expect(res.body.items).to.be.an('array');
            expect(res.body.items[0]).to.have.all.keys(
                'id', 'japanese', 'romaji', 'english', 'parts',
                'times_reviewed', 'times_correct'
            );
        });

        it('should return a single word with its groups', async () => {
            const res = await request(app)
                .get('/api/words/1')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('japanese');
            expect(res.body).to.have.property('groups');
            expect(res.body.groups).to.be.an('array');
        });
    });

    describe('Study Sessions API', () => {
        it('should return a study session', async () => {
            const res = await request(app)
                .get('/api/study-sessions/1')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('group_id');
            expect(res.body).to.have.property('study_activity_id');
        });

        it('should record a word review', async () => {
            const res = await request(app)
                .post('/api/study-sessions/1/words/1/review')
                .send({ correct: true })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('message');
        });
    });

    describe('Dashboard API', () => {
        it('should return last study session', async () => {
            const res = await request(app)
                .get('/api/dashboard/last_study_session')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('group_name');
            expect(res.body).to.have.property('activity_name');
        });

        it('should return study progress', async () => {
            const res = await request(app)
                .get('/api/dashboard/study_progress')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('total_words_studied');
            expect(res.body).to.have.property('total_available_words');
            expect(res.body.total_words_studied).to.be.a('number');
            expect(res.body.total_available_words).to.be.a('number');
        });
    });

    describe('System API', () => {
        it('should return system health status', async () => {
            const res = await request(app)
                .get('/api/system/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('status');
            expect(res.body).to.have.property('database');
            expect(res.body.status).to.equal('healthy');
        });

        it('should return system statistics', async () => {
            const res = await request(app)
                .get('/api/system/stats')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('words');
            expect(res.body).to.have.property('groups');
            expect(res.body).to.have.property('study_sessions');
            expect(res.body).to.have.property('reviews');
        });
    });
}); 