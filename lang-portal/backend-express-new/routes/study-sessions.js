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

module.exports = router; 