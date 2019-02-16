// This authentication controller is attempting to achieve best-in-class
// security and flexibility by:
// 1) Using JWTs to allow for microservices to be authorised without having
//    access to a session database
// 2) Using JWT Refresh Tokens to allow persistent sessions
// 3) Storing JWT Refresh Tokens such that the refresher can be revoked, meaning
//    compromised tokens will only remaining for a short while after revoking
// 4) Storing JWTs on the client side in HTTP-only, Secure cookies, so
//    client-side JavaScript can't leak JWTs to some third party, which is
//    useful if using unverified third-party JavaScript on your site
// 5) Using Cross-site request forgery tokens to ensure that the API routes
//    cannot be exploited by loading URLs on other sites, e.g.
//    <img src="https://yoursite.com/api/delete-account">
// 6) Because it relies on cookies and built-in Angular XSRF support, no
//    front-end middleware is required to authenticate the request
//    (Setting XSRF-TOKEN cookie means that Angular will automatically attach
//    the XSRF token to the X-XSRF-TOKEN header. Read more:
//         https://stormpath.com/blog/angular-xsrf)
// 7) Passport is used to define the authentication method, so it can be
//    extended to support all kinds of login methodologies.
// Read more:
// https://stormpath.com/blog/where-to-store-your-jwts-cookies-vs-html5-web-storage

// Important notes:

// When blocking routes using the authentication controller, the rejection is
// always a 401, which, in the application front-end, forces the app to go to a
// login form.
// When a user is logged in, but their privileges do not allow them to access
// the content, the rejection should always be a 403. This does not result in
// the user being redirected, instead they are informed that they cannot access
// the content specified. In some cases, it may be necessary to prevent the user
// from knowing that a resource exists at all. In those cases, it is best to
// return a 404.

// It is VERY important, for security reasons, to ensure that GET and HEAD
// events are not mutating in ANY way (including logging/analytics). The reason
// for this is that the Angular HTTPClient service does not automatically
// attach the XSRF Token to the request header that the server has set in the
// cookie. This means that ALL get requests could potentially be called from any

const passwordSettings = {
  minLength: 10,
  minGuessesLog10: 8,
  goodGuessesLog10: 10,
};


import * as validator from 'validator';
const Contact = require('../models/contact.model');
const User = require('../models/user.model');
const Username = require('../models/username.model');
const Auth = require('../models/auth.model');
const UserStats = require('../models/user-stats.model');
const statsService = require('../services/stats.service');
const emailService = require('../services/email.service');
const Session = require('../models/session.model');
import * as jwt from 'jsonwebtoken';
const auth = require('./jwt-auth.controller');
import { isValidDisplayUsername, normalizeUsername } from './utils.controller';
import * as passport from 'passport';
import * as crypto from 'crypto';
require('../config/passport');
import * as zxcvbn from 'zxcvbn';

module.exports = function(app) {
  app.use(passport.initialize());
  app.post('/api/user/register', register);
  app.post('/api/username-available', usernameAvailable);
  app.post('/api/user/check-password', checkPassword);
  app.post('/api/user/login', login);
  app.get('/api/user/refresh-jwt', auth.jwtRefreshToken, refreshJwt);
  app.get('/api/user/details', auth.jwt, userDetails);
  app.post('/api/user/change-password', auth.jwtRefreshToken, changePassword);
  app.post('/api/user/request-reset-password', requestResetPassword);
  // Other ideas:
  // https://www.owasp.org/index.php/Forgot_Password_Cheat_Sheet#Step_4.29_Allow_user_to_change_password_in_the_existing_session
  app.post('/api/user/reset-password',
      auth.jwtTemporaryLinkToken, changePassword);
  app.post('/api/user/forgot-username', forgotUsername);
  app.post('/api/user/logout', auth.jwtRefreshToken, logout);

};

/**
 * registers a user
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */


