import * as mongoose from 'mongoose';
(<any>mongoose).Promise = Promise;
const Schema = mongoose.Schema;

const ContactListSchema = new Schema({
  listId: { type: String }, // auto gen
  listName: { type: String }, // custom
  refId: { type: String }, // who owns it 'contact admin id'
  creationTime: { type: Number, default: Date.now() },
}
);

ContactListSchema.index({ refId: 1, listId: 1 });
ContactListSchema.index({ listId: 1 });
ContactListSchema.index({ refId: 1 });
ContactListSchema.index({ refId: 1, listName: 1 });


module.exports = mongoose.model('ContactList', ContactListSchema);
