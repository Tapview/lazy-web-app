const Organization = require('../models/organization.model');
const UserOrganization = require('../models/user-organization.model');
const auth = require('./jwt-auth.controller');
const User = require('../models/user.model');
const Username = require('../models/username.model');
const UserOrgHistory = require('../models/user-organization-history.model');
const { isValidDisplayUsername, normalizeUsername } = require('./utils.controller');

import { uploadSingleImage } from '../services/image-upload';

module.exports = function (app) {
  app.post('/api/organization/create', auth.jwt, createOrg);
  app.post('/api/organization/user-org-summary', auth.jwt, userOrgSummary);
  app.post('/api/organization/get-details', auth.jwt, getDetails);
  app.post('/api/organization/update-details', auth.jwt, updateDetails);
  app.post('/api/organization/image-upload', auth.jwt, imageUpload);
  app.post('/api/organization/add-user', auth.jwt, addUser);
  app.post('/api/organization/delete', auth.jwt, deleteOrg);
  app.post('/api/organization/remove-user', auth.jwt, removeUser);
  app.post('/api/organization/get-users', auth.jwt, getUsers);
  app.post('/api/organization/user-by-username', auth.jwt, getUserByUsername);
};

function getRoles(userId, orgId) {
  return UserOrganization.findOne({ 'userId': userId, 'orgId': orgId })
      .then((userOrg) => {
        return function (role) {
          if (userOrg.roles.indexOf(role) === -1) {
            return false;
          } else {
            return true;
          }
        };
      })
      .catch(() => {
        throw new Error('User not found in organization.');
      });
}

// Create Organization
function createOrg(req, res) {
  const { name, website, phoneNumber } = req.body;
  const displayUsername = req.body.username;
  const userId = req.userId;
  if (typeof userId !== 'string' ||
      typeof name !== 'string' ||
      typeof website !== 'string' ||
      typeof phoneNumber !== 'string' ||
      typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)) {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  const username = normalizeUsername(displayUsername);
  return Username.findOne({ username: username })
      .then((usernameExists) => {
        if (usernameExists) {
          return res.status(409).send({ message: 'Username already taken.' });
        }
        const organization = new Organization();
        organization.name = name;
        organization.website = website;
        organization.phoneNumber = phoneNumber;
        organization.userCount = 1;
        return organization.save()
            .then(() => {
              const userOrg = new UserOrganization();
              userOrg.userId = userId;
              userOrg.orgId = organization._id;
              userOrg.roles = ['admin'];
              return userOrg.save()
                  .then(() => {
                    const usernameDocument = new Username();
                    usernameDocument.username = username;
                    usernameDocument.displayUsername = displayUsername;
                    usernameDocument.refId = organization._id;
                    usernameDocument.type = 'org';
                    usernameDocument.current = true;
                    return usernameDocument.save()
                        .then(() => {
                          return res.status(200).send({
                            message: 'UserId and OrganizationId saved successfully'
                          });
                        })
                        .catch(() => {
                          return res.status(500).send({
                            message: 'Error in saving username'
                          });
                        });
                  })
                  .catch(() => {
                    return res.status(500).send({
                      message: 'Error in Saving user role and organization.'
                    });
                  });
            })
            .catch(() => {
              return res.status(500).send({
                message: 'Error in saving organization'
              });
            });
      })
      .catch(() => {
        return res.status(500).send({
          message: 'Error in accessing username database'
        });
      });
}

