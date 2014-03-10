node-flower-power
=======================

A node.js module to interface with the [Parrot Flower Power](http://www.parrot.com/flowerpower/) API.

Getting Starting
---------------

- Make sure you have a Flower Power account and device set up.

- Get the OAuth tokens from the [api access form](https://apiflowerpower.parrot.com/api_access/signup).

Install
-------

    npm install flower-power

Example #1
---

    var CloudAPI = require('flower-power');

    var auth = {
      username: '',
      password: '',
      client_id: '',
      client_secret: '',
    };

    var api = new CloudAPI(auth);

    // Method #1
    api.getGarden(function(err, plants, sensors) {
      if(err) {
        throw "Error";
      }

      plants.forEach(function(plant) {

        api.getSamples({id: plant.location_identifier}, function(err, samples, events, fertilizer) {

          if(err) {
            throw "Error";
          }

          console.log('samples', samples.length);
          console.log('events', events.length);
          console.log('fertilizer', fertilizer.length);
        });

      });
    });


Example #2
---

    var CloudAPI = require('flower-power');

    var auth = {
      username: '',
      password: '',
      client_id: '',
      client_secret: '',
    };

    // Method #2
    var getGarden = function() {
      api.getGarden();
    };

    var getSamples = function(err, plants, sensors) {
      plants.forEach(function(plant) {
        api.getSamples({id: plant.location_identifier});
      });
    };

    var getSample = function(err, samples, events, fertilizer) {
      console.log('samples', samples.length);
      console.log('events', events.length);
      console.log('fertilizer', fertilizer.length);
    };

    api.on('authenticated', getGarden);
    api.on('have-garden', getSamples);
    api.on('have-sample', getSample);
