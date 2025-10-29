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
  const {name, email, password, role} = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, role', [
      name,
      email,
      hashedPassword,
      role
    ])
    
    req.session.user = result.rows[0];

    if (role === "student") return res.redirect('/student/dashboard');
    if (role === "lecturer") return res.redirect('/lecturer/dashboard');

  } catch (error) {
    console.log(error);
    res.send("error registering user")
  }
})

// router for login authentication
router.post('/login', async (req, res) => {
  const {email, password} = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    const user = result.rows[0];
    console.log(user);
    
    req.session.user = {id: user.id, name: user.name, role: user.role};

    if(user && (await bcrypt.compare(password, user.password_hash))) {
      if (user.role === "student") return res.redirect('/student/dashboard');
      if (user.role === "lecturer") return res.redirect('/lecturer/dashboard');
    } else {
      res.send("invalid username or password");
    }
  } catch (error) {
    console.log(error);
    res.send("error logging in")
  }
})

// logout route..
router.get('/logout', (req, res)=>{
  req.session.destroy(()=>{
    res.redirect('/login');
  })
})


export default router;