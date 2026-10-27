const express = require('express')
const { registerUser, loginUser } = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

// Register user
router.post('/register', registerUser)

// Login user
router.post('/login', loginUser)

// Protected test route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'You have access to the protected route',
    user: req.user
  })
})

module.exports = router