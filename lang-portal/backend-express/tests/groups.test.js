const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const db = require('../db');

describe('Groups API', () => {
    describe('GET /api/groups/:id/study_sessions', () => {
        it('should return paginated study sessions for a group', async () => {
            const res = await request(app)
                .get('/api/groups/1/study_sessions')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body).to.have.property('total');
            expect(res.body).to.have.property('page');
            expect(res.body).to.have.property('per_page');
            expect(res.body).to.have.property('total_pages');
            expect(res.body.items).to.be.an('array');

            if (res.body.items.length > 0) {
                const session = res.body.items[0];
                expect(session).to.have.property('id');
                expect(session).to.have.property('group_id');
                expect(session).to.have.property('group_name');
                expect(session).to.have.property('activity_id');
                expect(session).to.have.property('activity_name');
                expect(session).to.have.property('review_items_count');
            }
        });

        it('should handle non-existent group ID', async () => {
            await request(app)
                .get('/api/groups/999/study_sessions')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(res => {
                    expect(res.body.items).to.have.lengthOf(0);
                    expect(res.body.total).to.equal(0);
                });
        });
    });

    describe('GET /api/groups', () => {
        it('should return all groups', async () => {
            const res = await request(app)
                .get('/api/groups')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body.items).to.be.an('array');
        });
    });

    describe('GET /api/groups/:id', () => {
        it('should return a specific group', async () => {
            const res = await request(app)
                .get('/api/groups/1')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('id');
            expect(res.body).to.have.property('name');
        });
    });

    describe('GET /api/groups/:id/words', () => {
        it('should return words in a group', async () => {
            const res = await request(app)
                .get('/api/groups/1/words')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body.items).to.be.an('array');
            if (res.body.items.length > 0) {
                const word = res.body.items[0];
                expect(word).to.have.property('japanese');
                expect(word).to.have.property('romaji');
                expect(word).to.have.property('english');
                expect(word).to.have.property('parts');
            }
        });

        it('should handle non-existent group ID', async () => {
            const res = await request(app)
                .get('/api/groups/999/words')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('items');
            expect(res.body.items).to.have.lengthOf(0);
        });
    });
}); 