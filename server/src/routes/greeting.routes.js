const { Router } = require('express');
const greetingController = require('../controllers/greeting.controller');
const { validateCountryCode, validateCreateGreeting, validateUpdateGreeting, validateQueryParams } = require('../validators/greeting.validators');
const authMiddleware = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');

const router = Router();

router.get('/', validateQueryParams, greetingController.getAllGreetings);

router.get('/:countryCode', validateCountryCode, greetingController.getGreetingByCountry);

router.post('/', authMiddleware, requireRole('admin'), validateCreateGreeting, greetingController.createGreeting);

router.put('/:countryCode', authMiddleware, requireRole('admin'), validateCountryCode, validateUpdateGreeting, greetingController.updateGreeting);

router.delete('/:countryCode', authMiddleware, requireRole('admin'), validateCountryCode, greetingController.deleteGreeting);

router.patch('/:countryCode/toggle', authMiddleware, requireRole('admin'), validateCountryCode, greetingController.toggleGreetingStatus);

module.exports = router;