const express = require('express');
const router = express.Router();
const configController = require('./config.controller');

router.get('/', configController.getSettings);
router.post('/', configController.updateSettings);
router.post('/verify-pin', configController.verifyPin);
router.get('/backup', configController.downloadBackup);
router.post('/restore', configController.restoreBackup);
router.post('/change-pin', configController.changePin);

// Auth Routes
router.post('/login', configController.login);
router.post('/register', configController.register);

module.exports = router;
