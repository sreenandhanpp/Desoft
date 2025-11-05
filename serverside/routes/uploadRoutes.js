const express = require('express');
const multer = require('multer');
const upload = require('../middlewares/files');
const { uploadFiles } = require('../controllers/uploadController');
const router = express.Router();

router.post('/uploads', upload.array('file', 5), uploadFiles);

module.exports = router;