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

Tinytest.add('remote-collections-provider - clear - clears all reference', function(test){

	addToCollection(test, "someCollection", null);
	addMethod(test, "newMethod",()=>{return "newMethod"},true);
	addPublication(test, "newPub", ()=>{return "newPub"},true);

	//hard remove
	RemoteCollectionsProvider.clear(true);

	test.equal(RemoteCollectionsProvider.getAllCollectionNames(),{});
	test.equal(RemoteCollectionsProvider.getAllPublicationNames(),{});
	test.equal(RemoteCollectionsProvider.getAllMethodNames(),{});

	test.throws(function () {
		Meteor.call("newMethod");
	});

	//soft remove
	addToCollection(test, "someCollection", null);
	addMethod(test, "newMethod",()=>{return "newMethod"},true);
	addPublication(test, "newPub", ()=>{return "newPub"},true);


	RemoteCollectionsProvider.clear();

	test.equal(RemoteCollectionsProvider.getAllCollectionNames(),{});
	test.equal(RemoteCollectionsProvider.getAllPublicationNames(),{});
	test.equal(RemoteCollectionsProvider.getAllMethodNames(),{});

	testMethodCall(test, "newMethod", "newMethod");

	//finally remove also from server
	RemoteCollectionsProvider.removeMethod("newMethod", true);
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
	RemoteCollectionsProvider.clear(true);

	//if we add a method by name it should store the method ref
	addMethod(test, methodName, methodFct, true);
	test.equal(RemoteCollectionsProvider.getMethod(methodName), methodFct, "unexpected instance match");
	testMethodCall(test, methodName, "theMethod");

	//if we add just a name it should store the name
	removeMethod(test, methodName, true);
	addMethod(test, methodName, null, null);
	test.equal(RemoteCollectionsProvider.getMethod(methodName), methodName);
	test.throws(function () {
		Meteor.call(methodName);
	});

});

Tinytest.add('remote-collections-provider - methods - methods remove working', function (test) {
	RemoteCollectionsProvider.clear(true);


	addMethod(test, methodName, methodFct, true);
	removeMethod(test, methodName, true);
	test.throws(function () {
		Meteor.call(methodName);
	});
});

Tinytest.add('remote-collections-provider - methods - methods retrieve working', function (test) {
	RemoteCollectionsProvider.clear(true);

	addMethod(test, methodName, methodFct, true)

	const retrievedMethod = RemoteCollectionsProvider.getMethod(methodName);
	testExists(test, retrievedMethod, methodName);
	test.equal(typeof retrievedMethod, "function");
	test.equal(retrievedMethod, methodFct);
});

Tinytest.add('remote-collections-provider - methods - get all methods working', function (test) {
	RemoteCollectionsProvider.clear(true);

	addMethod(test, methodName, methodFct, true)
	testAllAddedEntries(test, RemoteCollectionsProvider.getAllMethodNames(), 1);
});


Tinytest.add('remote-collections-provider - methods - methods apply working', function (test) {
	RemoteCollectionsProvider.clear(true);

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
	RemoteCollectionsProvider.clear(true);

	//add collecition name
	addToCollection(test, collectionName);
	const collectionRef = RemoteCollectionsProvider.getCollection(collectionName);
	testExists(test, collectionRef);
	test.equal(collectionRef, collectionName);

	removeCollection(test, collectionName);

	//add collection schema
	const schemaObj = {title:{type:String}};
	addToCollection(test, collectionName, schemaObj); //keep it easy, avoid coupling to SimpleSchema here
	const schemaRef = RemoteCollectionsProvider.getCollection(collectionName);
	testExists(test, schemaRef);
	test.equal(schemaRef, schemaObj);

});

Tinytest.add('remote-collections-provider - collections - collection names can be removed', function (test) {
	RemoteCollectionsProvider.clear(true);

	addToCollection(test, collectionName);
	removeCollection(test, collectionName);
	testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName));
});

Tinytest.add('remote-collections-provider - collections - collection names can be checke dif exist', function (test) {
	RemoteCollectionsProvider.clear(true);

	addToCollection(test, collectionName);
	test.equal(RemoteCollectionsProvider.hasCollection(collectionName), true);
});

