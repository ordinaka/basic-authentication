//middleware to check if the user exist
export function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
} 

// middleware to check if the user is a lecturer
export function isLecturer(req, res, next) {
  if (req.session.user && req.session.user.role === 'lecturer') {
    return next();
  } else {     
    return res.redirect('/login'); 
  }
}

// middleware to check if the user is a student
export function isStudent(req, res, next) {
  if (req.session.user && req.session.user.role === 'student') {
    return next();
  } else {     
    return res.redirect('/login'); 
  }
};