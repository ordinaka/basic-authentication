--users table--
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  password_hash TEXT,
  role VARCHAR(20) CHECK (role IN ('student', 'lecturer'))
);


CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_titel VARCHAR(100),
  course_code VARCHAR(10),
  year INT,
  lecturer_id INT REFERENCES users(id) ON DELETE SET NULL
)



-- materials table in postgre --
CREATE TABLE materials (
  id SERIAL PRIMARY KEY, 
  course_title VARCHAR(255) NOT NULL, --dropped --
  course_code VARCHAR(50), --dropped--
  year INT, --dropped--
  file_path TEXT NOT NULL,
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL, --changed to course_id to refrence course id as a foreign key--
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user session table --
CREATE TABLE session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IDX_session_expire ON session (expire);
-- add foreign key to materials table -

--query code for modification--
ALTER TABLE materials
ADD COLUMN course_id INT REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE materials
DROP COLUMN course_title,
DROP COLUMN course_code,
DROP COLUMN year;
