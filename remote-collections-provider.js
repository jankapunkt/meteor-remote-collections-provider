import {check} from 'meteor/check';
import {Match} from 'meteor/check';
import {Meteor} from 'meteor/meteor';

class RemoteProvider {
    constructor() {
        this.publications = {};
        this.methods = {};
        this.collections = {};

        this.DEFAULT_COLLECTION = "tests";
        this.DEFAULT_GET_METHOD = "RemoteProvider.getPrivateDatabases";
        this.DEFAULT_GET_SUBSCRIPTIONS = "RemoteProvider.getAvailableSubscriptions";
        this.HAS_REMOTE_COLLECTIONS_PROVIDER = "RemoteProvider.hasRemoteCollectionsProvider";

        this.collections[this.DEFAULT_COLLECTION] = this.DEFAULT_COLLECTION;

        this.methods[this.HAS_REMOTE_COLLECTIONS_PROVIDER] = function () {
            return true;
        };
        this.methods[this.HAS_REMOTE_COLLECTIONS_PROVIDER] = this.methods[this.HAS_REMOTE_COLLECTIONS_PROVIDER].bind(this);
        this.methods[this.DEFAULT_GET_METHOD] = function () {
            return this.getAllCollectionNames();
        };
        this.methods[this.DEFAULT_GET_METHOD] = this.methods[this.DEFAULT_GET_METHOD].bind(this);
        this.methods[this.DEFAULT_GET_SUBSCRIPTIONS] = function () {
            return this.getAllPublicationNames();
        };
        this.methods[this.DEFAULT_GET_SUBSCRIPTIONS] = this.methods[this.DEFAULT_GET_SUBSCRIPTIONS].bind(this);
        Meteor.methods(this.methods);
    }

    //===================================================================================//
    //  METHODS
    //===================================================================================//

    addMethod(name, funct, applyImmediately) {
        check(name, String);
        check(funct, Function);
        check(applyImmediately, Match.MayBe(Boolean));
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
        let method = {};
        method[name] = null;
        Meteor.methods(method); //FIXME is there a better way?
    }

    getMethod(name) {
        check(name, String);
        return this.methods[name];
    }

    getAllMethodNames(){
        return Object.keys(this.methods);
    }

    applyAllMethods() {
        Meteor.methods(this.methods);
    }

    //===================================================================================//
    //  COLLECTIONS
    //===================================================================================//

    addCollectionNames(name) {
        check(name,String);
        this.collections[name] = name;
    }

    removeCollection(name) {
        check(name, String);
        delete this.collections[name];
    }

    hasCollection(name){
        check(name, String);
        return this.collections[name] !== null && typeof  this.collections[name] !== 'undefined';
    }

    getAllCollectionNames() {
        return Object.keys(this.collections);
    }

    //===================================================================================//
    //  PUBLICATIONS
    //===================================================================================//

    addPublication(name, funct, applyImmediately) {
        check(name, String);
        check(funct, Function);
        check(applyImmediately, Match.Maybe(Boolean));
        this.publications[name] = funct;
        if (applyImmediately){
            Meteor.publish(name, funct);
        }

    }

    getPublication(name) {
        return this.publications[name];
    }

    getAllPublicationNames() {
        return Object.keys(this.publications);
    }
}


export const RemoteCollectionsProvider = new RemoteProvider();