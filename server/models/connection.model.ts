import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const ConnectionSchema = new Schema({
  userId: { type: String },
  connectionId: { type: String },
  status: { type: String },
  permissions: { type: Array },
  connectionRequestRef: { type: String },
  connectionTimestamp: { type: Number },
}
);

ConnectionSchema.index({ userId: 1 });
ConnectionSchema.index({ connectionId: 1 });
ConnectionSchema.index({ connectionRequestRef: 1 });
ConnectionSchema.index({ userId: 1, connectionId: 1 });


module.exports = mongoose.model('Connection', ConnectionSchema);
