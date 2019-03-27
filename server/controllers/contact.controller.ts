import * as validator from 'validator';
import { uploadSingleImage } from '../services/image-upload';
const Contact = require('../models/contact.model');
const ContactGroup = require('../models/contact-group.model');
const ContactGroupMembers = require('../models/contact-group-contact.model');
const auth = require('./jwt-auth.controller');

module.exports = function(app) {
  app.post('/api/contacts/add', auth.jwt, addContact);
  app.post('/api/contacts/delete', auth.jwt, deleteContact);
  app.post('/api/contacts/edit', auth.jwt, editContact);
  app.post('/api/contacts/view', auth.jwt, getContactSummary);
  app.post('/api/contacts/details', auth.jwt, getContactDetails);
  app.post('/api/contacts/group/get-groups', auth.jwt, getGroups);
  app.post('/api/contacts/group/get-contacts', auth.jwt, groupGetContacts);
  app.post('/api/contacts/group/view', auth.jwt, getGroupsSummary);
  app.post('/api/contacts/group/add', auth.jwt, addGroup);
  app.post('/api/contacts/group/delete', auth.jwt, deleteGroup);
  app.post('/api/contacts/group/remove-contact', auth.jwt, deleteGroupContact);
  app.post('/api/contacts/group/edit', auth.jwt, editGroup);
  app.post('/api/contacts/image-upload', auth.jwt, imageUpload);
};


/**
 * join a contact group
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function addContact(req, res) {
  const userId = req.userId;
  const email = req.body.email;
  const givenName = req.body.givenName;
  const familyName = req.body.familyName;
  const contactGroupIds = req.body.contactGroupIds;

  // Validate
  if (typeof givenName !== 'string' ||
      typeof familyName !== 'string' ||
      !validator.isEmail(email) ) {
    return res.status(422).json({ message: 'Request failed validation' });
  }
  const contact = new Contact({
    userId,
    email,
    givenName,
    familyName,
  });
  return contact.save()
      .then(result => {
        const promiseArray: Promise<any>[] = [];
        for (const i of contactGroupIds) {
          const contactGroupMembers = new ContactGroupMembers({
            userId: userId,
            contactId: result._id,
            groupId: i,
          });
          const saveEvent = contactGroupMembers.save();
          promiseArray.push(saveEvent);
        }
        return Promise.all(promiseArray)
            .then(contactGroupResult => {
                return res.send({ message: 'Success.', contactId: result._id });
            })
            .catch(error => {
              return res.status(500).send(
                  { message: 'Problem creating contacts group.'});
            });
      })
      .catch(error => {
        return res.status(500).send(
            { message: 'Problem saving contacts.'});
      });
}



/**
 * edit a contact group
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function editContact(req, res) {
  const userId = req.userId;
  const email = req.body.email;
  const givenName = req.body.givenName;
  const familyName = req.body.familyName;
  const contactGroupIds = req.body.contactGroupIds;
  const contactId = req.body.contactId;
  // Validate
  if (typeof contactId !== 'string' ||
      typeof givenName !== 'string' ||
      typeof familyName !== 'string' ||
      typeof email !== 'string' ||
      !validator.isEmail(email) ) {
    return res.status(422).json({ message: 'Request failed validation.' });
  }

  return Contact.findOneAndUpdate({
          userId,
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
        return ContactGroupMembers.deleteMany({ userId, contactId })
            .then(() => {
              const promiseArray: Promise<any>[] = [];
              for (const i of contactGroupIds) {
                const contactGroupMembers = new ContactGroupMembers({
                  userId: userId,
                  contactId: contactId,
                  groupId: i,
                });
                const saveEvent = contactGroupMembers.save();
                promiseArray.push(saveEvent);
              }
              return Promise.all(promiseArray)
                  .then(contactGroupResult => {
                      return res.send({ message: 'Contact updated.' });
                    })
                    .catch(errorResult => {
                      return res.status(500).send(
                        { message: 'Problem creating contacts group.'});
                    });
                  })
                .catch(error => {
                  res.status(500).send(
                    { message: 'Could not update contact.' });
                });
        })
        .catch(error => {
          res.status(500) .send(
            { message: 'Could not update contact.' });
        });
}


/**
 * delete a contact
 * @param {*} req request object
 * @param {*} res response object
 * @return {*}
 */
