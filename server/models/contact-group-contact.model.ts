import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const ContactGroupMembersSchema = new Schema({
  contactId: { type: String },
  groupId: { type: String },
  userId: { type: String},
}
);

ContactGroupMembersSchema.index({ contactId: 1, groupId: 1 });
ContactGroupMembersSchema.index({ groupId: 1, contactId: 1 });
ContactGroupMembersSchema.index({ userId: 1, groupId: 1 });


module.exports = mongoose.model('ContactGroupMembers', ContactGroupMembersSchema);
