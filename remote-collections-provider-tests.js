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
    testAllAddedEntries(test, allCollections, 1);
    test.equal(allCollections[0], "tests");
});

Tinytest.add('remote-collections-provider - init - init throws no errors', function (test) {
    RemoteCollectionsProvider.init(); //removes the defaults
    test.equal(true, true);
});

Tinytest.add('remote-collections-provider - init - init removes all default collections', function (test) {
    testAllAddedEntries(test, RemoteCollectionsProvider.getAllCollectionNames(), 0);
});

Tinytest.add('remote-collections-provider - init - init removes all default methods', function (test) {
    testAllAddedEntries(test, RemoteCollectionsProvider.getAllMethodNames(), 0);
});

Tinytest.add('remote-collections-provider - init - init removes all default publications', function (test) {
    testAllAddedEntries(test, RemoteCollectionsProvider.getAllPublicationNames(), 0);
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
const methodName = "someMethod";
const methodFct = function () {
    return "theMethod";
}

Tinytest.add('remote-collections-provider - methods - methods added working', function (test) {
    addMethod(test, methodName, methodFct, true)
    testMethodCall(test, methodName, "theMethod");
});

Tinytest.add('remote-collections-provider - methods - methods remove working', function (test) {
    removeMethod(test, methodName);
    test.throws(function () {
        Meteor.call(methodName);
    });
});

Tinytest.add('remote-collections-provider - methods - methods retrieve working', function (test) {
    addMethod(test, methodName, methodFct, true)

    const retrievedMethod = RemoteCollectionsProvider.getMethod(methodName);
    testExists(test, retrievedMethod, methodName);
    test.equal(typeof retrievedMethod, "function");
    test.equal(retrievedMethod, methodFct);
});

Tinytest.add('remote-collections-provider - methods - get all methods working', function (test) {
    testAllAddedEntries(test, RemoteCollectionsProvider.getAllMethodNames(), 1);
});


Tinytest.add('remote-collections-provider - methods - methods apply working', function (test) {
    //first remove last method
    removeMethod(test, methodName);

    addMethod(test, methodName, methodFct, false); //dont apply immediately
    test.throws(function () { //to throw a call error
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
const collectionName = "someCollection";

Tinytest.add('remote-collections-provider - collections - collection names are added', function (test) {
    addToCollection(test, collectionName);
});

Tinytest.add('remote-collections-provider - collections - collection names can be removed', function (test) {
    removeCollection(test, collectionName);
});

Tinytest.add('remote-collections-provider - collections - collection names can be checke dif exist', function (test) {
    addToCollection(test, collectionName);
    test.equal(RemoteCollectionsProvider.hasCollection(collectionName), true);
});

Tinytest.add('remote-collections-provider - collections - all collections can be retrieved', function (test) {
    testAllAddedEntries(test, RemoteCollectionsProvider.getAllCollectionNames(), 1);
});


////////////////////////////////////////////////////////////////////////////////////////////////////
//
//      PUBLICATIONS
//
////////////////////////////////////////////////////////////////////////////////////////////////////
const publicationName = "somePublication";
const publicationFunction = function () {
    return testCollection.find({});
}

Tinytest.add('remote-collections-provider - pubications - publications are added', function (test) {
    addPublication(test, publicationName, publicationFunction);
});

Tinytest.add('remote-collections-provider - pubications - publications names can be removed', function (test) {
    removePublication(test, publicationName);
});

Tinytest.add('remote-collections-provider - pubications - publications can be retrieved', function (test) {
    addPublication(test, publicationName, publicationFunction);
    const retrievedPub = RemoteCollectionsProvider.getPublication(publicationName);
    testExists(test, retrievedPub, publicationName);
    test.equal(retrievedPub, publicationFunction);
});

Tinytest.add('remote-collections-provider - pubications - all publications can be retrieved', function (test) {
    testAllAddedEntries(test, RemoteCollectionsProvider.getAllPublicationNames(), 1);
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


function addMethod(test, methodName, method, applyImmediately=true) {
    testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    RemoteCollectionsProvider.addMethod(methodName, method, applyImmediately);
    testExists(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
}

function addToCollection(test, collectionName){
    testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
    RemoteCollectionsProvider.addCollectionNames(collectionName);
    testExists(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
}

function removeCollection(test, collectionName) {
    testExists(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
    RemoteCollectionsProvider.removeCollection(collectionName);
    testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
}

function addPublication(test, publication, pubFunc) {
    //TEST IF NOT EXISTS
    testExistsNot(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExistsNot(test, Meteor.server.publish_handlers[publication], "publish handler");
    //ADD
    RemoteCollectionsProvider.addPublication(publication, pubFunc, true);
    //TEST IF EXISTS
    testExists(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExists(test, Meteor.server.publish_handlers[publication], "publish handler");
    test.equal(Meteor.server.publish_handlers[publication], pubFunc);
}

function removePublication(test, publication) {
    //FIRST TEST IF EXISTS (FROM LAST TEST
    testExists(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExists(test, Meteor.server.publish_handlers[publication], "publish handler");
    //THEN REMOVE
    RemoteCollectionsProvider.removePublication(publication);
    //TEST IF NOT EXISTS
    testExistsNot(test, RemoteCollectionsProvider.getPublication(publication), publication);
    testExistsNot(test, Meteor.server.publish_handlers[publication], "publish handler");
}

function removeMethod(test, methodName) {
    testMethodCall(test, methodName, "theMethod");
    testExists(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
    RemoteCollectionsProvider.removeMethod(methodName);
    testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
}


function testAllAddedEntries(test, list, expectedCount) {
    testExists(test, list, "all entries list");
    test.equal(list.length, expectedCount);
}