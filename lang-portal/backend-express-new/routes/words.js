const express = require('express');
const router = express.Router();
const db = require('../db');
const { validate, rules } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Word:
 *       type: object
 *       required:
 *         - japanese
 *         - romaji
 *         - english
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the word
 *         japanese:
 *           type: string
 *           description: The Japanese text (kanji/kana)
 *         romaji:
 *           type: string
 *           description: Romanized Japanese text
 *         english:
 *           type: string
 *           description: English translation
 *         parts:
 *           type: string
 *           description: JSON string of word attributes/tags
 *         times_reviewed:
 *           type: integer
 *           description: Number of times this word has been reviewed
 *         times_correct:
 *           type: integer
 *           description: Number of times this word was correctly answered
 */

/**
 * @swagger
 * /api/words:
 *   get:
 *     summary: Returns a paginated list of words
 *     description: Retrieve a list of Japanese words with their translations and review statistics
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A paginated list of words
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Word'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/', validate(rules.getWords), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const words = await db.asyncAll(`
            SELECT w.*, 
                COUNT(DISTINCT wri.study_session_id) as times_reviewed,
                SUM(CASE WHEN wri.correct THEN 1 ELSE 0 END) as times_correct
            FROM words w
            LEFT JOIN word_review_items wri ON w.id = wri.word_id
            GROUP BY w.id
            ORDER BY w.${req.query.sort_by}
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const total = await db.asyncGet('SELECT COUNT(*) as count FROM words');

        res.json({
            items: words.map(({ id, ...rest }) => ({
                kanji: rest.kanji,
                romaji: rest.romaji,
                english: rest.english,
                correct: rest.times_correct,
                wrong: rest.times_reviewed - rest.times_correct
            })), // Exclude the id property
            pagination: {
                page,
                limit,
                total: total.count
            }
        });
    } catch (err) {
        console.error('Error getting words:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/words/{id}:
 *   get:
 *     summary: Get a word by ID
 *     description: Retrieve detailed information about a specific word, including its groups
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Word ID
 *     responses:
 *       200:
 *         description: Word details with associated groups
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Word'
 *                 - type: object
 *                   properties:
 *                     groups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *       404:
 *         description: Word not found
 */
router.get('/:id', validate(rules.getWord), async (req, res) => {
    try {
        const word = await db.asyncGet(`
            SELECT w.*, 
                COUNT(DISTINCT wri.study_session_id) as times_reviewed,
                SUM(CASE WHEN wri.correct THEN 1 ELSE 0 END) as times_correct
            FROM words w
            LEFT JOIN word_review_items wri ON w.id = wri.word_id
            WHERE w.id = ?
            GROUP BY w.id
        `, [req.params.id]);

        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }

        // Get groups this word belongs to
        const groups = await db.asyncAll(`
            SELECT g.*
            FROM groups g
            JOIN words_groups wg ON g.id = wg.group_id
            WHERE wg.word_id = ?
        `, [req.params.id]);

        word.groups = groups;
        res.json(word);
    } catch (err) {
        console.error('Error getting word:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 