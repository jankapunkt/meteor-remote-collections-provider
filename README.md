[![Build Status](https://travis-ci.org/jankapunkt/meteor-remote-collections-provider.svg?branch=master)](https://travis-ci.org/jankapunkt/meteor-remote-collections-provider)
[![Code Climate](https://codeclimate.com/github/jankapunkt/meteor-remote-collections-provider/badges/gpa.svg)](https://codeclimate.com/github/jankapunkt/meteor-remote-collections-provider)
[![Test Coverage](https://codeclimate.com/github/jankapunkt/meteor-remote-collections-provider/badges/coverage.svg)](https://codeclimate.com/github/jankapunkt/meteor-remote-collections-provider/coverage)
[![Issue Count](https://codeclimate.com/github/jankapunkt/meteor-remote-collections-provider/badges/issue_count.svg)](https://codeclimate.com/github/jankapunkt/meteor-remote-collections-provider)

# jkuester:remote-collections-provider

This meteor package allows to manage the registration of methods, collections and publications to be used by [jkuester:remote-collections](https://github.com/jankapunkt/meteor-remote-collections) or any other remote application via DDP.

### Usage

The package is a handy tool, if you want to manage which collections are available to an external app (which may use [jkuester:remote-collections](https://github.com/jankapunkt/meteor-remote-collections)) or a custom DDP based implementation.

The RemoteCollectionsProvider is a singleton and can be imported and initialized via:

```javascrit
import {RemoteCollectionsProvider} from "meteor/jkuester:remote-collections-provider";
RemoteCollectionsProvider.init();
```

Your remote application requires some information, to successfully get your collections:
* What method can it call to get a list of available collections (their names)
* What method can it call to get a list of available subscriptions (their names)

Therefore you first need to add your collections to the list of available collection:

```javascript
RemoteCollectionsProvider.addCollectionNames('myMongoCollection'); //pass the name, you passed to the Mongo.Collection constructor
```

Then you need to add your publications (you do not need to call Meteor.publish, it does this for you, too).

```javascript
RemoteCollectionsProvider.addPublication('myCollection.public', function(){
    return myCollection.find({}); //your code here
});
```

Finally you need to provide two methods, which allows your external app to retrieve the lists of available collections and subscriptions:

```javascript

//ake all collection names available
RemoteCollectionsProvider.addMethod(
    "ddp.getAvailableRemoteMethods",
    function(){
        //returns a list of all available publications
        return RemoteCollectionsProvider.getAllCollectionNames();
    },
    //use true to call Meteor.methods(...) on this immediatly
    //you can also use false to bundle and the call RemoteCollectionsProvider.applyAllMethods()
    true
);


//make all subscription names available
RemoteCollectionsProvider.addMethod(
    "ddp.getAvailableRemotePublications",
    function(){
        //returns a list of all available publications
        return RemoteCollectionsProvider.getAllPublicationNames();
    },
    true
);
```

In your external application you can consume these functions via

```javascript
const remote = DDP.connect(yourProviderAppUrl);
//...

const remoteCollections = remote.call("ddp.getAvailableRemoteMethods");
for(let collection of remoteCollections)
    //add collection...

const remotePublications = remote.call("ddp.getAvailableRemotePublications");
for(let publication of remotePublications)
    //subscribe...

```

### Licence

MIT Licence, see Licence file