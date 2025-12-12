const { body } = require('express-validator');

const signupRules = () => [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min length 6'),
  body('role').isIn(['citizen', 'authority', 'admin']).withMessage('Invalid role'),
];

const loginRules = () => [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required'),
  body('role').isIn(['citizen', 'authority', 'admin']).withMessage('Invalid role'),
];

module.exports = { signupRules, loginRules };
