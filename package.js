Package.describe({
  name: 'jkuester:remote-collections-provider',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2.3');
  api.use('ecmascript');
  api.use('check');
  api.mainModule('remote-collections-provider.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('check');
  api.use('remote-collections-provider');
  api.mainModule('remote-collections-provider-tests.js');
});
