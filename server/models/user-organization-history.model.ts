import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const UserOrganizationHistorySchema = new Schema ({
  userId: {type: String},
  orgId: {type: String},
  timestamp: {type: Date},
  action: {type: String},
  state: {type: Object},
});

UserOrganizationHistorySchema.index({userId: 1});
module.exports = mongoose.model('UserOrganizationHistory', UserOrganizationHistorySchema);
