const multer = require("multer");

// get file extension. Ex: DOMException, png, jpeg...
const getFileType = (file) => {
  const mimeType = file.mimetype.split("/");
  return mimeType[mimeType.length - 1];
};

const fileNameGenerator = (req, file, cb) => {
  const file_name = Date.now() + "-" + file.originalname;
  cb(null, file_name);
};

// filter uploaded files - check if they are images and videos
const fileFilter = (req, file, cb) => {
  const file_type = getFileType(file);

  const allowed_mime_types =
    /jpeg|jpg|png|mp4|mov|gif|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.openxmlformats-officedocument.presentationml.presentation|vnd.ms-excel|pdf|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.oasis.opendocument.text/;

  const passed = allowed_mime_types.test(file_type);

  if (passed) {
    return cb(null, true);
  }

  req.fileValidationError = "Invalid File!";
  return cb(new Error("Invalid File!"), false);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // images folder has to be created manually
  },
  filename: fileNameGenerator,
});

exports.filesUpload = multer({ storage: storage, fileFilter });
