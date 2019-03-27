import { isValidDisplayUsername, normalizeUsername } from './utils.controller';
const ConnectionRequest = require('../models/connection-request.model');
const Connection = require('../models/connection.model');
const User = require('../models/user.model');
const Username = require('../models/username.model');
const auth = require('./jwt-auth.controller');

module.exports = function (app) {
  app.post('/api/connection/add-request', auth.jwt, addRequest);
  app.post('/api/connection/get-pending-requests', auth.jwt, getPendingRequests);
  app.post('/api/connection/get-connections', auth.jwt, getConnections);
  app.post('/api/connection/action-request', auth.jwt, actionConnectionRequest);
  app.post('/api/connection/get-pending-request-count', auth.jwt, getPendingRequestCount);
  app.post('/api/connection/get-connection-count', auth.jwt, getConnectionCount);
  app.post('/api/connection/get-sent-request', auth.jwt, getSentRequests);
  app.post('/api/connection/remove-connection', auth.jwt, removeConnection);
  app.post('/api/connection/get-connections-details', auth.jwt, getPendingConnectionDetails);

};

/**
 * join a connection list
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function addRequest(req, res) {
  // Save the login userId
  const userId = req.userId;
  const displayUsername = req.body.username;
  // Validate
  if (typeof displayUsername !== 'string' ||
      !isValidDisplayUsername(displayUsername)
      ) {
    return res.status(422).json({ message: 'Request failed validation' });
  }
  const username = normalizeUsername(displayUsername);
  // Check if the user exist
  return Username.findOne({username, type: 'user'})
      .then((resultUsername) => {
        const receivingUserId = resultUsername.refId;
        if (userId === receivingUserId) {
          return res.status(500).send({ message: 'Cannot add same user' });
        }
        return Connection.findOne({
              userId,
              connectionId: receivingUserId,
              status: 'connected'
            })
            .then((resultConnection) => {
              if ( resultConnection !== null ) {
                return res.status(500).send({ message: 'Already connected' });
              }
              return ConnectionRequest.findOne({
                    senderUserId: userId,
                    receiverUserId: receivingUserId,
                    active: { $eq: true },
                  })
                  .then((resultConnectionRequest) => {
                    if ( resultConnectionRequest !== null ) {
                      return res.status(500).send({ message: 'Already connected' });
                    }
                    // Making new connection
                    const connectionReq = new ConnectionRequest();
                    connectionReq.senderUserId = userId;
                    connectionReq.receiverUserId = receivingUserId;
                    connectionReq.permissions = ['default'];
                    connectionReq.active = true;
                    connectionReq.snoozed = false;
                    connectionReq.timeout = Number( process.env.CONNECTION_TIMEOUT);
                    connectionReq.sendTimestamp = Date.now();
                    connectionReq.updateTimestamp = Date.now();
                    return connectionReq.save()
                        .then(() => {
                          return res.send({ message: 'Success' });
                        })
                        .catch((error) => {
                          return res.status(500)
                              .json({ message: 'Could not save connection request'});
                        });
                  })
                  .catch(() => {
                    return res.status(500)
                        .send({ message: 'Problem finding connection requests'});
                  });
            });
        })
        .catch(() => {
          return res.status(500)
              .send( 'Problem finding connections' );
        });
}


/**
 * return list of pending users
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function getPendingRequests(req, res) {
  // Check pending for snooze
  function checkExpiredRequests() {
    return ConnectionRequest.updateMany({
      receiverUserId: req.userId,
      active: { $eq: true },
      timeout: { $lt: Date.now() },
      },
      {
        active: false,
        currentStatus: 'expired'
      })
      .catch((err) => {
          res.status(500).send({ message: 'Error retrieving pending requests' });
        });
  }

  function findPendingConnections() {
    return ConnectionRequest.find({
          receiverUserId: req.userId,
          active: { $eq: true },
          snoozed: { $eq: false },
        })
        .then((result) => {
          const senderIdArr = result.map((e => e.senderUserId));
          return User.find({ '_id': { '$in': senderIdArr } })
              .then((filteredResults) => {
                  const resultsFiltered = filteredResults.map((x) => {
                    return {
                      username: x.username,
                      givenName: x.givenName,
                      familyName: x.familyName,
                      userId: x._id,
                    };
                  });
                  res.send(resultsFiltered);
                })
                .catch((err) => {
                  res.status(500).send({ message: 'Error retrieving pending requests' });
                });
        })
        .catch((err) => {
          res.status(500).send({ message: 'Error retrieving pending requests' });
        });
  }

  return checkExpiredRequests()
      .then(findPendingConnections);
}


/**
 * request user connection based on status { Confirmed }
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function getConnections(req, res) {
  return Connection.find(
      {
        userId: req.userId,
        status: { $eq: 'connected' },
      })
      .then((result) => {
        const senderIdArr = result.map((e => e.connectionId));
        return User.find({ '_id': { '$in': senderIdArr } })
            .then((filteredResults) => {
              const resultsFiltered = filteredResults.map((x) => {
                return {
                  username: x.username,
                  givenName: x.givenName,
                  familyName: x.familyName,
                  userId: x._id,
                };
              });
              res.send(resultsFiltered);
            })
            .catch((err) => {
              res.status(500).send({ message: 'Error retrieving confirmed connections' });
            });
      })
      .catch((err) => {
        res.status(500)
            .send({ message: 'Error retrieving confirmed connections' });
      });
}


/**
 * action connection {accept, cancel or ignore}
 * @param req request object
 * @param res response object
 */
