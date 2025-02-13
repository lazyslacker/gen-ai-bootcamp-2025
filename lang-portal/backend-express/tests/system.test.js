const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');
const db = require('../db');

describe('System API', () => {
    describe('POST /api/reset_history', () => {
        it('should clear study history', async () => {
            const res = await request(app)
                .post('/api/reset_history')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('message');
            expect(res.body.message).to.equal('Study history cleared successfully');

            // Verify database state
            const sessions = await db.asyncAll('SELECT * FROM study_sessions');
            expect(sessions).to.have.lengthOf(0);

            const reviews = await db.asyncAll('SELECT * FROM word_review_items');
            expect(reviews).to.have.lengthOf(0);
        });
    });

    describe('POST /api/full_reset', () => {
        it('should reset entire database', async () => {
            const res = await request(app)
                .post('/api/full_reset')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(res.body).to.have.property('message');
            expect(res.body.message).to.equal('Database reset successfully');

            // Verify database state
            const tables = ['words', 'groups', 'words_groups', 'study_sessions', 
                          'study_activities', 'word_review_items'];
            
            for (const table of tables) {
                const count = await db.asyncGet(`SELECT COUNT(*) as count FROM ${table}`);
                expect(count.count).to.equal(0);
            }
        });
    });
}); 