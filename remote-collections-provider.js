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
        this.addPublication(this.DEFAULT_PUBLICATION, function(){return 1000});
    }

    /**
     * Removed the defaults and makes the class ready to be used in your app.
     */
    init() {
        this.removeDefaults();
        //something else here?
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
    addMethod(name, funct, applyImmediately=false) {
        check(name, String);
        check(funct, Function);
        check(applyImmediately, Match.Maybe(Boolean));
        this.methods[name] = funct;
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
    removeMethod(name, alsoDeleteOnServer=false) {
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
     */
    addCollectionNames(name) {
        check(name, String);
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
        return this.collections[name] !== null && typeof  this.collections[name] !== 'undefined';
    }

    /**
     * Returns the collection name. @Deprecated.
     * TODO => store reference to a real collection and return it here? Does this cause overhead?
     * @param name Name of the collection
     * @returns {*} A String (name) of the collection
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
    addPublication(name, funct, applyImmediately=false) {
        check(name, String);
        check(funct, Function);
        this.publications[name] = funct;
        if (applyImmediately)
            Meteor.publish(name, funct);
    }

    /**
     * Removes the publication from the internal map and from the Meteor.server.publish_handlers map.
     * @param name Name of the publication to be removed.
	 * @param alsoDeleteOnServer deletes the pub also in Meteor.server.publish_handlers
     */
    removePublication(name, alsoDeleteOnServer=false) {
        check(name, String);
        if (alsoDeleteOnServer)
        	delete Meteor.server.publish_handlers[name];
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

    /**
     * Gets an unordered array of all publication names. The entries can be used in
     * RemoteCollection.loadRemoteSubscriptions to subscribe from remote. Put this return value in your
     * method, which is called by DDP to get available subscriptions.
     * @returns {Array}
     */
    getAllPublicationNames() {
        return Object.keys(this.publications);
    }
}


export const RemoteCollectionsProvider = new RemoteProvider();