function deleteContact(req, res) {
  const userId = req.userId;
  const contactId = req.body.contactId;
  // Validate
  if (typeof contactId !== 'string') {
    return res.status(422).json({ message: 'Contact failed validation.' });
  }

  return ContactGroupMembers.deleteMany({ userId, contactId })
      .then(() => {
        return Contact.deleteMany({ _id: contactId, userId: userId })
            .then(() => {
              return res.send({ message: 'Contact deleted.' });
            })
            .catch(error => {
              return res.status(500).send(
                    { message: 'Problem removing contacts.'});
            });
      })
      .catch(error => {
        return res.status(500).send(
              { message: 'Problem removing contacts.'});
      });
}


/**
 * returns contacts summary
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function getContactSummary(req, res) {
  const userId = req.userId;
  return Contact.find({ userId: userId })
      .then(contactsArr => {
        const contactId = contactsArr.map((x => x._id));
        return ContactGroupMembers.find(
              { userId: userId, contactId: { $in: contactId } },
              { contactId: 1, groupId: 1, userId: 1 })
            .then(result => {
              const contacts = [];
              for (let index = 0; index < contactsArr.length; index++) {
                const groupsArr = result.filter(element =>
                    String(element.contactId) ===
                    String(contactsArr[index]['_id']));
                const groupsIdArr = [];
                for (const i of groupsArr) {
                  groupsIdArr.push(i.groupId);
                }
                contacts.push({
                  _id: contactsArr[index]._id,
                  givenName: contactsArr[index].givenName,
                  familyName: contactsArr[index].familyName,
                  groupId: groupsIdArr,
                  contactImage: contactsArr[index].contactImage,
                });
              }
              res.send(contacts);
            })
            .catch(error => {
              return res.status(500).send(
                  { message: 'Error retrieving groups from database..' });
            });
      })
      .catch(error => {
        return res.status(500).send(
            { message: 'Error retrieving groups from database.' });
      });
}


/**
 * returns contact details
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function getContactDetails(req, res) {
  const userId = req.userId;
  const contactId = req.body.contactId;
  // Validate
  if (typeof contactId !== 'string') {
    return res.status(422).json({ message: 'Contact failed validation.' });
  }
  return Contact.findOne({ userId: userId, _id: contactId },
        { userId: 1, givenName: 1, familyName: 1, email: 1, contactImage: 1 })
      .then(resultContact => {
        return ContactGroupMembers.find(
              { userId: userId, contactId: resultContact._id },
              {groupId: 1, _id: 0})
            .then ( result => {
              const resultsFiltered = {
                givenName: resultContact.givenName,
                familyName: resultContact.familyName,
                email: resultContact.email,
                groups: result,
                contactImage: resultContact.contactImage,
              };
              return res.send(resultsFiltered);
            })
            .catch(error => {
              return res.status(500).send(
                  { message: 'Error retrieving user from contacts database.' });
            });
      })
      .catch(error => {
        return res.status(500).send(
            { message: 'Error retrieving user from contacts database.' });
      });
}



/**
 * returns all groups counted
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function getGroupsSummary(req, res) {
  const userId = req.userId;
  return ContactGroup.find({ userId: userId })
      .then(groupIdArr => {
        const promiseArray: Promise<any>[] = [];
        for (const i of groupIdArr) {
          const getContactPromise = ContactGroupMembers.countDocuments({
            userId: userId,
            groupId: i._id,
          });
          promiseArray.push(getContactPromise);
        }
        return Promise.all(promiseArray)
            .then(resultArray => {
              const groupResults = [];
              for ( let i = 0; i < groupIdArr.length; i++ ) {
                groupResults.push({_id: groupIdArr[i]._id,
                    groupName: groupIdArr[i].groupName,
                    numberOfContacts: resultArray[i] });
              }
              return res.send(groupResults);
            })
            .catch(error => {
              return res.status(500).send(
                  { message: 'Error retrieving groups from database.' });
            });
      })
      .catch(error => {
        return res.status(500).send(
            { message: 'Error retrieving groups from database.' });
      });
}


/**
 * add a group
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function addGroup(req, res) {
  const userId = req.userId;
  const groupName = req.body.groupName;
  // Validate
  if (typeof groupName !== 'string') {
    return res.status(422).json({ message: 'Request failed validation.' });
  }
  return ContactGroup.findOne({ userId, groupName: groupName })
      .then(resultGroupName => {
        if (resultGroupName !== null) {
          if (groupName === resultGroupName.groupName) {
            return res.send({ message: 'Group already exist.' });
          }
        } else {
          const contactGroup = new ContactGroup({
            groupName: groupName,
            userId,
          });
          return contactGroup.save()
              .then(result => {
                return res.send({ message: 'Success.' });
              })
              .catch(error => {
                return res.status(500).send(
                    { message: 'Problem creating a group.'});
              });
        }
      })
      .catch(error => {
        return res.status(500).send(
            { message: 'Problem finding a group.'});
      });
}




/**
 * delete a group
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function deleteGroup(req, res) {
  const userId = req.userId;
  const groupId = req.body.groupId;

  // Validate
  if (typeof groupId !== 'string' ) {
    return res.status(422).json({ message: 'Contact failed validation.' });
  }

  return ContactGroupMembers.deleteMany({ groupId, userId })
      .then(() => {
        return ContactGroup.deleteMany({ _id: groupId, userId: userId })
            .then(() => {
              return res.send({ message: 'Group deleted.' });
            })
            .catch(error => {
              return res.status(500).send(
                { message: 'Problem removing group.' });
            });
      })
      .catch(error => {
        return res.status(500).send(
          { message: 'Problem removing group contacts.' });
      });
}



/**
 * remove a contact from a group
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function deleteGroupContact(req, res) {
    const userId = req.userId;
    const contactId = req.body.contactId;

    // Validate
    if (typeof contactId !== 'string' ) {
      return res.status(422).json({ message: 'Contact failed validation.' });
    }

    return ContactGroupMembers.deleteMany({ userId, contactId })
        .then(() => {
          return res.send({ message: 'Contact removed.' });
        })
        .catch(error => {
          return res.status(500).send(
              { message: 'Problem removing contact.'});
        });
    }



/**
 * edit group name
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function editGroup(req, res) {
  const userId = req.userId;
  const groupId = req.body.groupId;
  const updatedGroupName = req.body.updatedGroupName;
  // Validate
  if (typeof groupId !== 'string' ||
    typeof updatedGroupName !== 'string') {
    return res.status(422).json({ message: 'Request failed validation.' });
  }

  return ContactGroup.findOneAndUpdate({
        userId,
        _id: groupId,
      },
      {
        $set:
        {
          groupName: updatedGroupName,
        }
    })
    .then(() => {
      return res.send(
          { message: 'Group updated.' });
    })
    .catch(error => {
      res.status(500).send(
          { message: 'Could not update Group.' });
    });
}


/**
 * returns all groups
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function groupGetContacts(req, res) {
  const userId = req.userId;
  const groupId = req.body.groupId;
  // Validate
  if (typeof groupId !== 'string') {
    return res.status(422).json({ message: 'Request failed validation.' });
  }
  return ContactGroupMembers.find({ userId, groupId })
      .then((result) => {
        const contactId = result.map((x => x.contactId));
        return Contact.find({ userId: userId, _id: { $in: contactId } },
              { contactId: 1, givenName: 1, familyName: 1, email: 1 })
            .then((filteredResult) => {
              return res.send(filteredResult);
            })
            .catch(error => {
              res.status(500).send(
                  { message: 'Problem finding contacts.' });
            });
      })
      .catch(error => {
        res.status(500).send(
            { message: 'Problem finding group.' });
      });
}



/**
 * returns groups of contacts
 * @param {*} req request object
 * @param {*} res response object
 * @returns {*}
 */
function getGroups(req, res) {
  const userId = req.userId;

  return ContactGroup.find({ userId: userId }, { groupName: 1 })
      .then(result => {
        return res.send(result);
      })
      .catch(error => {
        res.status(500).send(
            { message: 'Problem finding groups.' });
      });
}


// contact logo upload
function imageUpload(req, res) {

  const userId = req.userId;
  const contactId = req.query.id;
  if (typeof userId !== 'string') {
    return res.status(500).send({ message: 'Request validation failed' });
  }

  return uploadSingleImage(req, res, function (err) {
    if (err) {
      return res.status(422).send({
        errors: [{ title: 'Image Upload error', detail: err.message }]
      });
    }
    return Contact.findOne({ '_id': contactId })
      .then((result) => {
        result.contactImage = req.file.fileLocation;
        return result.save()
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
      .catch((error) => {
        return res.status(500).send({
          message: error
        });
      });
  });
}
