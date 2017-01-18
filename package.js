Package.describe({
  name: 'jkuester:remote-collections-provider',
  version: '0.1.1',
  // Brief, one-line summary of the package.
  summary: 'Optional default provider for jkuester:remote-collections',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/jankapunkt/meteor-remote-collections-provider.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2.3');
  api.use('ecmascript');
  api.use('check');
  api.mainModule('remote-collections-provider.js', "server");
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('check');
  api.use('audit-argument-checks');
  api.use('jkuester:remote-collections-provider');
  api.mainModule('remote-collections-provider-tests.js', "server");
});