Tinytest.add('remote-collections-provider - collections - all collections can be retrieved', function (test) {
	RemoteCollectionsProvider.clear(true);

	addToCollection(test, collectionName);
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

Tinytest.add('remote-collections-provider - publications - publications are added', function (test) {
	RemoteCollectionsProvider.clear(true);

	//add as function
	addPublication(test, publicationName, publicationFunction, true);
	test.equal(RemoteCollectionsProvider.getPublication(publicationName), publicationFunction);

	removePublication(test, publicationName, true);

	//add as name
	addPublication(test, publicationName, null, null);
	test.equal(RemoteCollectionsProvider.getPublication(publicationName), publicationName);


});

Tinytest.add('remote-collections-provider - publications - publications names can be removed', function (test) {
	RemoteCollectionsProvider.clear(true);

	addPublication(test, publicationName, publicationFunction, true);
	removePublication(test, publicationName, true);
	testExistsNot(test, RemoteCollectionsProvider.getPublication(publicationName));

});

Tinytest.add('remote-collections-provider - publications - single publication can be retrieved', function (test) {
	RemoteCollectionsProvider.clear(true);

	addPublication(test, publicationName, publicationFunction, true);
	const retrievedPub = RemoteCollectionsProvider.getPublication(publicationName);
	testExists(test, retrievedPub, publicationName);
	test.equal(retrievedPub, publicationFunction);
});

Tinytest.add('remote-collections-provider - publications - all publications can be retrieved', function (test) {
	RemoteCollectionsProvider.clear(true);
	addPublication(test, publicationName, publicationFunction, true);
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


function addMethod(test, methodName, method, applyImmediately = true) {
	testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
	RemoteCollectionsProvider.addMethod(methodName, method, applyImmediately);
	testExists(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
}

function addToCollection(test, collectionName, optionalSchema=null) {
	testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
	RemoteCollectionsProvider.addCollectionNames(collectionName, optionalSchema);
	testExists(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
}

function removeCollection(test, collectionName) {
	testExists(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
	RemoteCollectionsProvider.removeCollection(collectionName);
	testExistsNot(test, RemoteCollectionsProvider.getCollection(collectionName), collectionName);
}

function addPublication(test, publication, pubFunc, applyImmediately) {
	//TEST IF NOT EXISTS
	testExistsNot(test, RemoteCollectionsProvider.getPublication(publication), publication);
	testExistsNot(test, Meteor.server.publish_handlers[publication], "publish handler");
	//ADD
	RemoteCollectionsProvider.addPublication(publication, pubFunc, applyImmediately);

	if (pubFunc) {
		testExists(test, RemoteCollectionsProvider.getPublication(publication), publication);
		testExists(test, Meteor.server.publish_handlers[publication], "publish handler");
		test.equal(RemoteCollectionsProvider.getPublication(publication), pubFunc);
		test.equal(Meteor.server.publish_handlers[publication], pubFunc);
	}else{
		testExists(test, RemoteCollectionsProvider.getPublication(publication), publication);
		testExistsNot(test, Meteor.server.publish_handlers[publication]);
		test.equal(RemoteCollectionsProvider.getPublication(publication), publication);
	}


}

function removePublication(test, publication, alsoRemoveFromServer) {
	//FIRST TEST IF EXISTS (FROM LAST TEST
	testExists(test, RemoteCollectionsProvider.getPublication(publication), publication);
	testExists(test, Meteor.server.publish_handlers[publication], "publish handler");
	//THEN REMOVE
	RemoteCollectionsProvider.removePublication(publication, alsoRemoveFromServer);
	//TEST IF NOT EXISTS
	testExistsNot(test, RemoteCollectionsProvider.getPublication(publication), publication);
	testExistsNot(test, Meteor.server.publish_handlers[publication], "publish handler");
}

function removeMethod(test, methodName, alsoRemoveFromServer) {
	testMethodCall(test, methodName, "theMethod");
	testExists(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
	RemoteCollectionsProvider.removeMethod(methodName, alsoRemoveFromServer);
	testExistsNot(test, RemoteCollectionsProvider.getMethod(methodName), methodName);
}


function testAllAddedEntries(test, list, expectedCount) {
	testExists(test, list, "all entries list");
	test.equal(list.length, expectedCount);
}