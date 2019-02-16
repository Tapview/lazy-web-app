import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
  userId: { type: String },
  givenName: { type: String },
  familyName: { type: String },
  email: { type: String },
  isFavorite: { type: Boolean},
  }
);


ContactSchema.index({userId: 1});
ContactSchema.index({userId: 1, givenName: 1});
ContactSchema.index({userId: 1, familyName: 1});
ContactSchema.index({userId: 1, isFavorite: 1});

module.exports = mongoose.model('Contact', ContactSchema);
