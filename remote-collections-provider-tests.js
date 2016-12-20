// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by remote-collections-provider.js.
import { name as packageName } from "meteor/remote-collections-provider";

// Write your tests here!
// Here is an example.
Tinytest.add('remote-collections-provider - example', function (test) {
  test.equal(packageName, "remote-collections-provider");
});
