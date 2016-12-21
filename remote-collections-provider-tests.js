// Import Tinytest from the tinytest Meteor package.
import {Tinytest} from "meteor/tinytest";
// Import and rename a variable exported by remote-collections-provider.js.
import {RemoteCollectionsProvider} from "meteor/jkuester:remote-collections-provider";

import {} from 'meteor/audit-argument-checks';

////////////////////////////////////////////////////////////////////////////////////////////////////
//
//      STARTUP / INITIAL VALUES
//
////////////////////////////////////////////////////////////////////////////////////////////////////


Tinytest.add('remote-collections-provider - startup - import working as expected', function (test) {
    testExists(test, RemoteCollectionsProvider, "RemoteCollectionsProvider");
});

Tinytest.add('remote-collections-provider - startup - there are default methods on startup', function (test) {
    const defaultMethods = RemoteCollectionsProvider.getAllMethodNames();
    testExists(test, defaultMethods);
    test.equal(defaultMethods.length, 3); //there are three default methods
});

Tinytest.add('remote-collections-provider - startup - there are default callable via Meteor.call on startup', function (test) {
    testMethodCall(test, RemoteCollectionsProvider.HAS_REMOTE_COLLECTIONS_PROVIDER, true);
    testMethodCall(test, RemoteCollectionsProvider.DEFAULT_GET_COLLECTIONS, [RemoteCollectionsProvider.DEFAULT_COLLECTION]);
    testMethodCall(test, RemoteCollectionsProvider.DEFAULT_GET_PUBLICATIONS, [RemoteCollectionsProvider.DEFAULT_PUBLICATION]);
});

Tinytest.add('remote-collections-provider - startup - there are default collections on startup', function (test) {
    const allCollections = RemoteCollectionsProvider.getAllCollectionNames();
    testExists(test, allCollections);
    test.equal(allCollections.length, 1);
    test.equal(allCollections[0], "tests");
});

Tinytest.add('remote-collections-provider - init - init throws no errors', function (test) {
    RemoteCollectionsProvider.init(); //removes the defaults
    test.equal(true, true);
});

Tinytest.add('remote-collections-provider - init - init removes all default collections', function (test) {
    const allCollections = RemoteCollectionsProvider.getAllCollectionNames();
    testExists(test, allCollections);
    test.equal(allCollections.length, 0);
});

Tinytest.add('remote-collections-provider - init - init removes all default methods', function (test) {
    const defaultMethods = RemoteCollectionsProvider.getAllMethodNames();
    testExists(test, defaultMethods);
    test.equal(defaultMethods.length, 0);
});

Tinytest.add('remote-collections-provider - init - defaults not callable after init', function (test) {
    test.throws(function () {
        Meteor.call(RemoteCollectionsProvider.HAS_REMOTE_COLLECTIONS_PROVIDER);
    });
    test.throws(function () {
        Meteor.call(RemoteCollectionsProvider.DEFAULT_GET_COLLECTIONS);
    });
    test.throws(function () {
        Meteor.call(RemoteCollectionsProvider.DEFAULT_GET_PUBLICATIONS);
    });
});


////////////////////////////////////////////////////////////////////////////////////////////////////
//
//      METHODS
//
////////////////////////////////////////////////////////////////////////////////////////////////////


