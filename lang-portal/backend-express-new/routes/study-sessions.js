const express = require('express');
const router = express.Router();
const db = require('../db');
const { validate, rules } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     StudySession:
 *       type: object
 *       required:
 *         - group_id
 *         - study_activity_id
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the study session
 *         group_id:
 *           type: integer
 *           description: ID of the word group being studied
 *         study_activity_id:
 *           type: integer
 *           description: ID of the study activity being used
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the study session was created
 *         group_name:
 *           type: string
 *           description: Name of the word group (included in responses)
 */

/**
 * @swagger
 * /api/study-sessions/{id}:
 *   get:
 *     summary: Get a study session by ID
 *     description: Retrieve detailed information about a specific study session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study Session ID
 *     responses:
 *       200:
 *         description: Study session details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudySession'
 *       404:
 *         description: Study session not found
 */
router.get('/:id', validate(rules.getStudySession), async (req, res) => {
    try {
        const session = await db.asyncGet(`
            SELECT ss.*, g.name as group_name, sa.name as activity_name
            FROM study_sessions ss
            JOIN groups g ON ss.group_id = g.id
            JOIN study_activities sa ON ss.study_activity_id = sa.id
            WHERE ss.id = ?
        `, [req.params.id]);

        if (!session) {
            return res.status(404).json({ error: 'Study session not found' });
        }

        res.json(session);
    } catch (err) {
        console.error('Error getting study session:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/study-sessions/{id}/words/{wordId}/review:
 *   post:
 *     summary: Record a word review
 *     description: Record whether a word was correctly answered in a study session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study Session ID
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Word ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correct
 *             properties:
 *               correct:
 *                 type: boolean
 *                 description: Whether the word was correctly answered
 *     responses:
 *       200:
 *         description: Review recorded successfully
 *       404:
 *         description: Study session or word not found
 *       500:
 *         description: Error recording review
 */
router.post('/:id/words/:wordId/review', validate(rules.recordWordReview), async (req, res) => {
    try {
        const { correct } = req.body;
        if (typeof correct !== 'boolean') {
            return res.status(400).json({ error: 'Correct field must be a boolean' });
        }

        await db.asyncRun(`
            INSERT INTO word_review_items (word_id, study_session_id, correct)
            VALUES (?, ?, ?)
        `, [req.params.wordId, req.params.id, correct]);

        res.json({ message: 'Review recorded successfully' });
    } catch (err) {
        console.error('Error recording review:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/study-sessions
router.post('/', async (req, res) => {
    try {
        const { group_id, study_activity_id } = req.body;

        if (!group_id || !study_activity_id) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['group_id', 'study_activity_id']
            });
        }

        const result = await db.asyncRun(
            'INSERT INTO study_sessions (group_id, study_activity_id) VALUES (?, ?)',
            [group_id, study_activity_id]
        );

        res.status(201).json({
            id: result.lastID,
            group_id,
            study_activity_id
        });
    } catch (err) {
        console.error('Error creating study session:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/study-sessions/:id/words/:word_id/review
router.post('/:id/words/:word_id/review', async (req, res) => {
    try {
        const { id, word_id } = req.params;
        const { correct } = req.body;

        if (typeof correct !== 'boolean') {
            return res.status(400).json({
                error: 'Invalid field type',
                required: { correct: 'boolean' }
            });
        }

        // Validate session exists
        const session = await db.asyncGet(
            'SELECT id FROM study_sessions WHERE id = ?',
            [id]
        );

        if (!session) {
            return res.status(404).json({
                error: 'Study session not found',
                session_id: id
            });
        }

        // Validate word exists
        const word = await db.asyncGet(
            'SELECT id FROM words WHERE id = ?',
            [word_id]
        );

        if (!word) {
            return res.status(404).json({
                error: 'Word not found',
                word_id: word_id
            });
        }

        await db.asyncRun(
            'INSERT INTO word_review_items (word_id, study_session_id, correct) VALUES (?, ?, ?)',
            [word_id, id, correct]
        );

        res.status(201).json({
            success: true,
            word_id: parseInt(word_id),
            study_session_id: parseInt(id),
            correct,
            created_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error recording review:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/study-sessions:
 *   get:
 *     summary: Get study sessions
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 10;
        const offset = (page - 1) * perPage;
        const groupId = req.query.group_id;

        let query = `
            SELECT 
                ss.id,
                ss.group_id,
                g.name as group_name,
                ss.study_activity_id as activity_id,
                sa.name as activity_name,
                ss.created_at as start_time,
                ss.created_at as end_time,
                COUNT(wri.id) as review_items_count
            FROM study_sessions ss
            JOIN groups g ON ss.group_id = g.id
            JOIN study_activities sa ON ss.study_activity_id = sa.id
            LEFT JOIN word_review_items wri ON ss.id = wri.study_session_id
        `;

        const params = [];

        if (groupId) {
            query += ' WHERE ss.group_id = ?';
            params.push(groupId);
        }

        query += `
            GROUP BY ss.id
            ORDER BY ss.created_at DESC
            LIMIT ? OFFSET ?
        `;
        params.push(perPage, offset);

        const sessions = await db.asyncAll(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as count FROM study_sessions';
        if (groupId) {
            countQuery += ' WHERE group_id = ?';
        }
        const total = await db.asyncGet(countQuery, groupId ? [groupId] : []);

        res.json({
            items: sessions,
            total: total.count,
            page,
            per_page: perPage,
            total_pages: Math.ceil(total.count / perPage)
        });
    } catch (err) {
        console.error('Error getting study sessions:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add OPTIONS handler for the reset endpoint
router.options('/reset', (req, res) => {
  res.status(200).end();
});

router.post('/reset', async (req, res) => {
  try {
    await db.asyncRun('BEGIN TRANSACTION');
    await db.asyncRun('DELETE FROM word_review_items');
    await db.asyncRun('DELETE FROM study_sessions');
    await db.asyncRun('COMMIT');
    res.json({ message: 'Study history reset successfully' });
  } catch (err) {
    await db.asyncRun('ROLLBACK');
    console.error('Error resetting study history:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 