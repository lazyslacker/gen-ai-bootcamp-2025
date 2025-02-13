const { body, param, query, validationResult } = require('express-validator');

// Helper to process validation results
const validate = validations => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    };
};

// Validation rules for each endpoint
const rules = {
    // Words
    getWords: [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
    ],
    getWord: [
        param('id').isInt({ min: 1 }).toInt()
    ],

    // Groups
    getGroups: [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
    ],
    getGroup: [
        param('id').isInt({ min: 1 }).toInt()
    ],
    getGroupWords: [
        param('id').isInt({ min: 1 }).toInt()
    ],

    // Study Sessions
    getStudySession: [
        param('id').isInt({ min: 1 }).toInt()
    ],
    recordWordReview: [
        param('id').isInt({ min: 1 }).toInt(),
        param('wordId').isInt({ min: 1 }).toInt(),
        body('correct').isBoolean()
    ],

    // System
    vacuum: [
        body('confirm')
            .optional()
            .isBoolean()
            .withMessage('Confirm must be a boolean')
    ],
    resetHistory: [
        body('confirm')
            .isBoolean()
            .withMessage('Confirm field is required and must be true')
            .equals('true')
            .withMessage('Confirm must be true to reset history')
    ],
    fullReset: [
        body('confirm')
            .isBoolean()
            .withMessage('Confirm field is required and must be true')
            .equals('true')
            .withMessage('Confirm must be true to perform full reset')
    ]
};

module.exports = {
    validate,
    rules
}; 