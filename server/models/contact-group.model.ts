import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const ContactGroupSchema = new Schema({
  groupId: { type: String },
  groupName: { type: String },
  userId: { type: String },
  creationTime: { type: Number, default: Date.now() },
}
);

ContactGroupSchema.index({ userId: 1, groupId: 1 });
ContactGroupSchema.index({ groupId: 1 });
ContactGroupSchema.index({ userId: 1 });
ContactGroupSchema.index({ userId: 1, groupName: 1 });


module.exports = mongoose.model('ContactGroup', ContactGroupSchema);
