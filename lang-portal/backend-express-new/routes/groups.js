const express = require('express');
const router = express.Router();
const db = require('../db');
const { validate, rules } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the group
 *         name:
 *           type: string
 *           description: The name of the word group
 *         word_count:
 *           type: integer
 *           description: Number of words in this group
 */

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Returns a paginated list of groups
 *     description: Retrieve a list of word groups with their word counts
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
 *         description: A paginated list of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
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
router.get('/', validate(rules.getGroups), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const groups = await db.asyncAll(`
            SELECT g.*, COUNT(DISTINCT wg.word_id) as word_count
            FROM groups g
            LEFT JOIN words_groups wg ON g.id = wg.group_id
            GROUP BY g.id
            ORDER BY g.name
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const total = await db.asyncGet('SELECT COUNT(*) as count FROM groups');

        res.json({
            items: groups,
            pagination: {
                page,
                limit,
                total: total.count
            }
        });
    } catch (err) {
        console.error('Error getting groups:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get a group by ID
 *     description: Retrieve detailed information about a specific group
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: Group not found
 */
router.get('/:id', validate(rules.getGroup), async (req, res) => {
    try {
        const group = await db.asyncGet('SELECT * FROM groups WHERE id = ?', [req.params.id]);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json(group);
    } catch (err) {
        console.error('Error getting group:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/groups/{id}/words:
 *   get:
 *     summary: Get words in a group
 *     description: Retrieve all words that belong to a specific group
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: List of words in the group
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Word'
 *       404:
 *         description: Group not found
 */
router.get('/:id/words', validate(rules.getGroupWords), async (req, res) => {
    try {
        const words = await db.asyncAll(`
            SELECT w.*
            FROM words w
            JOIN words_groups wg ON w.id = wg.word_id
            WHERE wg.group_id = ?
            ORDER BY w.japanese
        `, [req.params.id]);
        res.json(words);
    } catch (err) {
        console.error('Error getting group words:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 