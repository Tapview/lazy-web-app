// This file is largely copied from SitePoint. Below is their license:

// The MIT License (MIT)

// Copyright (c) 2016 SitePoint

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as passport from 'passport';
import * as passportLocal from 'passport-local';
const LocalStrategy = passportLocal.Strategy;
const User1 = require('../models/user.model');
const Username = require('../models/username.model');
const Auth = require('../models/auth.model');
// Note: the above variable is set to "User1" instead of "User" because it
// appears that passport has a User type declared in block scope.

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
},
function(username, password, done) {
  Username.findOne({username: username, current: true, type: 'user'}, function(err1, usernameDocument) {
    if (err1) {
      return done(err1);
    }
    // Return if username not found in database
    if (!usernameDocument) {
      return done(null, false, {
        message: 'Username not found',
      });
    }
    Auth.findOne({userId: usernameDocument.refId}, function(err2, userAuth) {
      if (err2) {
        return done(err2);
      }
      // Return if password is incorrect
      if (!userAuth.checkPassword(password)) {
        return done(null, false, {
          message: 'Password is incorrect',
        });
      }
      User1.findOne({_id: usernameDocument.refId}, function(err3, user) {
        if (err3) {
          return done(err3);
        }
        // Return if user not found in database
        if (!user) {
          return done(null, false, {
            message: 'User not found',
          });
        }
        return done(null, user, usernameDocument);
      });
    });
  });
}));


