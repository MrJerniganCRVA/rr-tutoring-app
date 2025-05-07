/ Simple authentication middleware without passwords
module.exports = function(req, res, next) {
  // Get teacher ID from header
  const teacherId = req.header('x-teacher-id');
  
  // Check if teacher ID is provided
  if (!teacherId) {
    return res.status(401).json({ msg: 'No teacher ID provided, authorization denied' });
  }
  
  try {
    // Attach teacher ID to request object
    req.teacher = { id: teacherId };
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};
