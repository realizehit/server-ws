# Communication Specs

### Server initializing

1. Server: creates an EngineIO connection handler
2. Server: creates an http server and binds EngineIO to handle connections
3. Server: connects to Redis to receive messages

### Server listening

1. Server: sets `.status` as `Server.STATUS.LISTENING`

### Server closing

1. Server: sets `.status` as `Server.STATUS.CLOSED`

### Subscribing

1. Other party: send to Server the *action:subscribe* and *pattern:...*
2. Server: gets a subscription based on provided pattern
    1. Server: If subscription doesn't exist
        1. Server: creates a subscription to handle it
3. Server: checks if client is subscribed on provided pattern
    1. Server: if already subscribed
        1. Server: sends error message to Other party *action:...* *pattern:...* *status:false*
    2. Server: if not subscribed
        1. Adds client to subscription
        2. Sends a status set to Other party *action:...* *pattern:...* *status:true*


### Unsubscribing

1. Other party: send to Server the *action:unsubscribe* and *pattern:...*
2. Server: tries to get a subscription based on provided pattern
    1. Server: if no subscription found
        1. Server: sends an error message to Other party
3. Server: checks if client is subscribed on provided pattern
    1. Server: if not subscribed
        1. Server: sends error message to Other party
    2. Server: if subscribed
        1. Server: If this is the only socket on the subscription
            1. Server: removes subscription
        2. Server: ends a status set to Other party

### Subscription creation

Whenever a subscription is created

1. Server: subscribes to redis trough PSUBSCRIBE method


### Subscription deleteion

Wheneer a subscription is empty

1. Server: unsubscribes from redis trough PUNSUBSCRIBE method

### Messages definition

1. Origin
    1. S - system (such as )
