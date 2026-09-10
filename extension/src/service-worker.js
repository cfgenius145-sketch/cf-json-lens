/*
 * Manifest V3 allows exactly one service_worker file, whereas Manifest V2
 * accepted a list of background scripts. This entry point exists solely to
 * pull in both original background modules.
 */
require('./backend');
require('./omnibox');