function actionConnectionRequest(req, res) {
  // Save the login userId
  const userId = req.userId;
  const action = req.body.action;
  const senderUserId = req.body.senderUserId;
  // Validate
  if (typeof action !== 'string' ||
    typeof senderUserId !== 'string') {
    return res.status(422).json({ message: 'Request failed validation' });
  }

  switch (action) {
    case 'accept':
      acceptConnectionRequest();
      break;
    case 'cancel':
      cancelConnectionRequest();
      break;
    case 'reject':
      rejectConnectionRequest();
      break;
    default:
      res.status(422).send({ message: 'Could not action connection request' });
      break;
  }

  function acceptConnectionRequest() {
      return ConnectionRequest.findOneAndUpdate({
            senderUserId: senderUserId,
            receiverUserId: userId,
            active: { $eq: true }
          },
          {
            $set:
            {
              active: false,
              currentStatus: 'accepted',
              updateTimestamp: Date.now(),
            }
          })
          .then((result) => {
            const _connection1 = new Connection();
            _connection1.userId = userId;
            _connection1.connectionId = senderUserId;
            _connection1.status = 'connected';
            _connection1.permissions = ['default'];
            _connection1.connectionRequestRef = result._id;
            return _connection1.save()
                .then(() => {
                  const _connection2 = new Connection();
                  _connection2.connectionId = userId;
                  _connection2.userId = senderUserId;
                  _connection2.status = 'connected';
                  _connection2.permissions = ['default'];
                  _connection2.connectionRequestRef = result._id;
                  return _connection2.save()
                      .then(() => {
                        res.send({ message: 'Request accepted' });
                      })
                      .catch((err) => {
                        res.status(500).send({ message: 'Could not save connection requests' });
                      });
                })
                .catch(() => {
                  return res.status(500)
                      .send({ message: 'Could not save connection request' });
                });
          })
          .catch(() => {
            res.status(500).send({ message: 'Could not save connection request' });
          });
  }

  function cancelConnectionRequest() { // res, userId, senderUserId
    return ConnectionRequest.findOneAndUpdate({
          receiverUserId: senderUserId,
          senderUserId: userId,
          active: { $eq: true }
        },
        {
          $set:
          {
            active: false,
            currentStatus: 'cancelled',
            updateTimestamp: Date.now(),
          }
        })
        .then(() => {
          return res.send({ message: 'Request cancelled' });
        })
        .catch(() => {
          res.status(500)
              .send({ message: 'Could not cancel connection request' });
        });
  }

  function rejectConnectionRequest() {
    return ConnectionRequest.findOneAndUpdate({
          senderUserId: senderUserId,
          receiverUserId: userId,
          active: { $eq: true }
        },
        {
          $set:
          {
            active: false,
            currentStatus: 'rejected',
            updateTimestamp: Date.now(),
          }
        })
        .then(() => {
          return res.send({ message: 'Request rejected' });
        })
        .catch(() => {
          res.status(500)
              .send({ message: 'Could not reject connection request' });
        });
  }
}