function register(req, res) {
  // Extract req.body
  const email = req.body.email;
  const givenName = req.body.givenName;
  const familyName = req.body.familyName;
  const displayUsername = req.body.username;
  const password = req.body.password;

  // Validate
  if (typeof email !== 'string' ||
      typeof givenName !== 'string' ||
      typeof familyName !== 'string' ||
      typeof displayUsername !== 'string' ||
      typeof password !== 'string' ||
      !validator.isEmail(email) ||
      !isValidDisplayUsername(displayUsername) ||
      !validator.isLength(password, passwordSettings.minLength) ||
      zxcvbn(password).guesses_log10 < passwordSettings.minGuessesLog10) {
    return res.status(422).json({message: 'Request failed validation'});
  }
  const username = normalizeUsername(displayUsername);

  // check that there is not an existing user with this username
  return Username.findOne({username: username})
      .then(existingUser => {
        if (existingUser) {
          return res.status(409).send({message: 'Username already taken.'});
        }
        const user = new User();
        const usernameDocument = new Username();
        const authUser = new Auth();
        user.givenName = givenName;
        user.familyName = familyName;
        user.email = email;
        return user.save()
            .then((userDetail) => {
              authUser.userId = userDetail._id;
              authUser.createPasswordHash(password);
              return authUser.save()
                  .then(() => {
                    usernameDocument.username = username;
                    usernameDocument.displayUsername = displayUsername;
                    usernameDocument.refId = userDetail._id;
                    usernameDocument.type = 'user';
                    usernameDocument.current = true;
                    return usernameDocument.save()
                        .then(() => {
                          // The below promises are structured to report failure but not
                          // block on failure
                          return createAndSendRefreshAndSessionJwt(usernameDocument, user, req, res)
                              .then(() => {
                                return statsService.increment(UserStats)
                                    .catch((err) => {
                                      console.log('Error in the stats service');
                                    });
                              })
                              .then(() => {
                                return emailService.addUserToMailingList({
                                      givenName, familyName, email, userId: user._id,
                                    })
                                    .catch((err) => {
                                      console.log('Error in the mailing list service');
                                    });
                              })
                              .then(() => {
                                return emailService.sendRegisterWelcome({
                                      givenName, familyName, email,
                                    })
                                    .catch((err) => {
                                      console.log('Error in the send email service');
                                    });
                              })
                              .catch((err) => {
                                console.log('Error in createAndSendRefreshAndSessionJwt');
                              });
                        })
                        .catch(() => {
                          return res.status(500).send({message: 'Error in saving username'});
                        });
                  })
                  .catch(() => {
                    return res.status(500).send({message: 'Error in saving password'});
                  });
            })
            .catch((dbError) => {
              let err;
              if (process.env.NODE_ENV !== 'production') {
                // DO NOT console.log or return Mongoose catch errors to the
                // front-end in production, especially for user objects. They
                // contain secret information. e.g. if you try to create a user
                // with a username that already exists, it will return the
                // operation that you are trying to do, which includes the
                // password hash.
                err = dbError;
                console.log(dbError);
              }
              return res.status(500).send({
                  message: 'Error in creating user during registration: '
                      + err});
            });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
            message: 'Error accessing database while checking for existing users'});
      });
}


/**
 * Determines if username available
 * @param {*} req
 * @param {*} res
 * @return {Promise}
 */
function usernameAvailable(req, res) {
  const id = req.body.id;
  const displayUsername = req.body.username;
  // Validate
  if ((typeof id !== 'string' && typeof id !== 'undefined') ||
      typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)) {
    return res.status(422).json({message: 'Request failed validation'});
  }
  const username = normalizeUsername(displayUsername);
  let currentUsername;
  if (req.body.currentUsername) {
    const currentDisplayUsername = req.body.currentUsername;
    if (typeof currentDisplayUsername !== 'string' ||
        !isValidDisplayUsername(currentDisplayUsername)) {
      return res.status(422).json({message: 'Request failed validation'});
    }
    currentUsername = normalizeUsername(currentDisplayUsername);
  }

  if (currentUsername === username) {
    return res.send({available: true});
  }

  return Username.findOne({username: username})
      .then((existingUsername) => {
        if (existingUsername) {
          if (existingUsername.refId === id) {
              return res.send({available: true});
          } else {
            return res.send({available: false});
          }
        } else {
           return res.send({available: true});
        }
      })
      .catch(() => {
        res.status(500).send({
            message: 'Error accessing database while checking for existing users'});
      });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @return {any}
 */
