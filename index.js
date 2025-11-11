import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db.js';
import routerAuth from './routes/authRoutes.js';
import routerUpload from './routes/uploadRoutes.js';
import { isAuthenticated } from './routes/middlewareRoutes.js';
import flash from 'connect-flash';

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
    secret: 'process.env.SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  })
);

// switch that activate the flash messages
// app.use(flash());

// making flash available for ejs file..like a global middleware for flash
// app.use((req, res, next) => {
//   const successMessages = req.flash('success_msg');
//   const errorMessages = req.flash('error_msg');

//   res.locals.success_msg = successMessages.length > 0 ? successMessages[0] : null;
//   res.locals.error_msg = errorMessages.length > 0 ? errorMessages[0] : null;
//   next();
// });



// Use the imported routers
app.use('/', routerAuth);
app.use('/', routerUpload);



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