// Get all organization details of logged in user
function userOrgSummary(req, res) {
  const userId = req.userId;
  if (typeof userId !== 'string') {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  return UserOrganization.find({ 'userId': userId })
      .then((userOrgArr) => {
        const orgIds = userOrgArr.map(orgEle => orgEle.orgId);
        return Username.find({ 'refId': { '$in': orgIds } })
            .then((orgUsername) => {
              return Organization.find({ '_id': { '$in': orgIds } })
                  .then((orgDetails) => {
                    const usernames = {};
                    const userRoles = {};
                    Object.keys(orgUsername).map((i) => {
                      usernames[orgUsername[i]['refId']] = orgUsername[i]['displayUsername'];
                    });
                    Object.keys(userOrgArr).map((i) => {
                      userRoles[userOrgArr[i]['orgId']] = userOrgArr[i]['roles'];
                    });
                    return res.json({ orgDetails, userRoles, usernames });
                  })
                  .catch(() => {
                    return res.status(500).send({
                      message: 'Error in finding organization'
                    });
                  });
            })
            .catch(() => {
              return res.status(500).send({
                message: 'Error in accessing username database'
              });
            });
      })
      .catch(() => {
        return res.status(500).send({ message: 'Error in finding userId' });
      });
}

// Update Organization details (only admin users)
function updateDetails(req, res) {
  const userId = req.userId;
  const orgId = req.body.id;
  const name = req.body.name;
  const website = req.body.website;
  const phoneNumber = req.body.phoneNumber;
  const displayUsername = req.body.username;
  if (typeof userId !== 'string' ||
      typeof orgId !== 'string' ||
      typeof name !== 'string' ||
      typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)) {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  const username = normalizeUsername(displayUsername);

  const promises = [getRoles(userId, orgId),
  Organization.findOne({ _id: orgId }),
  Username.findOne({ username: username }),
  Username.findOne({ refId: orgId, current: true })];
  Promise.all(promises)
      .then(([rolesFunction, organization, requestedUsername, currentUsername]) => {
        if (!rolesFunction('admin')) {
          return res.status(401).send({ message: 'Unauthorized access' });
        } else {
          organization.name = name;
          organization.website = website;
          organization.phoneNumber = phoneNumber;

          let saveOrganization = true, saveCurrentUsername = false, saveRequestedUsername = false,
            saveNewUsername = false;
          let newUsername;

          if (requestedUsername) {
            if (requestedUsername.username !== currentUsername.username) {
              if (requestedUsername.refId !== orgId) {
                return res.status(401).send({
                  message: 'Username belongs to another organization'
                });
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
              saveOrganization = true;
            }

          } else {
            newUsername = new Username();
            newUsername.displayUsername = displayUsername;
            newUsername.username = username;
            newUsername.current = true;
            newUsername.refId = orgId;
            newUsername.type = 'organization';

            currentUsername.current = false;

            saveNewUsername = true;
            saveCurrentUsername = true;
          }

          const promises2 = [];
          if (saveOrganization) {
            promises2.push(organization.save());
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
                return res.send({ message: 'Details changed successfully' });
              })
              .catch(() => {
                return res.status(500).send({
                  message: 'Error in saving organization details'
                });
              });
        }
      });
}

// Organization logo upload
function imageUpload(req, res) {
  const userId = req.userId;
  const orgId = req.query.id;
  if (typeof userId !== 'string' ||
      typeof orgId !== 'string') {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  return getRoles(userId, orgId)
      .then((rolesFunction) => {
        if (rolesFunction('admin')) {
          return uploadSingleImage(req, res, function (err) {
            if (err) {
              return res.status(422).send({
                errors: [{ title: 'Image Upload error', detail: err.message }]
              });
            }
            return Organization.findOne({ '_id': orgId })
                .then((org) => {
                  org.logo = req.file.fileLocation;
                  return org.save()
                      .then(() => {
                        return res.status(200).send({
                          message: 'Image uploaded successfully'
                        });
                      })
                      .catch(() => {
                        return res.status(500).send({
                          message: 'Image upload failed'
                        });
                      });
                })
                .catch(() => {
                  return res.status(500).send({
                    message: 'Organization not found'
                  });
                });
          });
        } else {
          return res.status(404).send({ message: 'Unauthorized access' });
        }
      });
}

// Detail of the organization to be updated
function getDetails(req, res) {
  const userId = req.userId;
  const displayUsername = req.body.username;
  if (typeof userId !== 'string' ||
      typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)) {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  const username = normalizeUsername(displayUsername);
  return Username.findOne({ username: username })
      .then((response) => {
        return getRoles(userId, response.refId)
            .then((rolesFunction) => {
              if (rolesFunction('admin')) {
                return Organization.findOne({ _id: response.refId })
                    .then((orgDetail) => {
                      return res.send({ orgDetail, response });
                    })
                    .catch(() => {
                      return res.status(500).send({
                        message: 'Organization not found'
                      });
                    });
              }
            })
            .catch(() => {
              return res.status(500).send({ message: 'Unauthorized access' });
            });
      })
      .catch(() => {
        return res.status(500).send({
          message: 'Error in accessing username database'
        });
      });
}

// Users of current organization
function getUsers(req, res) {
  const userId = req.userId;
  const displayUsername = req.body.username;
  if (typeof userId !== 'string' ||
      typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)) {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  const username = normalizeUsername(displayUsername);
  return Username.findOne({ username: username })
      .then((response) => {
        return Organization.findOne({ _id: response.refId })
            .then((organization) => {
              return getRoles(userId, organization._id)
                  .then((rolesFunction) => {
                    if (rolesFunction('admin')) {
                      return UserOrganization.find({ 'orgId': organization._id })
                          .then((userOrgArr) => {
                            const userIds = userOrgArr.map(orgEle => orgEle.userId);
                            return User.find({ '_id': { $in: userIds } })
                                .then((users) => {
                                  return Username.find({ refId: { $in: userIds }, current: true })
                                      .then((usernames) => {
                                        const userProfileImage = {};
                                        Object.keys(users).map((k) => {
                                          userProfileImage[users[k]['_id']] = users[k]['profileImage'];
                                        });
                                        return res.json({ userProfileImage, usernames });
                                      })
                                      .catch(() => {
                                        return res.status(500).send({
                                          message: 'Error in accessing username database'
                                        });
                                      });
                                })
                                .catch(() => {
                                  return res.status(500).send({
                                    message: 'Error in finding users'
                                  });
                                });
                          })
                          .catch(() => {
                            return res.status(500).send({
                              message: 'Error in accessing user organization'
                            });
                          });
                    }
                  })
                  .catch(() => {
                    return res.status(500).send({
                      message: 'Unauthorized access'
                    });
                  });
            })
            .catch(() => {
              return res.status(500).send({ message: 'Organization not found' });
            });
      })
      .catch(() => {
        return res.status(500).send({ message: 'Organization username is invalid' });
      });
}

// Add user to respective organization
function addUser(req, res) {
  const userId = req.userId;
  const orgId = req.body.orgId;
  const displayUsername = req.body.username;
  if (typeof userId !== 'string' ||
      typeof orgId !== 'string' ||
      typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)) {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  const username = normalizeUsername(displayUsername);
  let userToAdd;
  return getRoles(userId, orgId)
      .then((rolesFunction) => {
        if (rolesFunction('admin')) {
          return Organization.findOne({ '_id': orgId })
              .then((org) => {
                return Username.findOne({ 'username': username, 'type': 'user' })
                    .then((response) => {
                      return User.findOne({ '_id': response.refId })
                          .then((user) => {
                            userToAdd = user;
                            return UserOrganization.findOne({ 'userId': userToAdd._id, 'orgId': orgId })
                                .then((existingUser) => {
                                  if (existingUser) {
                                    return res.status(500).send({ message: 'User already exists in this organization' });
                                  }
                                  const userOrg = new UserOrganization();
                                  userOrg.userId = userToAdd._id;
                                  userOrg.orgId = orgId;
                                  userOrg.roles = [org.defaultRole];
                                  return userOrg.save()
                                      .then((userOrganization) => {
                                        return Username.findOne({ refId: orgId, current: true })
                                            .then((returnUsername) => {
                                              const userOrgHistory = new UserOrgHistory();
                                              userOrgHistory.timestamp = Date.now();
                                              userOrgHistory.userId = userToAdd._id;
                                              userOrgHistory.orgId = orgId;
                                              userOrgHistory.action = 'User added to organization';
                                              const organization = userOrganization.toObject();
                                              organization.orgName = org.name;
                                              organization.orgUsername = returnUsername.username;
                                              userOrgHistory.state = organization;
                                              return userOrgHistory.save()
                                                  .then(() => {
                                                    return Organization.update({ '_id': orgId }, { $inc: { userCount: 1 } })
                                                        .then(() => {
                                                          return res.status(200).send({
                                                            message: 'User count increased successfully'
                                                          });
                                                        })
                                                        .catch(() => {
                                                          return res.status(500).send({
                                                            message: 'Error in increasing user count'
                                                          });
                                                        });
                                                  })
                                                  .catch(() => {
                                                    return res.status(500).send({
                                                      message: 'Error in saving user organization history'
                                                    });
                                                  });
                                            })
                                            .catch(() => {
                                              return res.status(500).send({
                                                message: 'Error in accessing username database for organization'
                                              });
                                            });
                                      })
                                      .catch(() => {
                                        return res.status(500).send({
                                          message: 'Error in saving user to organization'
                                        });
                                      });
                                });
                          })
                          .catch(() => {
                            return res.status(500).send({ message: 'User not found' });
                          });
                    })
                    .catch(() => {
                      return res.status(500).send({
                        message: 'Error in accessing username database'
                      });
                    });
              })
              .catch(() => {
                return res.status(404).send({
                  message: 'Organization not found'
                });
              });
        }
      })
      .catch(() => {
        return res.status(500).send({ message: 'Unauthorized access' });
      });
}

// Delete Organization
function deleteOrg(req, res) {
  const userId = req.userId;
  const orgId = req.body.id;
  if (typeof userId !== 'string' ||
    typeof orgId !== 'string') {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  return getRoles(userId, orgId)
      .then((rolesFunction) => {
        if (rolesFunction('admin')) {
          return Username.findOne({refId: orgId, current: true})
              .then((response) => {
                response.current = false;
                return response.save()
                    .then(() => {
                      return UserOrganization.deleteMany({ 'orgId': orgId })
                          .then(() => {
                            return Organization.deleteOne({ '_id': orgId })
                                .then(() => {
                                  return res.status(200).send({
                                    message: 'Organization deleted successfully'
                                  });
                                })
                                .catch(() => {
                                  return res.status(500).send({
                                    message: 'Error in deleting organization'
                                  });
                                });
                          })
                          .catch(() => {
                            return res.status(500).send({
                              message: 'Error in deleting UserOrganization'
                            });
                          });
                    })
                    .catch(() => {
                      return res.status(500).send({
                        message: 'Error in saving organization username'
                      });
                    });
              })
              .catch(() => {
                return res.status(500).send({
                  message: 'Error in accessing organization username'
                });
              });
        }
      })
      .catch(() => {
        return res.status(404).send({ message: 'Unauthorized access' });
      });
}

// Remove user from organization
function removeUser(req, res) {
  const userId = req.userId;
  const userToBeDeleted = req.body.userId;
  const orgId = req.body.orgId;
  const orgUsername = req.body.orgUsername;
  const orgName = req.body.orgName;
  if (typeof userId !== 'string' ||
      typeof orgName !== 'string' ||
      typeof userToBeDeleted !== 'string' ||
      typeof orgUsername !== 'string' ||
      typeof orgId !== 'string') {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  return getRoles(userId, orgId)
      .then((rolesFunction) => {
        if (rolesFunction('admin')) {
          return User.findOne({ '_id': userToBeDeleted })
              .then(() => {
                return UserOrganization.findOne({ 'userId': userToBeDeleted, 'orgId': orgId })
                    .then((userOrg) => {
                      const userOrgHistory = new UserOrgHistory();
                      userOrgHistory.userId = userToBeDeleted;
                      userOrgHistory.orgId = orgId;
                      userOrgHistory.timestamp = Date.now();
                      userOrgHistory.action = 'User removed from organization';
                      const organization = userOrg.toObject();
                      organization.orgName = orgName;
                      organization.orgUsername = orgUsername;
                      userOrgHistory.state = organization;
                      return userOrgHistory.save()
                          .then(() => {
                            return UserOrganization.deleteOne({ 'userId': userToBeDeleted, 'orgId': orgId })
                                .then(() => {
                                  return Organization.update({ '_id': orgId }, { $inc: { userCount: -1 } })
                                      .then(() => {
                                        return res.status(200).send({
                                          message: 'User removed successfully'
                                        });
                                      })
                                      .catch(() => {
                                        return res.status(500).send({
                                          message: 'Error in decreasing user count'
                                        });
                                      });
                                })
                                .catch(() => {
                                  return res.status(500).send({
                                    message: 'User not found in organization'
                                  });
                                });
                          })
                          .catch(() => {
                            return res.status(500).send({
                              message: 'Error in saving user organization history'
                            });
                          });
                    })
                    .catch(() => {
                      return res.status(500).send({
                        message: 'User not found 2 in organization'});
                    });
              })
              .catch(() => {
                return res.status(500).send({message: 'User not found'});
              });
        }
      })
      .catch(() => {
        return res.status(404).send({ message: 'Unauthorized access' });
      });
}

function getUserByUsername(req, res) {
  const displayUsername = req.body.username;
  if (typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)) {
    return res.status(500).send({ message: 'Request validation failed' });
  }
  const username = normalizeUsername(displayUsername);
  return Username.findOne({username: username, current: true})
      .then((returnUser) => {
        return res.send(returnUser);
      })
      .catch(() => {
        return res.status(500).send({message: 'Username not found'});
      });
}
