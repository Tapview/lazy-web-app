import * as validator from 'validator';
const MailingList = require('../models/mailing-list.model');
const emailService = require('../services/email.service');
const MailingListStats = require('../models/mailing-list-stats.model');
const statsService = require('../services/stats.service');

module.exports = function(app) {
  app.post('/api/join-mailing-list', joinMailingList);
};

/**
 * join a mailing list
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function joinMailingList(req, res) {
  const email = req.body.email;
  const givenName = req.body.givenName;
  const familyName = req.body.familyName;
  // Validation
  if (typeof email !== 'string' ||
      typeof givenName !== 'string' ||
      typeof familyName !== 'string' ||
      !validator.isEmail(email)
    ) {
    return res.status(422).json({message: 'Request failed validation'});
  }

  const mailingListUser = new MailingList();
  mailingListUser.email = email;
  mailingListUser.givenName = givenName;
  mailingListUser.familyName = familyName;
  return mailingListUser.save()
      .then((result) => {
        res.send({message: 'Success'});
        return statsService.increment(MailingListStats)
            .catch((err) => {
              console.log('Error in the stats service');
            });
      })
      .then(() => {
        return emailService.addUserToMailingList({
              givenName, familyName, email,
            })
            .catch((err) => {
              console.log('Error in the mailing list service');
            });
      })
      .then(() => {
        return emailService.sendMailingListWelcome({
              givenName, familyName, email,
            })
            .catch((err) => {
              console.log('Error in the send email service');
            });
      })
      .catch((error) => {
        console.log('Error in saving mailing list user.');
        return res.status(500).json({message: error.message});
      });
}

