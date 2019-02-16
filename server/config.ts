import * as path from 'path';
process.env.CONNECTION_TIMEOUT = (new Date().getTime() + 10 * (1000 * 60 * 60 * 24)).toString();
process.env.JWT_EXPIRY = (10 * 60 * 1000).toString(); // Expiry in ms (10 mins), stored as string
process.env.JWT_REFRESH_TOKEN_EXPIRY = (365 * 24 * 60 * 60 * 1000).toString(); // Expiry in ms (1 year), stored as string
process.env.JWT_TEMPORARY_LINK_TOKEN_EXPIRY = (60 * 60 * 1000).toString(); // Expiry in ms (1 hour), stored as string
process.env.XSRF_EXPIRY = (20 * 365 * 24 * 60 * 60 * 1000).toString(); // Expiry in ms (20 year), stored as string

if (process.env.ENV_FILE_PRESENT !== 'true') {
  throw new Error('.env file appears to be missing. Try copying ".env.example" and renaming to ".env"');
}

let isLocal = true;
if (process.env.CLOUD_HOST === 'gcloud') {
  // Check if actually on gcloud, or local
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    isLocal = false;
  }
} else {
  throw new Error('Unknown CLOUD_HOST setting');
}

process.env.IS_LOCAL = isLocal ? 'true' : 'false';

// Default to development
process.env.NODE_ENV = 'development';

// If on Google servers, and named '...-dev' set dev environment
if (process.env.GOOGLE_CLOUD_PROJECT &&
    !process.env.GOOGLE_CLOUD_PROJECT.endsWith('-dev')) {
  process.env.NODE_ENV = 'production';
}

if (isLocal) {
  process.env.URL_ORIGIN = process.env.URL_ORIGIN_LOCAL;
} else if (process.env.NODE_ENV === 'production') {
  process.env.URL_ORIGIN = process.env.URL_ORIGIN_PROD;
} else {
  process.env.URL_ORIGIN = process.env.URL_ORIGIN_DEV;
}

if (isLocal) {
  process.env.MONGODB_URI = process.env.MONGODB_URI_LOCAL;
} else if (process.env.NODE_ENV === 'production') {
  process.env.MONGODB_URI = process.env.MONGODB_URI_PROD;
} else {
  process.env.MONGODB_URI = process.env.MONGODB_URI_DEV;
}

if (typeof process.env.AWS_BUCKET !== 'undefined') {
  process.env.IMAGE_SERVICE = 'aws';
} else if (typeof process.env.GCS_BUCKET !== 'undefined') {
  process.env.IMAGE_SERVICE = 'gcs';
} else {
  process.env.IMAGE_SERVICE = 'local';
  if (typeof process.env.LOCAL_IMAGE_SAVE_LOCATION === 'undefined') {
    process.env.LOCAL_IMAGE_SAVE_LOCATION = '../local-image-store';
  }
  process.env.LOCAL_IMAGE_SAVE_LOCATION_ABSOLUTE = path.join(__dirname, process.env.LOCAL_IMAGE_SAVE_LOCATION);
}
