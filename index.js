import express from 'express';
import dotenv from 'dotenv';
import ejs from 'ejs';
import bcrypt from 'bcrypt'
import { pool } from './db.js';
import router from './routes/authRoutes.js';
dotenv.config(); 

const app = express();
const PORT = process.env.PORT;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use('/', router)

//checking if the database is really connected
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully');

    // Optional: release the client if you're just testing the connection
    client.release();
  } catch (err) {
    console.error(' Database connection error:', err);
  }
};
//calling the function
connectDB();



app.get('/', (req, res) => {
  res.render('index');
});




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});