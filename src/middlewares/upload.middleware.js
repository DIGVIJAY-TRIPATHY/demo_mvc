const crypto = require("crypto");
const multer = require("multer");
const { UPLOAD_DIR } = require("../utils/upload.util");
const { HttpError } = require("../utils/http-error");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

// The extension comes from the mimetype, never from the client's file name
const ALLOWED_TYPES = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, crypto.randomUUID() + ALLOWED_TYPES[file.mimetype]),
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) {
      return cb(new HttpError(400, "Only images, PDF, TXT and CSV files are allowed"));
    }
    cb(null, true);
  },
});

const multerMessages = {
  LIMIT_FILE_SIZE: "Each file must be 5 MB or smaller",
  LIMIT_FILE_COUNT: `You can upload at most ${MAX_FILES} files at once`,
  LIMIT_UNEXPECTED_FILE: "Unexpected file field",
};

// Field name in the form: "attachments"
function uploadAttachments(req, res, next) {
  upload.array("attachments", MAX_FILES)(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return next(new HttpError(400, multerMessages[error.code] || "Upload failed"));
    }
    next(error);
  });
}

module.exports = { uploadAttachments };
