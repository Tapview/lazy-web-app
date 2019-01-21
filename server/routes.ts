const mailingListController =
    require('./controllers/mailing-list.controller');
const authenticationController =
    require('./controllers/authentication.controller');
const statsController =
    require('./controllers/stats.controller');
const profileController =
    require('./controllers/profile-controller');
const contactController =
    require('./controllers/contact.controller');
const testapiController =
    require('./controllers/authentication.controller');

module.exports = function(app) {
  mailingListController(app);
  authenticationController(app);
  statsController(app);
  profileController(app);
  contactController(app);
  testapiController(app);
};

