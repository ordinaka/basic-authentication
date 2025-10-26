import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';

const router = express.Router();

dotenv.config();



router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/login', (req, res) => {
  res.render('login');
});     



// router for the register authentication..
router.post('/register', async (req, res)=>{
  const {username, password} = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [
      username,
      hashedPassword
    ])

    res.render('dashboard');

  } catch (error) {
    console.log(error);
    res.send("error registring user")
  }
})

// router for login authentication
router.post('/login', async (req, res) => {
  const {username, password} = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [username]);

    const user = result.rows[0];
    
    if(user && (await bcrypt.compare(password, user.password))) {
      res.render('dashboard');
    } else {
      res.send("invalid username or password");
    }
  } catch (error) {
    console.log(error);
    res.send("error logging in")
  }
})

export default router;