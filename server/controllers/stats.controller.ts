
// const statsService = require('../services/stats.service');
const auth = require('./jwt-auth.controller');

const MailingList = require('../models/mailing-list.model');
const MailingListStats = require('../models/mailing-list-stats.model');
const User = require('../models/user.model');
const UserStats = require('../models/user-stats.model');


module.exports = function(app) {
  app.post('/api/admin/mailing-list-count', auth.jwt, auth.isAdmin,
      mailingListCount);
  app.post('/api/admin/mailing-list-stats', auth.jwt, auth.isAdmin,
      mailingListStatsReport);
  app.post('/api/admin/user-register-count', auth.jwt, auth.isAdmin,
      userRegisterCount);
  app.post('/api/admin/user-register-stats', auth.jwt, auth.isAdmin,
      userRegisterStatsReport);
};


/**
 * /api/admin/mailing-list-count
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function mailingListCount(req, res) {
  // Validation
  // ...

  return MailingList.count()
        .then((count) => {
          res.send({count: count});
        });
}


/**
 * /api/admin/user-register-stats
 * @param {*} req request object
 * @param {*} res response object
 */
function mailingListStatsReport(req, res) {
  // Validation
  // not necessary as not using req.body

  MailingListStats.find({}, {time: 1, count: 1})
      .then((results) => {
        const resultsFiltered = results.map((x) => {
            return {time: x.time.getTime(), value: x.count};
        });
        res.send(resultsFiltered);
      })
      .catch((err) => {
        res.status(500)
            .send({message: 'Error retrieving data from stats database'});
      });
}


/**
 * /api/admin/user-register-count
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function userRegisterCount(req, res) {
  // Validation
  // not necessary as not using req.body

  return User.count()
      .then((count) => {
        res.send({count: count});
      });
}


/**
 * /api/admin/user-register-stats-report
 * @param {*} req request object
 * @param {*} res response object
 */
function userRegisterStatsReport(req, res) {
  // Validation
  // not necessary as not using req.body

  UserStats.find({}, {time: 1, count: 1})
      .then((results) => {
        const resultsFiltered = results.map((x) => {
            return {time: x.time.getTime(), value: x.count};
        });
        res.send(resultsFiltered);
      })
      .catch((err) => {
        res.status(500)
            .send({message: 'Error retrieving data from stats database'});
      });
}