function checkPassword(req, res) {
  const password = req.body.password;
  if (typeof password !== 'string') {
    return res.status(422).json({message: 'Request failed validation'});
  }
  const response = {
    passwordSettings: passwordSettings,
    guessesLog10: zxcvbn(password).guesses_log10,
  };
  // guessesLog10 must be >= passwordSettings.minGuessesLog10
  // i.e. fail if guessesLog10 < passwordSettings.minGuessesLog10
  res.send(response);
}

/**
 * logs a user in
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function login(req, res) {
  const displayUsername = req.body.username;
  const normalizedUsername = normalizeUsername(displayUsername);
  // note length should not be checked when logging in
  const password = req.body.password;
  // Validate
  if (typeof displayUsername !== 'string' ||
      typeof password !== 'string' ||
      !isValidDisplayUsername(displayUsername)
    ) {
    return res.status(422).json({message: 'Request failed validation'});
  }
  // Sanitize (update username)
  req.body.username = normalizedUsername;

  passport.authenticate('local', function(err, user, usernameDocument, info) {
    if (err) {
      return res.status(500).json(err);
    }
    if (!user) {
      auth.clearTokens(res);
      return res.status(401)
          .send({message: 'Error in finding user:'});
    }
    return createAndSendRefreshAndSessionJwt(usernameDocument, user, req, res);
  })(req, res);
}

/**
 * refreshes the jwt
 * @param {*} req request object
 * @param {*} res response object
 */
function refreshJwt(req, res) {
  // The refresh token is verified by auth.jwtRefreshToken
  // Pull the user data from the refresh JWT
  const token = setJwtCookie({
    res,
    userId: req.jwtRefreshToken.sub,
    username: req.jwtRefreshToken.username,
    isAdmin: req.jwtRefreshToken.isAdmin,
    xsrf: req.jwtRefreshToken.xsrf,
    sessionId: req.jwtRefreshToken.jwt,
  });
  res.send({
      jwtExp: token.jwtObj.exp,
      message: 'JWT successfully refreshed.',
  });
}