/**
 * get pending request count
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function getPendingRequestCount(req, res) {
  // Save the login userId
  const userId = req.userId;
  return ConnectionRequest.count({
        receiverUserId: userId,
        active: { $eq: true },
      })
      .then((result) => {
        res.send({ message: result });
      })
      .catch((err) => {
        res.status(500).send({ message: 'Error retrieving pending requests count' });
      });
}

/**
 * count connection
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function getConnectionCount(req, res) {
  // Save the login userId
  const userId = req.userId;
  return Connection.count({
        userId,
        status: 'connected',
      })
      .then((result) => {
        res.send({ message: result });
      })
      .catch((err) => {
        res.status(500).send({ message: 'Error retrieving connection count' });
      });
}

/**
 * find all requests sent
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function getSentRequests(req, res) {
  return ConnectionRequest.find({
        senderUserId: req.userId,
        active: { $eq: true },
      })
      .then((result) => {
        const senderIdArr = result.map((e => e.receiverUserId));
        return User.find({ '_id': { '$in': senderIdArr } })
            .then((filteredResults) => {
              const resultsFiltered = filteredResults.map((x) => {
                return {
                  username: x.username,
                  givenName: x.givenName,
                  familyName: x.familyName,
                  userId: x._id,
                };
              });
              res.send(resultsFiltered);
            })
            .catch((err) => {
              res.status(500).send({ message: 'Error retrieving pending requests' });
            });
      })
      .catch((err) => {
        res.status(500).send({ message: 'Error retrieving pending requests' });
      });
}


/**
 * remove user connection
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function removeConnection(req, res) {
  // Save the login userId
  const userId = req.userId;
  const senderUserId = req.body.senderUserId;
  if (typeof senderUserId !== 'string') {
    return res.status(422).json({ message: 'Request failed validation' });
  }

  return Connection.findOneAndUpdate({
        connectionId: userId,
        userId: req.body.senderUserId,
        status: 'connected',
      },
      {
        status: 'disconnected',
      })
      .then((result) => {
        return Connection.findOneAndUpdate({
              connectionId: req.body.senderUserId,
              userId,
              status: 'connected',
            },
            {
              status: 'disconnected',
            })
            .then((returnedRes) => {
              return res.send({ message: 'Connection removed' });
            })
            .catch(() => {
              res.status(500)
                  .send({ message: 'Could not remove connection' });
            });
      })
      .catch(() => {
        res.status(500)
          .send({ message: 'Could not remove connection' });
      });
}


function getPendingConnectionDetails(req, res) {
    // Save the login userId
    const userId = req.userId;
    const senderUserId = req.body.senderUserId;
    // Validate
    if (typeof senderUserId !== 'string') {
      return res.status(422).json({ message: 'Request failed validation' });
    }
   return ConnectionRequest.findOne({
      senderUserId: senderUserId,
      receiverUserId: userId,
      active: true,
      snoozed: false,
    })
    .then((connectionDetails) => {
      return User.findOne({ '_id': connectionDetails.senderUserId })
          .then(user => {
            const resultsFiltered = {
              username: user.username,
              givenName: user.givenName,
              familyName: user.familyName,
              userId: user._id,
              sendTimestamp: connectionDetails.sendTimestamp,
            };
            res.send(resultsFiltered);
          })
          .catch((err) => {
            res.status(500).send({ message: 'Error retrieving request details' });
          });
    })
    .catch((err) => {
      res.status(500).send({ message: 'Error retrieving request details' });
    });
  }
