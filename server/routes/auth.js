const express = require('express');
const router = express.Router();
const passport = require('passport');


//@route GET  /auth/google
//@desc Redirect to google for auth

router.get(
    '/google',
    passport.authenticate('google',{
        scope: ['profile', 'email','https://www.googleapis.com/auth/calendar.events'],
        accessType: 'offline',
        prompt: 'consent'
    })
);

//@route GET /auth/google/callback
//@desc Handle google callback
router.get(
    '/google/callback',
    passport.authenticate('google',{
        failureRedirect: 'http://localhost:3000/login?error=auth_failed'
    }),
    (req, res) =>{
        //success so go to app
        res.redirect('http://localhost:3000/dashboard');
    }
);

//@route GET /auth/logout
//@desc logout the user
router.get('/logout', (req, res)=>{
    req.logout((err)=>{
        if(err){
            return res.status(500).json({msg:'Error logging out'});
        }
        res.json({msg:'Logged user out succesfully'});
    });
});

//@route GET /auth/current
//@desc Get currently logged in teacher
router.get('/current', (req, res)=>{
    if(req.isAuthenticated()){
        res.json({
            id:req.user.id,
            email:req.user.email,
            firstName: req.user.first_name,
            lastName: req.user.last_name,
            subject: req.user.subject,
            lunch:req.user.lunch
        });
    } else{
        res.status(401).json({msg:'User not authenticated'});
    }
});

module.exports = router;