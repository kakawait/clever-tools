var path = require("path");

var _ = require("lodash");
var Bacon = require("baconjs");

var instanceTypes = require("./application.instance-types.js");
var instanceTypeSlugNames = _.map(instanceTypes, function(instanceType) {
  return instanceType.type;
});

function fakeApi() {
  var api = {};
  api.products = {};
  api.products.instances = {};
  api.products.instances.get = function() {
    return {
      send: function() {
        return Bacon.constant(instanceTypes);
      }
    };
  };

  api.owner = function() {
    return {
      applications: {
        post: function() {
          return {
            send: function(body) {
              try {
                var json = JSON.parse(body);
                return require("./application.app.js")(json);
              }
              catch(e) {
                return Bacon.once(new Bacon.Error(e));
              }
            }
          };
        }
      }
    };
  };

  return api;
}

describe("application", function() {
  var app;
  var api;

  beforeEach(function() {
    app = require("../src/models/application.js");
    api = fakeApi();
  });

  it("should be able to get an instance type", function(done) {
    var s_types = Bacon.combineAsArray(_.map(instanceTypeSlugNames, function(type) {
      return app.getInstanceType(api, type);
    }));

    s_types.subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().length).toBe(instanceTypeSlugNames.length);
      done();

      return Bacon.noMore;
    });
  });

  it("should return an error when trying to get an invalid type", function(done) {
    app.getInstanceType(api, "blablablabla").subscribe(function(event) {
      expect(event.isError()).toBe(true);
      done();

      return Bacon.noMore;
    });
  });

  it("should be able to create an application for each instance type", function(done) {
    var s_apps = Bacon.combineAsArray(_.map(instanceTypes, function(type) {
      return app.create(api, "My node application", type, "par");
    }));

    s_apps.subscribe(function(event) {
      expect(event.hasValue()).toBe(true);
      expect(event.value().length).toBe(instanceTypes.length);
      done();

      return Bacon.noMore;
    });
  });
});