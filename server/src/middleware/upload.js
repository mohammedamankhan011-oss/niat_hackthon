import multer from 'multer';
import { config } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Memory storage only: images are never written to disk or stored anywhere.
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxBytes, files: 1, fields: 10 },
  fileFilter(_req, file, cb) {
    if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(AppError.badRequest('Only JPEG, PNG or WEBP images are allowed', 'INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
});

// The declared mimetype comes from the client, so confirm the real file type
// from its first bytes.
function matchesSignature(buffer, mimetype) {
  if (!buffer || buffer.length < 12) return false;
  switch (mimetype) {
    case 'image/jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    default:
      return false;
  }
}

export function uploadScanImage(req, res, next) {
  multerUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError(413, 'Image is too large. The maximum size is 8 MB.', 'FILE_TOO_LARGE'));
        return;
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        next(AppError.badRequest('Upload a single image in the "image" field', 'INVALID_UPLOAD'));
        return;
      }
      next(AppError.badRequest(err.message, 'INVALID_UPLOAD'));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    if (req.file && !matchesSignature(req.file.buffer, req.file.mimetype)) {
      req.file = undefined;
      next(AppError.badRequest('The file is not a valid JPEG, PNG or WEBP image', 'INVALID_FILE_TYPE'));
      return;
    }
    next();
  });
}
