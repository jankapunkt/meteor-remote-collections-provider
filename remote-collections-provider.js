import {check} from 'meteor/check';
import {Match} from 'meteor/check';
import {Meteor} from 'meteor/meteor';

class RemoteProvider {

	/**
	 * Initializes default values, so the package can be tested from remote by simply adding it to an application
	 */
	constructor() {
		this.publications = {};
		this.methods = {};
		this.collections = {};

		//ERRORS
		this.CANNOT_ADD_NULL_TO_METHODS = "Cannot add null to Meteor.methods. Requires a function.";
		this.CANNOT_ADD_NULL_TO_PUBLICATIONS = "Cannot add null to Meteor.publish. Requires a function.";



		this.DEFAULT_COLLECTION = "tests";
		this.DEFAULT_PUBLICATION = "tests.public";
		this.DEFAULT_GET_COLLECTIONS = "RemoteProvider.getPrivateDatabases";
		this.DEFAULT_GET_PUBLICATIONS = "RemoteProvider.getAvailableSubscriptions";
		this.HAS_REMOTE_COLLECTIONS_PROVIDER = "RemoteProvider.hasRemoteCollectionsProvider";

		this.collections[this.DEFAULT_COLLECTION] = this.DEFAULT_COLLECTION;

		//DEFAULT METHODS
		this.methods[this.HAS_REMOTE_COLLECTIONS_PROVIDER] = function () {
			return true;
		};
		this.methods[this.DEFAULT_GET_COLLECTIONS] = function () {
			return this.getAllCollectionNames();
		};
		this.methods[this.DEFAULT_GET_PUBLICATIONS] = function () {
			return this.getAllPublicationNames();
		};

		//BIND METHODS
		this.methods[this.DEFAULT_GET_COLLECTIONS] = this.methods[this.DEFAULT_GET_COLLECTIONS].bind(this);
		this.methods[this.HAS_REMOTE_COLLECTIONS_PROVIDER] = this.methods[this.HAS_REMOTE_COLLECTIONS_PROVIDER].bind(this);
		this.methods[this.DEFAULT_GET_PUBLICATIONS] = this.methods[this.DEFAULT_GET_PUBLICATIONS].bind(this);

		//APPLY METHODS
		Meteor.methods(this.methods);
		this.addPublication(this.DEFAULT_PUBLICATION, function () {return 1000});
	}

	/**
	 * Removed the defaults and makes the class ready to be used in your app.
	 */
	init() {
		this.removeDefaults();
		//something else here?
	}

	clear(alsoClearOnServer=false) {
		check(alsoClearOnServer, Match.OneOf(null, undefined, Boolean));
		if (alsoClearOnServer) {
			for (let pubKey in this.publications)
				this.removePublication(pubKey, alsoClearOnServer);
			for (let methodKey in this.methods)
				this.removeMethod(methodKey, alsoClearOnServer);
			for (let colKey in this.collections)
				this.removeCollection(colKey);
		} else {
			this.publications = {};
			this.methods = {};
			this.collections = {};
		}
	}

	/**
	 * Removes default methods and collection entries.
	 */
	removeDefaults() {
		this.removeMethod(this.HAS_REMOTE_COLLECTIONS_PROVIDER, true);
		this.removeMethod(this.DEFAULT_GET_COLLECTIONS, true);
		this.removeMethod(this.DEFAULT_GET_PUBLICATIONS, true);
		this.removeCollection(this.DEFAULT_COLLECTION, true);
		this.removePublication(this.DEFAULT_PUBLICATION, true);
	}

	//===================================================================================//
	//  METHODS
	//===================================================================================//

	/**
	 * Adds a method name to the internal method-name map
	 * @param name Name of the remotely callable method
	 * @param funct The function to be executed on remote call
	 * @param applyImmediately executes Meteor.methods(...) immediatly. If false you need to call applyAllMethods
	 */
	addMethod(name, funct=null, applyImmediately = false) {
		check(name, String);
		check(funct, Match.OneOf(null, undefined, Function));
		check(applyImmediately, Match.OneOf(null, undefined, Boolean));

		if (applyImmediately && !this.isDefined(funct))
			throw new Meteor.Error(this.CANNOT_ADD_NULL_TO_METHODS);

		if (this.isDefined(funct))
			this.methods[name] = funct;
		else
			this.methods[name] = name;
		if (applyImmediately) {
			let method = {};
			method[name] = funct;
			Meteor.methods(method);
		}
	}

	/**
	 * Removes a method from the method-name map and if desired also from Meteor.server.method_handlers
	 * @param name Name of the method
	 * @alsoDeleteOnServer also deletes the function on Meteor.server.method_handlers
	 */
	removeMethod(name, alsoDeleteOnServer = false) {
		check(name, String);
		delete this.methods[name];
		if (alsoDeleteOnServer)
			delete Meteor.server.method_handlers[name];
	}

