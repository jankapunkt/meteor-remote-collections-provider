import {check} from 'meteor/check';
import {Match} from 'meteor/check';
import {Meteor} from 'meteor/meteor';

class RemoteProvider {
    constructor() {
        this.publications = {};
        this.methods = {};
        this.collections = {};

        this.DEFAULT_COLLECTION = "tests";
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
    }

    init() {
        this.removeDefaults();
        //something else here?
    }

    removeDefaults() {
        this.removeMethod(this.HAS_REMOTE_COLLECTIONS_PROVIDER);
        this.removeMethod(this.DEFAULT_GET_COLLECTIONS);
        this.removeMethod(this.DEFAULT_GET_PUBLICATIONS);
        this.removeCollection(this.DEFAULT_COLLECTION);
    }

    //===================================================================================//
    //  METHODS
    //===================================================================================//

    addMethod(name, funct, applyImmediately) {
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

    removeMethod(name) {
        check(name, String);
        delete this.methods[name];
        delete Meteor.server.method_handlers[name];
    }

    getMethod(name) {
        check(name, String);
        return this.methods[name];
    }

    getAllMethodNames() {
        return Object.keys(this.methods);
    }

    applyAllMethods() {
        Meteor.methods(this.methods);
    }

    //===================================================================================//
    //  COLLECTIONS
    //===================================================================================//

    addCollectionNames(name) {
        check(name, String);
        this.collections[name] = name;
    }

    removeCollection(name) {
        check(name, String);
        delete this.collections[name];
    }

    hasCollection(name) {
        check(name, String);
        return this.collections[name] !== null && typeof  this.collections[name] !== 'undefined';
    }

    getCollection(name) {
        check(name, String);
        return this.collections[name];
    }

    getAllCollectionNames() {
        return Object.keys(this.collections);
    }

    //===================================================================================//
    //  PUBLICATIONS
    //===================================================================================//

    addPublication(name, funct) {
        check(name, String);
        check(funct, Function);
        this.publications[name] = funct;
        Meteor.publish(name, funct);
    }

    removePublication(name) {
        check(name, String);
        delete Meteor.server.publish_handlers[name];
        delete this.publications[name];
    }

    getPublication(name) {
        return this.publications[name];
    }

    getAllPublicationNames() {
        return Object.keys(this.publications);
    }
}


export const RemoteCollectionsProvider = new RemoteProvider();