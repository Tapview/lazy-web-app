import * as validator from 'validator';
const Contact = require('../models/contact.model.js');
const auth = require('./jwt-auth.controller');

module.exports = function(app) {
  app.post('/api/contacts/add', auth.jwt, addContact);
  app.post('/api/contacts/remove', auth.jwt, removeContact);
  app.post('/api/contacts/update', auth.jwt, updateContact);
  app.post('/api/contacts/view', auth.jwt, viewContacts);
  app.post('/api/contacts/fav', auth.jwt, viewFavorites);
  app.post('/api/contacts/add-remove-fav', auth.jwt, addRemoveFavorites);
};


/**
 * join a contact list
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function addContact(req, res) {
  const userId = req.userId;
  const email = req.body.email;
  const givenName = req.body.givenName;
  const familyName = req.body.familyName;
  // Validate
  if (typeof givenName !== 'string' ||
      typeof familyName !== 'string' ||
      !validator.isEmail(email) ) {
    return res.status(422).json({ message: 'Request failed validation' });
  }

  const contact = new Contact({
    userId: userId,
    email,
    givenName,
    familyName,
    isFavorite: false,
  });
  return contact.save()
      .then((result) => {
        return res.send({ message: 'success' });
      })
      .catch((error) => {
        return res.status(500).send('Problem finding contacts.');
      });
}



/**
 * join a contact list
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function updateContact(req, res) {
  const userId = req.userId;
  const email = req.body.email;
  const givenName = req.body.givenName;
  const familyName = req.body.familyName;
  const contactId = req.body.contactId;
  // Validate
  if (typeof contactId !== 'string' ||
      typeof givenName !== 'string' ||
      typeof familyName !== 'string' ||
      !validator.isEmail(email) ) {
    return res.status(422).json({ message: 'Request failed validation' });
  }

  return Contact.findOneAndUpdate({
    userId: userId,
    _id: contactId,
    },
    {
      $set:
      {
        familyName: familyName,
        givenName: givenName,
        email: email,
      }
    })
    .then(() => {
      return res.send({ message: 'Contact updated' });
    })
    .catch(() => {
      res.status(500)
        .send({ message: 'Could not update contact.' });
    });
}


/**
 * join a contact list
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function removeContact(req, res) {
  const userId = req.userId;
  const contactId = req.body.contactId;
  // Validate
  if (typeof contactId !== 'string' ||
      typeof userId !== 'string' ||
      typeof contactId !== 'string' ) {
    return res.status(422).json({ message: 'Contact failed validation' });
  }

  return Contact.deleteOne( {_id: contactId } )
      .then(() => {
        return res.send({ message: 'Contact deleted' });
      })
      .catch((error) => {
        return res.status(500).send('Problem removing contacts.');
      });
}


/**
 * returns all users for now
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function viewContacts(req, res) {
  const userId = req.userId;
  Contact.find({ userId }).sort( {givenName: 1} )
      .then((result) => {
        const filteredResult = result.map((x) => {
          return {
            contactId: x._id,
            givenName: x.givenName,
            familyName: x.familyName,
            email: x.email,
            isFavorite: x.isFavorite,
          };
        });
        return res.send(filteredResult);
      })
      .catch(() => {
        return res.status(500).send({ message: 'Error retrieving users from contacts database' });
      });
}



/**
 * returns all users for now
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function viewFavorites(req, res) {
  const userId = req.userId;
  Contact.find({ userId, isFavorite: true })
      .then((result) => {
        const filteredResult = result.map((x) => {
          return {
            givenName: x.givenName,
            familyName: x.familyName,
            email: x.email,
          };
        });
        return res.send(filteredResult);
      })
      .catch(() => {
        return res.status(500).send({ message: 'Error retrieving users from contacts database' });
      });
}


/** add to favorite list
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function addRemoveFavorites(req, res) {
  const userId = req.userId;
  const contactId = req.body.contactId;
  const action = req.body.action;
  // Validate
  if (typeof contactId !== 'string' ||
      typeof action !== 'string' ) {
    return res.status(422).json({ message: 'Contact failed validation' });
  }

  return Contact.findOneAndUpdate({
    _id: contactId,
    userId: userId,
    },
    {
      $set:
      {
        isFavorite: (action === 'add'),
      }
    })
    .then(() => {
      return res.send({ message: 'Contact modified' });
    })
    .catch(() => {
      res.status(500)
        .send({ message: 'Could not modify contact.' });
    });
}
