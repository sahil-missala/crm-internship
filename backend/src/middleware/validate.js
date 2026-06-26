const { body, validationResult } = require('express-validator');

const validateEnquiry = [
  body('customer_name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  
  body('phone')
    .trim()
    .isNumeric()
    .withMessage('Phone number must contain digits only')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be exactly 10 digits'),
  
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Invalid email address format'),
  
  body('source')
    .isIn(['Walk-in', 'Phone Call', 'WhatsApp', 'Website', 'Reference', 'Other'])
    .withMessage('Invalid enquiry source value'),
  
  body('trip_type')
    .isIn(['One-Way Drop', 'Round Trip', 'Airport Transfer', 'Outstation', 'Hill Station', 'Custom'])
    .withMessage('Invalid trip type value'),
  
  body('pickup_location')
    .trim()
    .notEmpty()
    .withMessage('Pickup location is required'),
  
  body('drop_location')
    .trim()
    .notEmpty()
    .withMessage('Drop location is required'),
  
  body('travel_date')
    .notEmpty()
    .withMessage('Travel date is required')
    .custom((value) => {
      const todayStr = new Date().toISOString().split('T')[0];
      if (value < todayStr) {
        throw new Error('Travel date cannot be in the past');
      }
      return true;
    }),
  
  body('return_date')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      if (req.body.trip_type === 'Round Trip' && !value) {
        throw new Error('Return date is required for Round Trips');
      }
      if (value && value < req.body.travel_date) {
        throw new Error('Return date cannot be before travel date');
      }
      return true;
    }),
  
  body('passengers')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of passengers must be between 1 and 20'),
  
  body('special_requirements')
    .optional()
    .trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateEnquiry
};