/**
 * returns the user details
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function userDetails(req, res) {
  // Validate not necessary at this point (no req.body use,
  // and checked in jwt-auth)
  const userId = req.userId;
  if ( typeof userId !== 'string') {
    return res.status(422).json({message: 'Request failed validation'});
  }
  return User.findOne({_id: userId})
      .then((user) => {
        return Username.findOne({refId: user._id, current: true})
            .then((username) => {
              const returnUser = user.frontendData();
              returnUser.username = username.username;
              returnUser.displayUsername = username.displayUsername;
              return res.send(returnUser);
            })
            .catch(() => {
              return res.status(500).send({message: 'Error accessing username database'});
            });
      })
      .catch(() => {
        return res.status(500).send({message: 'UserId not found'});
      });
}

/**
 * change password
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function changePassword(req, res) {
  const password = req.body.password;
  const userId = req.userId;
  // Validate
  if (typeof password !== 'string' ||
      typeof userId !== 'string' ||
      !validator.isLength(password, passwordSettings.minLength) ||
      zxcvbn(password).guesses_log10 < passwordSettings.minGuessesLog10) {
    return res.status(422).json({message: 'Request failed validation'});
  }

  return User.findOne({_id: userId})
      .then(() => {
        return Auth.findOne({userId: userId})
            .then((userAuth) => {
              // Create new password hash
              userAuth.createPasswordHash(password);
              return userAuth.save()
                  .then(() => {
                    return res.send({message: 'Password successfully changed'});
                  })
                  .catch(() => {
                    return res.status(500).send({message: 'Password change failed'});
                  });
            })
            .catch(() => {
              return res.status(500).send({message: 'Error in accessing auth database'});
            });
      })
      .catch(() => {
        return res.status(500).send({message: 'UserId not found'});
      });
}

/**
 * handle a request to reset the password
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function requestResetPassword(req, res) {
  const displayUsername = req.body.username;
  // Validate
  if (typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)
    ) {
    return res.status(422).json({message: 'Request failed validation'});
  }
  const username = normalizeUsername(displayUsername);
  // Success object must be identical, to avoid people discovering
  // emails in the system
  return Username.findOne({username: username})
      .then(usernameReturn => {
        return User.findOne({'_id': usernameReturn.refId})
            .then((user) => {
              res.send({message: 'Email sent if users found in database.'});
              // Note that if errors in sending emails occur, the front end will not see them
              // The JWT for request password will NOT be set in the cookie
              // and hence does not require XSRF
              const jwtObj = {
                sub: user._id,
                username: username,
                isAdmin: user.isAdmin,
                exp: Math.floor(
                    (Date.now() + Number(process.env.JWT_TEMPORARY_LINK_TOKEN_EXPIRY)) / 1000), // 1 hour
              };
              const jwtString = jwt.sign(jwtObj, process.env.JWT_KEY);
              const resetUrl = process.env.URL_ORIGIN +
                  '/reset-password?username=' + username + // the username here is only display purposes on the front-end
                  '&auth=' + jwtString;
              // When the user clicks on the link, the app pulls the JWT from the link
              // and stores it in the component
              return emailService.sendPasswordReset({
                    givenName: user.givenName,
                    familyName: user.familyName,
                    email: user.email,
                    username: username,
                    userId: user._id,
                    resetUrl,
                  })
                  .catch(() => {
                    console.log('Could not send email.');
                  });
            })
            .catch(() => {
              res.send({message: 'Email sent if users found in database.'});
            });
        })
        .catch(() => {
          res.status(500).send({message: 'Error accessing username database.'});
        });
}

/**
 * handles request for forgotten username
 * @param {*} req request object
 * @param {*} res request object
 * @return {*}
 */
function forgotUsername(req, res) {
  const email = req.body.email;
  // Validate
  if (typeof email !== 'string' ||
      !validator.isEmail(email)) {
    return res.status(422).json({message: 'Request failed validation'});
  }

  // find all users by email
  return User.find({email: email}).select('username givenName familyName')
      .then((users) => {
        // Success object must be identical, to avoid people
        // discovering emails in the system
        const successObject = {message: 'Email sent if users found in database.'};
        if (!users || users.length === 0) {
          res.send(successObject); // Note that if errors in send in emails occur, the front end will not see them
          return;
        }
        const userIds = users.map(userEle => userEle._id);
        return Username.find({refId: userIds, current: true})
            .then((usernameArr) => {
              return emailService.sendUsernameRetrieval({
                givenName: users[0].givenName, // just use the name of the first account
                familyName: users[0].familyName,
                email: email,
                usernameArr: usernameArr,
              })
              .then(() => {
                res.send(successObject); // Note that if errors in send in emails occur, the front end will not see them
              })
              .catch(() => {
                res.status(500).send({message: 'Could not send email.'});
              });
            })
            .catch(() => {
              res.status(500).send({message: 'Username not found'});
            });
      })
      .catch((err) => {
        res.status(500).send({message: 'Error accessing user database.'});
      });
}

