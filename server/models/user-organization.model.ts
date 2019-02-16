import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const UserOrganizationSchema = new Schema({
  userId: {type: String},
  orgId: {type: String},
  roles: [{type: String}],
});

UserOrganizationSchema.index({userId: 1});
UserOrganizationSchema.index({orgId: 1});
UserOrganizationSchema.index({userId: 1, orgId: 1});

module.exports = mongoose.model('UserOrganization', UserOrganizationSchema);