Tinytest.add('remote-collections-provider - methods - methods added working', function (test) {
    const methodName = "someMethod";
    const method = function () {
        return "theMethod";
    }
    testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    RemoteCollectionsProvider.addMethod(methodName, method, true);
    testExists(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    testMethodCall(test, methodName, "theMethod");
});

Tinytest.add('remote-collections-provider - methods - methods remove working', function (test) {
    const methodName = "someMethod";
    testMethodCall(test, methodName, "theMethod");
    testExists(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    RemoteCollectionsProvider.removeMethod(methodName);
    testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    test.throws(function () {
        Meteor.call(methodName);
    });
});

Tinytest.add('remote-collections-provider - methods - methods retrieve working', function (test) {
    const methodName = "someMethod";
    const method = function () {
        return "theMethod";
    }
    testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    RemoteCollectionsProvider.addMethod(methodName, method, true);
    const retrievedMethod = RemoteCollectionsProvider.getMethod(methodName);
    testExists(test, retrievedMethod, methodName);
    test.equal(typeof retrievedMethod, "function");
    test.equal(retrievedMethod, method);

    const allMethods = RemoteCollectionsProvider.getAllMethodNames();
    testExists(test, allMethods, "allMethods");
    test.equal(allMethods.length, 1);

    //remove for next test
    RemoteCollectionsProvider.removeMethod(methodName);
});

Tinytest.add('remote-collections-provider - methods - methods apply working', function (test) {
    const methodName = "someMethod";
    const method = function () {
        return "theMethod";
    }
    testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    RemoteCollectionsProvider.addMethod(methodName, method, false); //false so not aply immediately
    testExists(test, RemoteCollectionsProvider.getMethod(methodName), methodName); //should already exist
    test.throws(function () { //but throw a call error
        Meteor.call(methodName);
    });
    RemoteCollectionsProvider.applyAllMethods(); //but when we apply...
    testMethodCall(test, methodName, "theMethod"); //it should work
});

////////////////////////////////////////////////////////////////////////////////////////////////////
//
//      COLLECTIONS
//
////////////////////////////////////////////////////////////////////////////////////////////////////

Tinytest.add('remote-collections-provider - collections - collection names are added', function (test) {
    const collectionName = "someCollection";
    testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
    RemoteCollectionsProvider.addCollectionNames(collectionName);
    testExists(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
});

Tinytest.add('remote-collections-provider - collections - collection names can be removed', function (test) {
    const collectionName = "someCollection";
    testExists(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
    RemoteCollectionsProvider.removeCollection(collectionName);
    testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
});

Tinytest.add('remote-collections-provider - collections - collection names can be checke dif exist', function (test) {
    const collectionName = "someCollection";
    testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
    RemoteCollectionsProvider.addCollectionNames(collectionName);
    test.equal(RemoteCollectionsProvider.hasCollection(collectionName), true);
});

Tinytest.add('remote-collections-provider - collections - all collections can be retrieved', function (test) {
    const allCollections = RemoteCollectionsProvider.getAllCollectionNames();
    testExists(test, allCollections, "allCollections");
    test.equal(allCollections.length, 1);
});


////////////////////////////////////////////////////////////////////////////////////////////////////
//
//      PUBLICATIONS
//
////////////////////////////////////////////////////////////////////////////////////////////////////


Tinytest.add('remote-collections-provider - pubications - publications are added', function (test) {
    const publication = "somePublication";
    const pubFunc = function () {
        return testCollection.find({});
    }

    //TEST IF NOT EXISTS
    testExistsNot(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExistsNot(test, Meteor.server.publish_handlers[publication], "publish handler");

    //ADD
    RemoteCollectionsProvider.addPublication(publication, pubFunc, true);

    //TEST IF EXISTS
    testExists(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExists(test, Meteor.server.publish_handlers[publication], "publish handler");
    test.equal(Meteor.server.publish_handlers[publication], pubFunc);
});

Tinytest.add('remote-collections-provider - pubications - publications names can be removed', function (test) {
    const publication = "somePublication";

    //FIRST TEST IF EXISTS (FROM LAST TEST
    testExists(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExists(test, Meteor.server.publish_handlers[publication], "publish handler");

    //THEN REMOVE
    RemoteCollectionsProvider.removePublication(publication);

    //TEST IF NOT EXISTS
    testExistsNot(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExistsNot(test, Meteor.server.publish_handlers[publication], "publish handler");
});

Tinytest.add('remote-collections-provider - pubications - publications can be retrieved', function (test) {
    const publication = "somePublication";
    const pubFunc = function () {
        return testCollection.find({});
    }
    RemoteCollectionsProvider.addPublication(publication, pubFunc, true);
    const retrievedPub = RemoteCollectionsProvider.getPublication(publication);
    testExists(test, retrievedPub, publication);
    test.equal(retrievedPub, pubFunc);
});

Tinytest.add('remote-collections-provider - pubications - all publications can be retrieved', function (test) {
    const allPubs = RemoteCollectionsProvider.getAllPublicationNames();
    testExists(test, allPubs, "all pubs");
    test.equal(allPubs.length, 1);
});


////////////////////////////////////////////////////////////////////////////////////////////////////
//
//      TEST HELPER
//
////////////////////////////////////////////////////////////////////////////////////////////////////


function testExists(test, obj, optionalName) {
    if (!optionalName)
        optionalName = "";
    test.isNotNull(obj, "unexpected object is null (" + optionalName + ")");
    test.isNotUndefined(obj, "unexpected: object is undefined (" + optionalName + ")");
}

function testExistsNot(test, obj, optionalName) {
    if (!optionalName)
        optionalName = "";
    const doesExist = obj !== null && typeof obj !== 'undefined';
    test.equal(doesExist, false, "unexpected object existence, expected " + optionalName + " not to exist");
}

function testObjectHasChildren(test, obj, expectedChildCount) {
    testExists(test, obj);
    const keys = Object.keys(obj);
    testExists(test, keys);
    test.equal(keys.length, expectedChildCount, "unexpected: childcount is " + keys.length + ", expected is " + expectedChildCount);
}

function testMethodCall(test, methodName, expectedResult) {
    testExists(test, Meteor.server.method_handlers[methodName], methodName);
    const methodResult = Meteor.call(methodName);
    testExists(test, methodResult, "result of " + methodName);
    test.equal(methodResult, expectedResult);
}
