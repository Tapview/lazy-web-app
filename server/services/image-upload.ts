import * as multer from 'multer';
import * as aws from 'aws-sdk';
import * as multerS3 from 'multer-s3';
const multerGoogleStorage = require('multer-google-storage');
const crypt = require('crypto');

 // The selection between GCS and AWS is made using the .env file and the
 // config.ts file.
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only JPEG and PNG is allowed!'), false);
  }
};

let multerStore: any;

export function uploadSingleImage(req, res, callBack) {
  multerStore.single('image')(req, res, function(err) {
    if (process.env.IMAGE_SERVICE === 'aws') {
      req.file.fileLocation = req.file.location;
    } else if (process.env.IMAGE_SERVICE === 'gcs') {
      req.file.fileLocation = req.file.path;
    } else { // LOCAL_IMAGE_SAVE_LOCATION_ABSOLUTE
      req.file.fileLocation = req.file.filename;
    }
    callBack(err);
  });
}

// Local Disk Storage
if (process.env.IMAGE_SERVICE === 'local') {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, process.env.LOCAL_IMAGE_SAVE_LOCATION_ABSOLUTE);
      },
      filename: function(req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        const array = new Uint32Array(1);
        crypt.randomFillSync(array);
        cb(null, 'img-' + Date.now() + '-' +  array[0] + '.' + ext);
      }
    });
    multerStore = multer({fileFilter, storage});
} else if (process.env.IMAGE_SERVICE === 'gcs') {
    multerStore = multer({
      fileFilter,
      storage: multerGoogleStorage.storageEngine({
        acl: 'publicread',
        bucket: process.env.GCS_BUCKET,
      }),
    });
} else {
    const s3 = new aws.S3();
    multerStore = multer({
      fileFilter,
      storage: multerS3({
        acl: 'public-read',
        s3: s3,
        bucket: process.env.AWS_BUCKET,
        metadata: function(req, file, cb) {
          cb(null, {fieldName: 'Testing_Metadata'});
        },
        key: function(req, file, cb) {
          cb(null, Date.now().toString());
        },
      }),
    });
}
