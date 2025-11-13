const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const originalName = file.originalname.replace(/\s+/g, '_');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);

    const filename = `${nameWithoutExt}-${timestamp}-${random}${ext}`;
    cb(null, filename);
    console.log("Uploading file:", filename);
  }
});

// File type filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    console.log("Supported format:", file.mimetype);
    cb(null, true);
  } else {
    console.log("Unsupported format:", file.mimetype);
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

// Multer configuration
const multipleFileUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 50, // 50MB
    files: 8, // Max 8 files
  },
});

// Error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 400,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 400,
        message: 'Too many files. Maximum 8 files allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 400,
        message: 'Unexpected file field.'
      });
    }
  }
  next(err);
};

module.exports = {
  multipleFileUpload,
  handleMulterError
};
