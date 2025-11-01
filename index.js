import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db.js';
import router from './routes/authRoutes.js';
dotenv.config(); 

const app = express();
const PORT = process.env.PORT;

// connect-pg-simple setup
const PgSession = connectPgSimple(session);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// store session in postgreSQL session table
app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
    }),
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  })
);


app.use('/', router)

//checking if the database is really connected
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL successfully');

    // Optional: release the client if you're just testing the connection
    client.release();
  } catch (err) {
    console.error(' Database connection error:', err);
  }
};
//calling the function
connectDB();


//middleware to check if the user exist
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
} 



// home route
app.get('/', (req, res) => {
  res.render('index');
});

// student dashboar route
app.get('/student/dashboard', isAuthenticated, (req, res)=>{
  if (req.session.user.role !== 'student') return res.status(403).send('Access denied');
  res.render('student-dashboard', {user: req.session.user});
})

// lecturer dashbaord route
app.get('/lecturer/dashboard', isAuthenticated, (req, res)=>{
  if (req.session.user.role !== 'lecturer') return res.status(403).send('Access denied');
  res.render('lecturer-dashboard', {user: req.session.user});
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});