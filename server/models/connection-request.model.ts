import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const ConnectionRequestSchema = new Schema({
  senderUserId: { type: String },
  receiverUserId: { type: String },
  sendTimestamp: { type: Number },
  permissions: { type: Array },
  timeout: {type: Number },
  active: { type: Boolean },
  updateTimestamp: {type: Number },
  currentStatus: {type: String },
  snoozed: {type: Boolean },
}
);

ConnectionRequestSchema.index({ senderUserId: 1 });
ConnectionRequestSchema.index({ receiverUserId: 1 });
ConnectionRequestSchema.index({ senderUserId: 1, receiverUserId: 1, active: 1 });
ConnectionRequestSchema.index({ receiverUserId: 1, active: 1, timeout: 1 });
ConnectionRequestSchema.index({ receiverUserId: 1, active: 1, snoozed: 1 });


module.exports = mongoose.model('ConnectionRequest', ConnectionRequestSchema);
