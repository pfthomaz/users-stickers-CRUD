const express = require('express');
const User = require('../db/user');
const bcrypt = require('bcrypt');
const router = express.Router();

// Route paths are prepending with /auth

router.get('/', (req, res) => {
  res.json({
    message: '🔐'
  });
});

function validUser(user) {
  const validEmail = typeof user.email == 'string' && user.email.trim() != '';
  const validPassword =
    typeof user.password == 'string' &&
    user.password.trim() != '' &&
    user.password.trim().length >= 6;
  return validEmail && validPassword;
}

router.post('/signup', (req, res, next) => {
  if (validUser(req.body)) {
    User.getOneByEmail(req.body.email).then(user => {
      console.log('user', user);
      if (!user) {
        // this is a unique email
        // hash password
        bcrypt.hash(req.body.password, 10).then(hash => {
          // insert user into db
          const user = {
            email: req.body.email,
            password: hash,
            created_at: new Date()
          };
          User.create(user).then(id => {
            // redirect
            setUserIdCookie(req, res, id);
            res.json({
              id,
              message: '✅'
            });
          });
        });
      } else {
        next(new Error('Email in use'));
      }
    });
  } else {
    // send an error
    next(new Error('Invalid user'));
  }
});

function setUserIdCookie(req, res, id) {
  const isSecure = req.app.get('env') != 'development';
  res.cookie('user_id', id, {
    httpOnly: true,
    secure: isSecure,
    signed: true
  });
}


router.post('/login', (req, res, next) => {
  if (validUser(req.body)) {
    User.getOneByEmail(req.body.email).then(user => {
      console.log('user', user);
      if (user) {
        // compare passowrd with hashed password
        bcrypt.compare(req.body.password, user.password).then(result => {
          if (result) {
            setUserIdCookie(req, res, user.id);
            res.json({
              id: user.id,
              message: 'Logging in... 🔓'
            });
          } else {
            next(new Error('Invalid login'));
          }
        });
      } else {
        next(new Error('Invalid login'));
      }
    });
  } else {
    // send an error
    next(new Error('Invalid user'));
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.json({
    message: '🔒'
  });
});

module.exports = router;
