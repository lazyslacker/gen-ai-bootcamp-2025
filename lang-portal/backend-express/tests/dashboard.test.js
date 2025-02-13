const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const db = require('../db');

describe('Dashboard API', () => {
    describe('GET /api/dashboard/last_study_session', () => {
        it('should return the last study session', async () => {
            const res = await request(app)
                .get('/api/dashboard/last_study_session')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('session');
            if (res.body.session) {
                expect(res.body.session).to.have.property('id');
                expect(res.body.session).to.have.property('group_id');
                expect(res.body.session).to.have.property('group_name');
                expect(res.body.session).to.have.property('activity_id');
                expect(res.body.session).to.have.property('activity_name');
                expect(res.body.session).to.have.property('review_items_count');
            }
        });
    });

    describe('GET /api/dashboard/study_progress', () => {
        it('should return study progress for all groups', async () => {
            const res = await request(app)
                .get('/api/dashboard/study_progress')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body.items).to.be.an('array');
            if (res.body.items.length > 0) {
                const group = res.body.items[0];
                expect(group).to.have.property('group_id');
                expect(group).to.have.property('group_name');
                expect(group).to.have.property('total_words');
                expect(group).to.have.property('mastered_words');
                expect(group).to.have.property('progress_percentage');
            }
        });
    });

    describe('GET /api/dashboard/quick-stats', () => {
        it('should return quick statistics', async () => {
            const res = await request(app)
                .get('/api/dashboard/quick-stats')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('total_sessions');
            expect(res.body).to.have.property('total_reviews');
            expect(res.body).to.have.property('accuracy_percentage');
            expect(res.body).to.have.property('total_words');
        });
    });
}); 