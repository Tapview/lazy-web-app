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
const UsernameCheck = require('../models/username.model');
// Note: the above variable is set to "User1" instead of "User" because it
// appears that passport has a User type declared in block scope.

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
},
function(username, password, done) {
  UsernameCheck.findOne({username: username}, function(err, userName) {
    if (err) {
      return done(err);
    }
    // Return if user not found in database
    if (!userName) {
      return done(null, false, {
        message: 'User not found',
      });
    }
    User1.findOne({'_id': userName.refId}, function(error, user) {
      if (!user.checkPassword(password)) {
        return done(null, false, {
          message: 'Password is incorrect',
        });
      }
      return done(null, user);
    });
    // Return if password is wrong
    });
    // If credentials are correct, return the user object
}));


