//session based auth
module.exports = function(req, res, next) {
  if(req.isAuthenticated()){
    req.teacher = {id: req.user.id};
    next();
  } else{
    return res.status(401).json({
      msg: 'Not authenticated in middleware. Please login'
    });
  };
};



  // Simple auth without password
  // // Get teacher ID from header
  // const teacherId = req.header('x-teacher-id');
  
  // // Check if teacher ID is provided
  // if (!teacherId) {
  //   return res.status(401).json({ msg: 'No teacher ID provided, authorization denied' });
  // }
  
  // try {
  //   // Attach teacher ID to request object
  //   req.teacher = { id: teacherId };
  //   next();
  // } catch (err) {
  //   res.status(500).json({ msg: 'Server Error' });
  // }