	/**
	 * Returns the method, stored by the given name.
	 * @param name Name of the method.
	 * @returns {*} executable Function object.
	 */
	getMethod(name) {
		check(name, String);
		return this.methods[name];
	}

	getMethodServer(name){
		check(name, String);
		return Meteor.server.method_handlers[name];
	}

	/**
	 * Returns all stored method names in an unordered array.
	 * @returns {Array} The sum of all method names.
	 */
	getAllMethodNames() {
		return Object.keys(this.methods);
	}

	/**
	 * Adds all existing methods to Meteor.server.method_handlers.
	 */
	applyAllMethods() {
		Meteor.methods(this.methods);
	}

	//===================================================================================//
	//  COLLECTIONS
	//===================================================================================//

	/**
	 * Adds a collection name to the collection-name map. Indicates that this colleciton will be retrieved
	 * from remote via DDP.
	 * @param name Name of the collection, passed to the Mongo.Collection constructor.
	 * @param schema optional Schema to be passed.
	 */
	addCollectionNames(name, schema = null) {
		check(name, String);
		check(schema, Match.OneOf(null, undefined, Object)); //to support various schemata beyond SimpleSchema

		if (this.isDefined(schema))
			this.collections[name] = schema;
		else
			this.collections[name] = name;
	}

	/**
	 * Removes a collection from the collection-name map, but does not remove the Mongo.Collection itself.
	 * @param name Name of the collection to be removed.
	 */
	removeCollection(name) {
		check(name, String);
		delete this.collections[name];
	}

	/**
	 * Returns wether has a certain collection stored in the collection-name map.
	 * @param name Name of the collection.
	 * @returns {boolean} True if something other than null/undefined has been found.
	 */
	hasCollection(name) {
		check(name, String);
		return this.isDefined(this.collections[name]);
	}

	/**
	 * Returns the collection name or a schema, of passed.
	 * @param name Name of the collection
	 * @returns {*} A String (name) of the collection or a schema, depending on what you added
	 */
	getCollection(name) {
		check(name, String);
		return this.collections[name];
	}

	/**
	 * Returns an array of all collection names which are available for remote purposes.
	 * Can be consumed by the remote-collections package. Should be the return value of your
	 * public method, use the names stored in this array for RemoteCollections.loadRemoteCollections.
	 * @returns {Array} Array with names of the available collections.
	 */
	getAllCollectionNames() {
		return Object.keys(this.collections);
	}

	//===================================================================================//
	//  PUBLICATIONS
	//===================================================================================//

	/**
	 * Adds a publication to the internal map and to the Meteor.server.publish_handlers map.
	 * @param name Name of the pub (used for Meteor.subscribe(name))
	 * @param funct The function which executes the publication.
	 * @param applyImmediately also egisters via Meteor.publish
	 */
	addPublication(name, funct=null, applyImmediately = false) {
		check(name, String);
		check(funct, Match.OneOf(null, undefined, Function));
		check(applyImmediately, Match.OneOf(null, undefined, Boolean));

		if (applyImmediately && !this.isDefined(funct))
			throw new Meteor.Error(this.CANNOT_ADD_NULL_TO_PUBLICATIONS);

		if (this.isDefined(funct))
			this.publications[name] = funct;
		else
			this.publications[name] = name;
		if (applyImmediately)
			Meteor.publish(name, funct);
	}

	/**
	 * Removes the publication from the internal map and from the Meteor.server.publish_handlers map.
	 * @param name Name of the publication to be removed.
	 * @param alsoDeleteOnServer deletes the pub also in Meteor.server.publish_handlers
	 */
	removePublication(name, alsoDeleteOnServer = false) {
		check(name, String);
		check(alsoDeleteOnServer, Match.OneOf(null, undefined, Boolean));


		if (alsoDeleteOnServer) {
			delete Meteor.server.publish_handlers[name];
		}
		delete this.publications[name];
	}

	/**
	 * Gets the function of a publication stored in the publication-name map.
	 * @param name Name of the publication
	 * @returns {*} Returns a Function Object
	 */
	getPublication(name) {
		check(name, String);
		return this.publications[name];
	}

	getPublicationServer(name){
		check(name, String);
		return Meteor.server.publish_handlers[name];
	}

	/**
	 * Gets an unordered array of all publication names. The entries can be used in
	 * RemoteCollection.loadRemoteSubscriptions to subscribe from remote. Put this return value in your
	 * method, which is called by DDP to get available subscriptions.
	 * @returns {Array}
	 */
	getAllPublicationNames() {
		return Object.keys(this.publications);
	}

	isDefined(obj) {
		return obj !== null && typeof obj !== 'undefined';
	}
}


export const RemoteCollectionsProvider = new RemoteProvider();