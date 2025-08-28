// routes/auth.js - Authentication Router
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, header, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { userQueries } from '../db.js';
import { calculatePromptScore } from '../utils/scoring.js';


const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name is required')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Middleware to authenticate JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userQueries.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Register endpoint
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await userQueries.create(email, hashedPassword, name);

    // Generate token
    const token = generateToken(newUser.id);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await userQueries.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Profile endpoint
// router.get('/profile', authenticateToken, async (req, res) => {
//   try {
//     const user = await userQueries.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }
//     res.json({
//       success: true,
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name
//       }
//     });
//   } catch (error) {
//     console.error('Profile fetch error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userQueries.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,   // <-- add this
        is_active: user.is_active  // optional if you want
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// In /workspaces/All_front/backend/routes/auth.js
<<<<<<< HEAD
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Replace or update your best_prompt endpoint
router.post('/best_prompt', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Step 1: Generate a response for the original prompt
    const originalCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: "Vous êtes un assistant médical qui répond aux questions des patients en français. Donnez des réponses concises et informatifs."},
        {role: "user", content: prompt}
      ],
      max_tokens: 300
    });
    
    const originalResponse = originalCompletion.choices[0].message.content;
    const originalScore = calculatePromptScore(prompt, originalResponse);

// Then replace the hardcoded scores with calculated ones:    
    // Step 2: Generate an optimized prompt version
    const promptOptimizerCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: "Vous êtes un expert qui reformule les questions médicales pour les rendre plus précises. Reformulez la question de l'utilisateur pour qu'elle soit plus spécifique et médicalement pertinente. Donnez uniquement la question reformulée, sans explications."},
        {role: "user", content: prompt}
      ],
      max_tokens: 100
    });
    
    const optimizedPrompt = promptOptimizerCompletion.choices[0].message.content;
    
    // Step 3: Generate a response for the optimized prompt
    const optimizedCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: "Vous êtes un médecin expert qui répond aux questions des patients en français. Donnez des réponses concises, précises et informatives."},
        {role: "user", content: optimizedPrompt}
      ],
      max_tokens: 300
    });
    
    const optimizedResponse = optimizedCompletion.choices[0].message.content;
    const optimizedScore = calculatePromptScore(optimizedPrompt, optimizedResponse);
    
    // Return data in the expected format
    res.json({
      original: {
        prompt: prompt,
        response: originalResponse,
        score: originalScore
      },
      optimized: {
        prompt: optimizedPrompt,
        response: optimizedResponse,
        score: optimizedScore
      }
    });
    
  } catch (error) {
    console.error('Error optimizing prompt:', error);
    res.status(500).json({ 
      message: 'Error optimizing prompt',
      error: error.message 
    });
  }
});
=======
// Replace or modify your existing best_prompt endpoint
// router.post('/best_prompt', authenticateToken, async (req, res) => {
//   try {
//     console.log("Best prompt optimization completed successfully.", {
//       body: req.body,
//       headers: req.headers,
//       method: req.method
//     });

//     const { prompt } = req.body;

//     if (!prompt) {
//       return res.status(400).json({ error: 'Prompt is required' });
//     }

//     // Generate a response for the original prompt
//     // This is simplified - in production you'd call your AI service
//     const originalResponse = "Voici une réponse générique pour: " + prompt;
//     const originalScore = 0.65; // Example score

//     // Create an optimized version (simplified)
//     const optimizedPrompt = "Quels sont mes symptômes si " + prompt.replace('?', '').trim() + "?";
//     const optimizedResponse = "Voici une réponse optimisée pour votre question sur la fièvre.";
//     const optimizedScore = 0.85; // Example score

//     // Return the nested structure expected by the frontend
//     res.json({
//       original: {
//         prompt: prompt,
//         response: originalResponse,
//         score: originalScore
//       },
//       optimized: {
//         prompt: optimizedPrompt,
//         response: optimizedResponse,
//         score: optimizedScore
//       }
//     });
//   } catch (error) {
//     console.error('Error optimizing prompt:', error);
//     res.status(500).json({ message: 'Error optimizing prompt' });
//   }
// });
>>>>>>> 47b867a (update)

export default router;