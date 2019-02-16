
const usernameRegex = /^[a-z0-9]*$/;
const displayUsernameRegex = /^[a-zA-Z0-9_.-]*$/;


export {
  isValidUsername,
  isValidDisplayUsername,
  normalizeUsername,
  usernameRegex,
  displayUsernameRegex,
};

/**
 *
 * @param {string} username
 * @return {boolean}
 */
function isValidUsername(username) {
  return usernameRegex.test(username);
}

/**
 *
 * @param {string} username
 * @return {boolean}
 */
function isValidDisplayUsername(username) {
  return displayUsernameRegex.test(username);
}

/**
 *
 * @param {string} username
 * @return {string}
 */
function normalizeUsername(username) {
  return username
      .split('.').join('')
      .split('_').join('')
      .split('-').join('')
      .toLowerCase();
}
