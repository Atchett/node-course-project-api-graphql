const multer = require("multer");
const { nanoid } = require("nanoid");

// storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${nanoid()}-${file.originalname}`);
  },
});

// filter
const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"];
const fileFilter = (req, file, cb) => {
  const allowedFile = allowedMimeTypes.includes(file.mimetype);
  cb(null, allowedFile);
};

exports.useMulter = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
}).single("image");
