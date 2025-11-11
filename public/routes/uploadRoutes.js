import express from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { isAuthenticated, isStudent } from './middlewareRoutes.js';

// Since am using ESC not CJS so i have to import these..
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer storage as local disk (not cloud or aws)
const storage = multer.diskStorage({
  // destination where multer want to store the file
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/upload'));
  }, 

  // the filename of the document
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});


const upload = multer({ storage: storage });


// get the new-course page
router.get('/lecturer/dashboard/new-course', isAuthenticated, (req, res) => {
  res.render('new', {user: req.session.user})
})

// upload the created course
router.post('/lecturer/dashboard/new-course', isAuthenticated, async (req, res) => {
  const {course_code, course_title, year} = req.body;
  const lecturer_id = req.session.user.id;

  try {
    const exixtCourse = await pool.query(
      'SELECT * FROM courses WHERE course_code = $1', [
        course_code
      ]
    )

    if (exixtCourse.rows.length > 0) {
      return res.redirect('/lecturer/dashboard/new-course')
    }

    await pool.query(
      'INSERT INTO courses (course_code, course_title, year, lecturer_id) VALUES ($1, $2, $3, $4)', [
        course_code, course_title, year, lecturer_id
      ]
    );

    res.redirect('/lecturer/dashboard');
  } catch (error) {
    console.log(error)
  }
})

// Get upload form page
router.get('/lecturer/dashboard/upload', isAuthenticated, async (req, res) => {
  const courses = await pool.query('SELECT * FROM courses ORDER BY id')
  res.render('upload', {courses: courses.rows, user: req.session.user});
})


// Upload route (POST) 
router.post('/lecturer/dashboard/upload', isAuthenticated, upload.single("material"), async (req, res) => {
  const { course_id } = req.body;
  const filePath = `upload/${req.file.filename}`;
  const uploadedBy = req.session.user.id;

  try {
    await pool.query(
      'INSERT INTO materials (course_id, file_path, uploaded_by) VALUES ($1, $2, $3)',
      [course_id, filePath, uploadedBy]
    );

    res.redirect('/lecturer/dashboard');
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).send('Internal Server Error');
  } 

});



// Route to fetch and display materials with filtering
router.get('/student/dashboard/materials',  isAuthenticated, isStudent,  async (req, res) => {
  // get query parameters for filtering
  const {year, course_code} = req.query;

  //join query to get materials along with course and lecturer details
  let query =`
    SELECT 
      m.id, 
      m.file_path, 
      m.created_at,
      c.course_code,
      c.course_title,
      c.year,
      u.name AS lecturer_name
    FROM materials m
    JOIN courses c ON m.course_id = c.id
    JOIN users u ON m.uploaded_by = u.id
    WHERE 1=1`; // and 1=1 to simplify appending AND conditions

  // array to hold query values
  const values = [];

  if (year) {
    values.push(year);
    query += ` AND c.year = $${values.length}`;
  }

  if (course_code) {
    values.push(course_code);
    query += ` AND c.course_code = $${values.length}`;
  }

  query += ' ORDER BY m.created_at DESC';

  try {
    // execute the query
    const result = await pool.query(query, values);
    // fetch all courses for the filter dropdown
    const courses = await pool.query('SELECT course_code, course_title FROM courses ORDER BY year');

    // render the student-material view with fetched materials and courses
    res.render('student-material', {
      materials: result.rows,
      courses: courses.rows,
      user: req.session.user
    });
  } catch (error) {
    console.error('Error fetching materials:', error); 
    res.status(500).send('Internal Server Error');    
  }
})


// Route to download material by id
router.get('/student/dashboard/materials/download/:id', async (req, res) => {
  const { id } = req.params;
  
  const query = `
  SELECT 
    m.file_path, 
    c.course_title 
  FROM materials m
  JOIN courses c ON m.course_id = c.id
  WHERE m.id = $1`

  try {

    const rows = await pool.query(query, [id]);

    if (rows.rowCount === 0) {
    return res.status(404).send('Material not found');
  }

  const filePath = rows.rows[0].file_path;
  const fileName = rows.rows[0].course_title;

  const absolutePath = path.join(__dirname, '../public/' + filePath);
  // express handler for sending files as an attachment
  res.download(absolutePath, fileName + path.extname(absolutePath), (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Internal Server Error');
  }
})


export default router;
