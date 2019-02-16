import * as validator from 'validator';
const User = require('../models/user.model');
const Username = require('../models/username.model');
const auth = require('./jwt-auth.controller');
import { isValidDisplayUsername, normalizeUsername } from './utils.controller';

import {uploadSingleImage} from '../services/image-upload';

module.exports = function(app) {
  app.post('/api/user/save-details', auth.jwtRefreshToken, saveDetails);
  app.post('/api/user/profile-image-upload', auth.jwtRefreshToken, profileImageUpload);
};

/**
 * Change Profile details
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function saveDetails(req, res) {
  const userId = req.userId;
  const email = req.body.email;
  const givenName = req.body.givenName;
  const familyName = req.body.familyName;
  const displayUsername = req.body.username;
  if (typeof email !== 'string' ||
      typeof userId !== 'string' ||
      typeof givenName !== 'string' ||
      typeof familyName !== 'string' ||
      typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername) ||
      !validator.isEmail(email)) {
    return res.status(422).json({message: 'Request failed validation'});
  }
  const username = normalizeUsername(displayUsername);

  const promises = [User.findOne({_id: userId}),
    Username.findOne({username: username}),
    Username.findOne({refId: userId, current: true})];

  Promise.all(promises)
      .then(([user, requestedUsername, currentUsername]) => {
        user.email = email;
        user.givenName = givenName;
        user.familyName = familyName;
        let saveUser = false, saveCurrentUsername = false, saveRequestedUsername = false,
            saveNewUsername = false;
        let newUsername;

        if (requestedUsername) {
          if (requestedUsername.username !== currentUsername.username) {
            if (requestedUsername.refId !== userId) {
              return res.status(401).send({message: 'Username belongs to another user'});
            } else {
                if (requestedUsername.username === username) {
                  if (requestedUsername.displayUsername !== displayUsername) {
                    requestedUsername.displayUsername = displayUsername;

                    saveRequestedUsername = true;
                  } else {
                    currentUsername.current = false;

                    requestedUsername.current = true;
                    saveCurrentUsername = true;
                    saveRequestedUsername = true;
                  }
                }
              }
          } else {
            saveUser = true;
          }
        } else {
          newUsername = new Username();
          newUsername.displayUsername = displayUsername;
          newUsername.username = username;
          newUsername.current = true;
          newUsername.refId = userId;
          newUsername.type = 'user';

          currentUsername.current = false;

          saveNewUsername = true;
          saveCurrentUsername = true;
        }
        const promises2 = [];
        if (saveUser) {
          promises2.push(user.save());
        }
        if (saveCurrentUsername) {
          promises2.push(currentUsername.save());
        }
        if (saveRequestedUsername) {
          promises2.push(requestedUsername.save());
        }
        if (saveNewUsername) {
          promises2.push(newUsername.save());
        }

        return Promise.all(promises2)
            .then(() => {
              res.send({message: 'Details changed successfully'});
            })
            .catch(() => {
              res.status(500).send({message: 'Error in saving user details'});
            });
      });
}

/**
 * Upload Profile Image
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */

function profileImageUpload(req, res) {
  const userId = req.query.id;

  if (typeof userId !== 'string') {
    return res.status(422).json({message: 'Error in UserId'});
  }
  uploadSingleImage(req, res, function(err) {
    if (err) {
      return res.status(422).send({errors: [{title: 'Image Upload error', detail: err.message}]});
    }
    User.findOne({_id: userId})
        .then((user) => {
          user.profileImage = req.file.fileLocation;
          return user.save()
              .then(() => {
                return res.send({message: 'Image Uploaded Successfully'});
              })
              .catch(() => {
                return res.status(500).send({message: 'Error in uploading image'});
              });
        })
        .catch(() => {
          return res.status(500).send({message: 'UserId not found'});
        });
  });
}
