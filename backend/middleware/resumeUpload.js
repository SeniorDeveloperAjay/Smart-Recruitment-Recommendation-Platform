const multer = require('multer')
const path = require('path')

const storage = multer.memoryStorage()

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase()

  if (
    file.mimetype === 'application/pdf' &&
    extension === '.pdf'
  ) {
    return callback(null, true)
  }

  callback(new Error('Only PDF resume files are allowed'))
}

const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
})

module.exports = resumeUpload