/**
 * logout user
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function logout(req, res) {
  // Validation not necessary
  // delete it from the DB
  return Session.remove({_id: req.jwtRefreshToken.jti})
      .then(() => {
        // needs a .then to act like a promise for Mongoose Promise
        return null;
      })
      .finally(() => {
        // delete the cookies (note this should not clear the browserId)
        auth.clearTokens(res);
        return res.send({message: 'Log out successful'});
      });
}

/**
 * create and send refreshed session jwt
 * @param {*} user user object
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function createAndSendRefreshAndSessionJwt(usernameDocument, user, req, res) {
  const userAgentString = req.header('User-Agent').substring(0, 512);
  // Validate
  if (typeof userAgentString !== 'string') {
    return res.status(422).json({message: 'Request failed validation'});
  }

  // Create cross-site request forgery token
  const xsrf = crypto.randomBytes(8).toString('hex');

  const refreshTokenExpiry = Math.floor(
      (Date.now() + Number(process.env.JWT_REFRESH_TOKEN_EXPIRY)) / 1000);

  const session = new Session();
  session.userId = user._id;
  session.exp = new Date(refreshTokenExpiry * 1000);
  session.userAgent = userAgentString;
  session.lastObserved = new Date(Date.now());
  return session.save()
      .then((sessionReturned) => {
        // Setting XSRF-TOKEN cookie means that Angular will
        // automatically attach the
        // XSRF token to the X-XSRF-TOKEN header.
        // Read more: https://stormpath.com/blog/angular-xsrf
        res.cookie('XSRF-TOKEN', xsrf, {
          maxAge: Number(process.env.XSRF_EXPIRY),
        });
        const token = setJwtCookie({
            res,
            userId: user._id,
            username: usernameDocument.username,
            isAdmin: user.isAdmin,
            xsrf,
            sessionId: sessionReturned._id});
        const refreshToken = setJwtRefreshTokenCookie({
            res,
            userId: user._id,
            username: usernameDocument.username,
            isAdmin: user.isAdmin,
            xsrf,
            sessionId: sessionReturned._id,
            exp: refreshTokenExpiry});
        const returnedUserData = user.frontendData();
        returnedUserData.username = usernameDocument.username;
        returnedUserData.displayUsername = usernameDocument.displayUsername;
        return res.json({
            user: returnedUserData,
            jwtExp: token.jwtObj.exp,
            jwtRefreshTokenExp: refreshToken.jwtObj.exp,
        });
      })
      .catch((err) => {
        auth.clearTokens(res);
        return res.status(500).json({message: 'Error saving session. ' + err});
      });
}

/**
 * sets the jwt cookie
 * @param {*} param0
 * @return {*}
 */
function setJwtCookie({res, userId, username, isAdmin, xsrf, sessionId}) {
  const jwtObj = {
    sub: userId,
    // Note this id is set using the refresh token session id so that we can
    // easily determine which session is responsible for an action
    jti: sessionId,
    username: username,
    isAdmin: isAdmin,
    xsrf: xsrf,
    exp: Math.floor((Date.now() + Number(process.env.JWT_EXPIRY)) / 1000),
  };
  const jwtString = jwt.sign(jwtObj, process.env.JWT_KEY);
  // Set the cookie
  res.cookie('JWT', jwtString, {
      httpOnly: true,
      maxAge: Number(process.env.JWT_EXPIRY),
    });
  return {jwtString, jwtObj};
}

/**
 * sets jwt refresh token cookie
 * @param {*} param0
 * @return {*}
 */
function setJwtRefreshTokenCookie(
    {res, userId, username, isAdmin, xsrf, sessionId, exp}) {
  const jwtObj = {
    sub: userId,
    jti: sessionId,
    username: username,
    isAdmin: isAdmin,
    xsrf: xsrf,
    exp: exp,
  };
  const jwtString = jwt.sign(jwtObj, process.env.JWT_REFRESH_TOKEN_KEY);
  // Set the cookie
  res.cookie('JWT_REFRESH_TOKEN', jwtString, {
      httpOnly: true,
      maxAge: process.env.JWT_REFRESH_TOKEN_EXPIRY,
    });
  return {jwtString, jwtObj};
}
