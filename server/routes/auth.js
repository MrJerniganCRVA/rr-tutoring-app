const express = require('express');
const router = express.Router();
const passport = require('passport');

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');

//@route GET  /auth/google
//@desc Redirect to google for auth

router.get(
    '/google',
    passport.authenticate('google',{
        scope: ['profile', 'email','https://www.googleapis.com/auth/calendar.events'],
        accessType: 'offline'
    })
);

//@route GET /auth/google/callback
//@desc Handle google callback
router.get(
    '/google/callback',
    passport.authenticate('google',{
        failureRedirect: `${clientUrl}/select-teacher?error=auth_failed`
    }),
    (req, res) =>{
        //success - redirect to login page which will detect session, set localStorage, then go to dashboard
        res.redirect(`${clientUrl}/select-teacher`);
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
            lunch:req.user.lunch,
            isAdmin:req.user.is_admin
        });
    } else{
        res.status(401).json({msg:'User not authenticated'});
    }
});

module.exports = router;