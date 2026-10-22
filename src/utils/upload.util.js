const fs = require("fs");
const path = require("path");

// Uploads live OUTSIDE /public, so files are only reachable through the
// authenticated download route (members of the project only).
const UPLOAD_DIR = path.join(__dirname, "..", "..", "storage", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Deletes files multer already saved (used when validation or the service fails)
async function removeFiles(files) {
  await Promise.all(
    (files || []).map((file) => fs.promises.unlink(file.path).catch(() => {})),
  );
}

// Deletes files by their stored names (used when a task / attachment is deleted)
async function removeStored(storedNames) {
  await Promise.all(
    storedNames.map((name) =>
      fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(name))).catch(() => {}),
    ),
  );
}

module.exports = { UPLOAD_DIR, removeFiles, removeStored };
