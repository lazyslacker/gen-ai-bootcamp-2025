const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('API Endpoints', () => {
  let studySessionId;

  describe('Dashboard Endpoints', () => {
    it('GET /api/dashboard/last_study_session', async () => {
      const res = await request(app)
        .get('/api/dashboard/last_study_session')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('id');
      expect(res.body).to.have.property('group_id');
      expect(res.body).to.have.property('created_at');
      expect(res.body).to.have.property('study_activity_id');
      expect(res.body).to.have.property('group_name');
    });

    it('GET /api/dashboard/study_progress', async () => {
      const res = await request(app)
        .get('/api/dashboard/study_progress')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('total_words_studied');
      expect(res.body).to.have.property('total_available_words');
    });

    it('GET /api/dashboard/quick-stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/quick-stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success_rate');
      expect(res.body).to.have.property('total_study_sessions');
    });
  });

  describe('Study Sessions', () => {
    beforeEach(async () => {
      // Create a new study session for each test
      const res = await request(app)
        .post('/api/study-sessions')
        .send({
          group_id: 1,
          study_activity_id: 1
        });
      studySessionId = res.body.id;
    });

    it('POST /api/study-sessions', async () => {
      const res = await request(app)
        .post('/api/study-sessions')
        .send({
          group_id: 1,
          study_activity_id: 1
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).to.have.property('id');
    });

    it('POST /api/study-sessions/:id/words/:word_id/review', async () => {
      const res = await request(app)
        .post(`/api/study-sessions/${studySessionId}/words/1/review`)
        .send({
          correct: true
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('word_id', 1);
      expect(res.body).to.have.property('study_session_id', studySessionId);
      expect(res.body).to.have.property('correct', true);
      expect(res.body).to.have.property('created_at');
    });
  });

  describe('System Operations', () => {
    it('POST /api/reset_history', async () => {
      const res = await request(app)
        .post('/api/reset_history')
        .send({ confirm: true })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message');
    });

    // Test full_reset last since it clears all data
    it('POST /api/full_reset', async () => {
      const res = await request(app)
        .post('/api/full_reset')
        .send({ confirm: true })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message');
    });
  });
});