(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('axios'), require('es6-promise'), require('qs'), require('underscore'), require('underscore.string'), require('underscore.inflection')) :
  typeof define === 'function' && define.amd ? define(['axios', 'es6-promise', 'qs', 'underscore', 'underscore.string', 'underscore.inflection'], factory) :
  (global.ActiveResource = factory(global.axios,global.es6Promise,global.Qs,global._,global.s));
}(this, (function (axios,es6Promise,Qs,_,s) { 'use strict';

  axios = axios && axios.hasOwnProperty('default') ? axios['default'] : axios;
  es6Promise = es6Promise && es6Promise.hasOwnProperty('default') ? es6Promise['default'] : es6Promise;
  Qs = Qs && Qs.hasOwnProperty('default') ? Qs['default'] : Qs;
  _ = _ && _.hasOwnProperty('default') ? _['default'] : _;
  s = s && s.hasOwnProperty('default') ? s['default'] : s;

  var ActiveResource;
  if (!(typeof exports === 'object' && typeof module !== 'undefined')) {
    window.Promise = es6Promise.Promise;
  }

  var activeResource = ActiveResource = class ActiveResource {};
  (function () {
    // Extends a klass with a mixin's members, so the klass itself will have those members
    // @param [Class] klass the object to extend the mixin into
    // @param [Class,Object] mixin the methods/members to extend into the obj
    // @param [Boolean] overwrite overwrite the methods in mixin already on klass
    ActiveResource.extend = function (klass, mixin, overwrite = false) {
      return Object.getOwnPropertyNames(mixin).filter(name => {
        return ['arguments', 'caller', 'length', 'name', 'prototype'].indexOf(name) < 0;
      }).forEach(name => {
        var method;
        method = mixin[name];

        if (!(!overwrite && klass[name] || method.__excludeFromExtend)) {
          return klass[name] = method;
        }
      });
    }; // Adds a mixin's members to a klass prototype, so instances of that klass will
    // have those members
    // @param [Class] klass the klass to include mixin members in when instantiated
    // @param [Class,Object] mixin the methods/members to include into the klass instances
    // @param [Boolean] overwrite overwrite the methods in mixin already on klass


    ActiveResource.include = function (klass, mixin, overwrite = false) {
      return this.extend(klass.prototype, mixin, overwrite);
    };
  }).call(undefined);
  (function () {
    // Provides support methods for determing the type (also known as klass) of different objects in
    // the ActiveResource framework
    ActiveResource.prototype.Typing = function () {
      var getPrototypeOf;

      class Typing {
        // Returns the class of the object
        // @return [Class] the class for the object
        static klass() {
          return this.constructor;
        } // Determines if this object is of type `klass`
        // @return [Boolean] whether or not the object is of type klass


        static isA(klass) {
          var match, object;
          object = this.constructor;
          match = object === klass;

          while (!(match || (object = getPrototypeOf(object)) == null)) {
            match = object === klass;
          }

          return match;
        }

      }

      

      getPrototypeOf = o => {
        var _getPrototypeOf;

        _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : o => {
          return o.__proto__ || Object.getPrototypeOf(o);
        };
        return _getPrototypeOf(o);
      };

      return Typing;
    }.call(this);
  }).call(undefined);
  (function () {
    // Creates a library that holds resources classes
    // @param [String] baseUrl the base url for the resource server
    // @option [Object] headers the headers to send with each request made in this library
    // @option [Interface] interface the interface to use when making requests and building responses
    // @option [Object] constantizeScope the scope to use when calling #constantize
    // @option [Boolean] immutable if true, resources will act as immutable structures
    // @option [Boolean] includePolymorphicRepeats if true, primary data’s relationships will send polymorphic owner data to
    //   the server despite that data also being the primary data (a repetition, some servers don't make the assumption)
    // @option [Boolean] strictAttributes if true, only attributes defined in a class via the static attributes method will
    //   be returned from resource.attributes()
    // @return [ResourceLibrary] the created resource library
    ActiveResource.createResourceLibrary = function (baseUrl, options = {}) {
      var ResourceLibrary, _interface, library;

      _interface = options.interface || ActiveResource.Interfaces.JsonApi;
      library = ResourceLibrary = class ResourceLibrary {
        constructor() {
          var Base, base, resourceLibrary;
          Object.defineProperties(this, {
            headers: {
              get: () => {
                return this._headers;
              },
              set: value => {
                this._headers = value;
                return this.interface = new _interface(this);
              }
            }
          });
          this.baseUrl = baseUrl.charAt(baseUrl.length - 1) === '/' ? baseUrl : `${baseUrl}/`;
          this._headers = options.headers;
          this.interface = new _interface(this);
          this.constantizeScope = options['constantizeScope'];
          this.immutable = options.immutable;
          this.includePolymorphicRepeats = options.includePolymorphicRepeats;
          this.strictAttributes = options.strictAttributes;
          base = this.immutable ? ActiveResource.prototype.Immutable.prototype.Base : ActiveResource.prototype.Base;
          resourceLibrary = this;

          this.Base = Base = function () {
            class Base extends base {}

            
            Base.resourceLibrary = resourceLibrary;
            return Base;
          }.call(this);
        } // Constantizes a className string into an actual ActiveResource::Base class
        // @note If constantizeScope is null, checks the property on the resource library
        // @note Throws exception if klass cannot be found
        // @param [String] className the class name to look for a constant with
        // @return [Class] the class constant corresponding to the name provided


        constantize(className) {
          var i, klass, len, scope, v;
          klass = null;

          if (!_.isUndefined(className) && !_.isNull(className)) {
            scope = this.constantizeScope && _.values(this.constantizeScope) || _.values(this);

            for (i = 0, len = scope.length; i < len; i++) {
              v = scope[i];

              if (_.isObject(v) && v.className === className) {
                klass = v;
              }
            }
          }

          if (klass == null) {
            throw `NameError: klass ${className} does not exist`;
          }

          return klass;
        } // Creates an ActiveResource::Base class from klass provided
        // @param [Class] klass the klass to create into an ActiveResource::Base class in the library
        // @return [Class] the klass now inheriting from ActiveResource::Base


        createResource(klass) {
          klass.className || (klass.className = klass.name);
          klass.queryName || (klass.queryName = _.pluralize(s.underscored(klass.className)));

          if (typeof klass.define === "function") {
            klass.define();
          }

          (this.constantizeScope || this)[klass.className] = klass;
          return klass;
        }

      };
      return new library();
    };
  }).call(undefined);
  (function () {
    // Abstract class for defining an interface between a server and ActiveResource
    // TODO: Ensure contentType is consistent in requests/responses
    ActiveResource.Interfaces = ActiveResource.prototype.Interfaces = function () {
      class Interfaces {}

      

      Interfaces.prototype.Base = function () {
        class Base {
          constructor(resourceLibrary) {
            this.resourceLibrary = resourceLibrary;
            this.axios = axios.create({
              headers: _.extend(_.clone(this.resourceLibrary.headers || {}), {
                'Content-Type': this.constructor.contentType
              })
            });
            this.axios.interceptors.response.use(config => {
              return config;
            }, error => {
              if (error.response.status === 408 || error.code === 'ECONNABORTED') {
                return Promise.reject({
                  response: {
                    data: {
                      errors: [{
                        code: 'timeout',
                        detail: `Timeout occurred while loading ${error.config.url}`
                      }]
                    }
                  }
                });
              } else {
                return Promise.reject(error);
              }
            });
          }

          request(url, method, data) {
            var options;
            options = {
              responseType: 'json',
              method: method,
              url: url
            };

            if (method === 'GET') {
              options.params = data;

              options.paramsSerializer = function (params) {
                return Qs.stringify(params, {
                  arrayFormat: 'brackets'
                });
              };
            } else {
              options.data = data;
            }

            return this.axios.request(options);
          } // Make GET request
          // @param [String] url the url to query
          // @param [Object] queryParams query params to send to the server


          get(url, queryParams) {
            throw '#get not implemented on base interface';
          } // Make POST request
          // @param [String] url the url to query
          // @param [Object] resourceData the resourceData to send to the server
          // @param [Object] options options that may modify the data sent to the server


          post(url, resourceData, options) {
            throw '#post not implemented on base interface';
          } // Make PATCH request
          // @param [String] url the url to query
          // @param [Object] resourceData the resourceData to send to the server
          // @param [Object] options options that may modify the data sent to the server


          patch(url, resourceData, options) {
            throw '#patch not implemented on base interface';
          } // Make PUT request
          // @param [String] url the url to query
          // @param [Object] resourceData the resourceData to send to the server
          // @param [Object] options options that may modify the data sent to the server


          put(url, resourceData, options) {
            throw '#put not implemented on base interface';
          } // Make DELETE request
          // @param [String] url the url to query
          // @param [Object] resourceData the resourceData to send to the server
          // @param [Object] options options that may modify the data sent to the server


          delete(url, resourceData, options) {
            throw '#delete not implemented on base interface';
          }

        }

        
        Base.contentType = 'application/json';
        return Base;
      }.call(this);

      return Interfaces;
    }.call(this);
  }).call(undefined);
  (function () {
    // Implements an interface according the JSON API standard defined by (http://jsonapi.org/format/)
    // @example JSON API format
    //   response = {
    //     data: {
    //       id: "10",
    //       type: "merchants", # plural type name
    //       attributes: {
    //         name: "...",
    //         balance: "...",
    //       },
    //       links: {
    //         self: "https://app.getoccasion.com/api/v1/merchants/10"
    //       },
    //       relationships: {
    //         products: [
    //           { id: "1202", type: "products" },
    //           { id: "1203", type: "products" }
    //         ]
    //       }
    //     },
    //     included: [
    //       { id: "1202", type: "products", attributes: { title: "..." } },
    //       { id: "1203", type: "products", attributes: { title: "..." } }
    //     ]
    //   }
    ActiveResource.Interfaces.JsonApi = ActiveResource.prototype.Interfaces.prototype.JsonApi = function () {
      class JsonApi extends ActiveResource.prototype.Interfaces.prototype.Base {
        // Makes an HTTP request to a url with data
        // @note Uses base request, but checks to make sure response is in JSON API format
        // @param [String] url the url to query
        // @param [String] method the HTTP verb to use for the request
        // @param [Object] data the data to send to the server
        request(url, method, data) {
          return super.request(url, method, data).then(function (response) {
            var ref;

            if (!(((ref = response.data) != null ? ref.data : void 0) != null || response.status === 204)) {
              throw `Response from ${url} was not in JSON API format`;
            }

            return response.data;
          });
        } //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        //                        FORMAT CONVERSION FUNCTIONS
        //                  (convert to/from underscored/camelcase)
        //               JSON format / Javascript format respectively
        //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        // Converts an object's attributes to underscore format
        // @note Usually the attributes are in camelCase format, the standard for Javascript
        // @param [Object] the object to convert the attributes of to underscore format
        // @return [Object] the object with attributes in underscore format


        toUnderscored(object) {
          var k, underscored, underscorize, v;
          underscored = {};

          underscorize = value => {
            if (_.isObject(value) && !(typeof value.isA === "function" ? value.isA(ActiveResource.prototype.Base) : void 0) && !(typeof value.isA === "function" ? value.isA(ActiveResource.prototype.Collection) : void 0) && !_.isDate(value)) {
              return this.toUnderscored(value);
            } else {
              return value;
            }
          };

          for (k in object) {
            v = object[k];
            underscored[s.underscored(k)] = _.isArray(v) ? _.map(v, underscorize) : underscorize(v);
          }

          return underscored;
        } // Converts an object's attributes to camelCase format
        // @note Usually the attributes are in underscore format, the standard for data
        //   from a Rails server
        // @param [Object] the object to convert the attributes of to camelCase format
        // @return [Object] the object with attributes in camelCase format


        toCamelCase(object) {
          var camelize, camelized, k, v;
          camelized = {};

          camelize = value => {
            if (_.isObject(value) && !(typeof value.isA === "function" ? value.isA(ActiveResource.prototype.Base) : void 0) && !(typeof value.isA === "function" ? value.isA(ActiveResource.prototype.Collection) : void 0)) {
              return this.toCamelCase(value);
            } else {
              return value;
            }
          };

          for (k in object) {
            v = object[k];
            camelized[s.camelize(k)] = _.isArray(v) ? _.map(v, camelize) : camelize(v);
          }

          return camelized;
        } //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        //                 JSONAPI GET REQUEST FORMATTING FUNCTIONS
        //                 (build sparse fieldsets, include trees)
        //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        // Takes in an object of filter key/value pairs and builds them into a JSON API filter object
        // @note Used in constructing queryParams of GET queries
        // @note If value is an ActiveResource, it will be transformed to use the resource's primaryKey
        // @param [Object] filters the object containing filter data to be transformed
        // @return [Object] the transformed filters


        buildFilters(filters) {
          return this.toUnderscored(_.mapObject(filters, function (value) {
            var transformValue;

            transformValue = function (v) {
              if (v != null ? typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Base) : void 0 : void 0) {
                return v[v.klass().primaryKey];
              } else if (_.isNull(v)) {
                return '%00';
              } else {
                return v;
              }
            };

            if (_.isArray(value) || (value != null ? typeof value.isA === "function" ? value.isA(ActiveResource.Collection) : void 0 : void 0)) {
              return ActiveResource.Collection.build(value).map(v => {
                return transformValue(v);
              }).join();
            } else {
              return transformValue(value);
            }
          }));
        } // Takes in an object of modelName/fieldArray pairs and joins the fieldArray into a string
        // @note Used in constructing queryParams of GET queries
        // @note Will merge include queryParams into fields
        // @example
        //   { order: ['id', 'updatedAt'] } # => { order: 'id,updated_at' }
        // @param [Object] fields the object containing field data to be built into a fieldSet
        // @param [Object] queryParams the object containing include and __root data to be built into a fieldSet
        // @return [Object] the built field set
        // 1. If queryParams.include, merge those into fields
        //   1. Iterate over of array of includes from queryParams.includes or array of objects/values from nested includes
        //   2. If string, add to keyForString, which is either queryParams.__root or the key for the nested include
        //   3. If object, split into individual keys as objects and add value to appropriate field for key
        //   4. If value of object is an array or object, split that and iterate over it until a singular value is reached
        // 2. Then, go through each key of the object, map its array of fields to underscored fields
        // 3. Take the mapped array of fields and join them, replacing the value of the key with the joined string


        buildSparseFieldset(fields, queryParams) {
          var mergeNestedIncludes;
          fields = _.clone(fields);

          if (queryParams.include) {
            mergeNestedIncludes = (includes, keyForString = queryParams.__root) => {
              return ActiveResource.Collection.build(includes).each(include => {
                var k, key, value;

                if (_.isString(include)) {
                  fields[keyForString] || (fields[keyForString] = []);
                  fields[keyForString] = fields[keyForString].slice(0);
                  return fields[keyForString].push(include);
                } else if (_.isObject(include)) {
                  if (_.keys(include).length > 1) {
                    return mergeNestedIncludes(function () {
                      var j, len, ref, results;
                      ref = _.keys(include);
                      results = [];

                      for (j = 0, len = ref.length; j < len; j++) {
                        k = ref[j];
                        results.push(_.pick(include, k));
                      }

                      return results;
                    }());
                  } else {
                    key = _.keys(include)[0];
                    value = _.values(include)[0];

                    if (_.isArray(value)) {
                      mergeNestedIncludes(value, key);
                      return;
                    } else if (_.isObject(value)) {
                      mergeNestedIncludes(function () {
                        var j, len, ref, results;
                        ref = _.keys(value);
                        results = [];

                        for (j = 0, len = ref.length; j < len; j++) {
                          k = ref[j];
                          results.push(_.pick(value, k));
                        }

                        return results;
                      }());
                      value = _.keys(value)[0];
                    }

                    fields[key] || (fields[key] = []);
                    fields[key] = fields[key].slice(0);
                    return fields[key].push(value);
                  }
                }
              });
            };

            mergeNestedIncludes(queryParams.include);
          }

          return this.toUnderscored(_.mapObject(fields, function (fieldArray) {
            return _.map(fieldArray, function (f) {
              return s.underscored(f);
            }).join();
          }));
        } // Takes in an array of include objects (strings, nested strings in objects) and turns them into a
        // dotted include tree
        // @note Used in constructing queryParams of GET queries
        // @example
        //   ['merchant','products'] # => 'merchant,products'
        // @example
        //   ['merchant',{ products: ['orders','venue'] }] # => 'merchant,products.orders,products.venue'
        // @param [Object] includes the array containing includes to build into an include tree
        // @return [Object] the built include tree
        // 1. Iterate over each include, adding each as a formatted string to includeStrArray
        // 2. If include is object, format it by passing it into function buildNestedIncludes that
        //    takes an object { transactions: ... } and recurses over it to produce an array of
        //    strings like ['transactions.X','transactions.Y']
        //    * The object can be of three forms:
        //      1. { transactions: 'include' }
        //      2. { transactions: ['includes','includes2'] }
        //      3. { transactions: { deeperInclude: ... } }
        //    * If of form 1 or 2, it returns an array of strings with the modelName followed by the include name
        //      ['transactions.includes','transactions.includes2']
        //    * If of form 3, it recurses, passing the value { deeperInclude: ... } into buildNestedIncludes and
        //      eventually returning an array of strings ['transactions.deeperInclude.X','transactions.deeperInclude.Y']
        // 3. If include is string, it is formatted
        // 4. Return the includeStrArray as a ',' joined string


        buildIncludeTree(includes) {
          var buildNestedIncludes;

          buildNestedIncludes = function (object) {
            var includeCollection, modelName, value;
            modelName = s.underscored(_.keys(object)[0]);
            value = _.values(object)[0];
            includeCollection = ActiveResource.prototype.Collection.build([value]).flatten().map(function (item) {
              if (_.isString(item)) {
                return _.map(item.split(','), function (i) {
                  return s.underscored(i);
                });
              } else if (_.isObject(item)) {
                return buildNestedIncludes(item);
              }
            }).flatten();
            return includeCollection.map(function (i) {
              return `${modelName}.${i}`;
            }).toArray();
          };

          return ActiveResource.prototype.Collection.build(includes).inject([], function (includeStrArray, include) {
            if (_.isObject(include)) {
              includeStrArray.push(...buildNestedIncludes(include));
              return includeStrArray;
            } else {
              includeStrArray.push(s.underscored(include));
              return includeStrArray;
            }
          }).join();
        } // Builds a list of sorting params based on an object that defines asc/desc ordering
        // @example
        //   { updatedAt: 'asc' } # => 'updated_at'
        // @example
        //   { createdAt: 'desc', updatedAt: 'asc' }
        //   # => '-created_at,updated_at'
        // @param [Object] sortObject the object defining sorting columns
        // @return [String] a JSON API formatted string that defines sorting


        buildSortList(sortObject) {
          var column, dir, output;
          output = [];

          for (column in sortObject) {
            dir = sortObject[column];

            if (dir === 'asc') {
              output.push(s.underscored(column));
            } else if (dir === 'desc') {
              output.push(`-${s.underscored(column)}`);
            }
          }

          return output.join(',');
        } //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        //                 JSONAPI POST REQUEST FORMATTING FUNCTIONS
        //          builds resources into a resource document to send in POST,
        //                     PATCH, PUT, and DELETE requests
        //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        // Builds a resource identifier (id + type) from a resource
        // @param [ActiveResource::Base] the resource to convert to a resource identifier
        // @return [Object] the resource identifier for the object


        buildResourceIdentifier(resource) {
          var identifier, primaryKeyValue;
          identifier = {
            type: resource.klass().queryName
          };

          if (primaryKeyValue = resource[resource.klass().primaryKey]) {
            identifier[resource.klass().primaryKey] = primaryKeyValue.toString();
          }

          return identifier;
        } // Builds a relationship object for a resource, given a resource
        // @param [ActiveResource::Base] resource the resource to get relationship data from
        // @return [Object] the built relationship object for the resource


        buildResourceRelationships(resource, relationships, onlyChanged = false) {
          var output;
          output = {};

          _.each(relationships, relationship => {
            var reflection, target;
            reflection = resource.klass().reflectOnAssociation(relationship);
            target = resource.association(reflection.name).target;

            if (!onlyChanged && (reflection.collection() && target.empty() || target == null)) {
              return;
            }

            return output[s.underscored(reflection.name)] = {
              data: this.buildResourceDocument({
                resourceData: target,
                onlyResourceIdentifiers: !reflection.autosave(),
                onlyChanged: onlyChanged,
                parentReflection: reflection.polymorphic() ? reflection.polymorphicInverseOf(target.klass()) : reflection.inverseOf()
              })
            };
          });

          return output;
        } // Builds a resource document in JSON API format to be sent to the server in persistence calls
        // @param [ActiveResource::Base,Array<ActiveResource::Base>] resourceData the resourceData to convert to a resource document
        // @param [Boolean] onlyResourceIdentifiers if true, only renders the primary key/type (a resource identifier)
        //   if false, also renders attributes and relationships
        // @return [Array] an array of resource identifiers, possibly with attributes/relationships


        buildResourceDocument({
          resourceData,
          onlyResourceIdentifiers,
          onlyChanged,
          parentReflection
        }) {
          var data;
          onlyResourceIdentifiers = onlyResourceIdentifiers || false;
          onlyChanged = onlyChanged || false;
          data = ActiveResource.prototype.Collection.build(resourceData).compact().map(resource => {
            var attributes, changedFields, documentResource, relationships;
            documentResource = this.buildResourceIdentifier(resource);

            if (!onlyResourceIdentifiers) {
              attributes = _.omit(resource.attributes({
                readWrite: true
              }), resource.klass().primaryKey);
              relationships = _.keys(resource.klass().reflections());

              if (parentReflection) {
                if (!(parentReflection.polymorphic() && this.resourceLibrary.includePolymorphicRepeats)) {
                  relationships = _.without(relationships, parentReflection.name);
                }
              }

              if (onlyChanged) {
                changedFields = resource.changedFields().toArray();
                attributes = _.pick(attributes, ...changedFields);
                relationships = _.intersection(relationships, changedFields);
              }

              documentResource['attributes'] = this.toUnderscored(attributes);
              documentResource['relationships'] = this.buildResourceRelationships(resource, relationships, onlyChanged);
            }

            return documentResource;
          });

          if (_.isArray(resourceData) || _.isObject(resourceData) && (typeof resourceData.isA === "function" ? resourceData.isA(ActiveResource.prototype.Collection) : void 0)) {
            return data.toArray();
          } else {
            return data.first() || null;
          }
        } //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        //                 JSONAPI RESPONSE CONSTRUCTION FUNCTIONS
        //          (takes JSONAPI responses and builds them into resources)
        //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        // Builds a "resource" from the JSON API into an ActiveResource of type `type`
        // @example
        //   Before: Object{ id: '100', type: 'orders', attributes: { verification_code: '...' }, relationships: { ... } }
        //   After:  Order{ id: 100, verificationCode: '...' }
        // @param [Object] data the data of the resource to instantiate
        // @param [Array] includes the array of includes to search for resource relationships in
        // @param [ActiveResource::Base] existingResource an existingResource to use instead of building a new one
        // @param [ActiveResource::Base] parentRelationship the owner relationship name/resource that is building this resource
        // @return [ActiveResource] the built ActiveResource


        buildResource(data, includes, {
          existingResource,
          parentRelationship
        }) {
          var attributes, justCreated, resource;
          resource = existingResource || this.resourceLibrary.constantize(_.singularize(s.classify(data['type']))).build();
          justCreated = existingResource && existingResource.newResource();
          attributes = data['attributes'] || {};

          if (data[resource.klass().primaryKey]) {
            attributes[resource.klass().primaryKey] = data[resource.klass().primaryKey].toString();
          }

          if (parentRelationship != null) {
            attributes = _.extend(attributes, parentRelationship);
          }

          attributes = this.addRelationshipsToFields(attributes, data['relationships'], includes, resource);
          attributes = this.toCamelCase(attributes);

          resource.__assignFields(attributes);

          resource.__links = _.extend(resource.links(), data['links']);
          resource.klass().reflectOnAllAssociations().each(function (reflection) {
            var association, ref, ref1, ref2, ref3, relationship, relationshipEmpty, relationshipLinks, selfLink, url_safe_reflection_name;
            association = resource.association(reflection.name);

            if ((relationshipLinks = (ref = data['relationships']) != null ? (ref1 = ref[s.underscored(reflection.name)]) != null ? ref1['links'] : void 0 : void 0) != null) {
              association.__links = _.extend(association.links(), _.mapObject(relationshipLinks, l => {
                return ActiveResource.prototype.Links.__constructLink(l);
              }));
            } else if ((selfLink = resource.links()['self']) != null) {
              url_safe_reflection_name = s.underscored(reflection.name);
              association.__links = {
                self: ActiveResource.prototype.Links.__constructLink(selfLink, 'relationships', url_safe_reflection_name),
                related: ActiveResource.prototype.Links.__constructLink(selfLink, url_safe_reflection_name)
              };
            }

            relationshipEmpty = _.isObject(relationship = (ref2 = data['relationships']) != null ? (ref3 = ref2[s.underscored(reflection.name)]) != null ? ref3['data'] : void 0 : void 0) ? _.keys(relationship).length === 0 : relationship != null ? relationship.length === 0 : true;

            if (_.has(attributes, reflection.name) || relationshipEmpty) {
              return association.loaded(true);
            }
          });

          if (justCreated) {
            resource.__executeCallbacks('afterCreate');
          }

          resource.__executeCallbacks('afterRequest');

          return resource;
        } // Interprets all the relationships identified in a resource, searching the `included` part of the response
        //   for each object of each relationship and building it into the resource attributes
        // @example singular relationship
        //   object = {
        //     id: '10', type: 'orders',
        //     attributes: { verification_code: '...' },
        //     relationships: {
        //       product: { data: { id: '1202', type: 'products' } }
        //     }
        //   }
        //  included = [
        //    { id: '1202', type: 'products', attributes: { title: '...' } }
        //  ]
        //   sets attributes['product'] = Product{ id: 1202, title: '...' }
        //   @note (this is the instantiated ActiveResource class for the include)
        // @example plural relationship
        //   object = {
        //     id: '10', type: 'merchants',
        //     attributes: { name: '...' },
        //     relationships: {
        //       products: { data: [{ id: '1202', type: 'products' },{ id: '1203', type: 'products' }] }
        //     }
        //   }
        //  included = [
        //    { id: '1202', type: 'products', attributes: { title: '...' } },
        //    { id: '1202', type: 'products', attributes: { title: '...' } }
        //  ]
        //   sets attributes['products'] = [
        //     Product{ id: 1202, title: '...' },
        //     Product{ id: 1203, title: '...' }
        //   ]
        // @param [Object] attributes the attribute object to build relationships into
        // @param [Object] relationships the object defining the relationships to be built into `attributes`
        // @param [Array] includes the array of includes to search for relationship resources in
        // @param [ActiveResource::Base] resource the resource to get the primary key of
        // @return [Object] the attributes with all relationships built into it


        addRelationshipsToFields(attributes, relationships, includes, resource) {
          _.each(relationships, (relationship, relationshipName) => {
            var include, reflection, relationshipItems;

            if (reflection = resource.klass().reflectOnAssociation(s.camelize(relationshipName))) {
              if (reflection.collection()) {
                relationshipItems = ActiveResource.prototype.Collection.build(relationship['data']).map((relationshipMember, index) => {
                  return this.findResourceForRelationship(relationshipMember, includes, resource, reflection, index);
                }).compact();

                if (!(typeof relationshipItems.empty === "function" ? relationshipItems.empty() : void 0)) {
                  return attributes[relationshipName] = relationshipItems;
                }
              } else if (relationship['data'] != null) {
                include = this.findResourceForRelationship(relationship['data'], includes, resource, reflection);

                if (include != null) {
                  return attributes[relationshipName] = include;
                }
              }
            }
          });

          return attributes;
        } // Finds a resource in the 'included' collection of the response, based on relationship data taken from another
        //   resource, and builds it into an ActiveResource
        // @note If an include is not found, but relationship data is present, the resource identifiers are matched to
        //   resources already on the existing relationship so that these resources will be moved into __fields
        // @example
        //   relationshipData = { id: '1202', type: 'products' }
        //   includes = [{ id: '102', type: 'orders', attributes: { ... }, { id: '1202', type: 'products', attributes: { ... } }]
        //   returns { id: '1202', type: 'products', ... }
        // @param [Object] relationshipData the data defining the relationship to match an include to
        // @param [Array] includes the array of includes to search for relationships in
        // @param [ActiveResource::Base] resource the resource to get the primary key of
        // @param [Reflection] reflection the reflection for the relationship
        // @param [Integer] index the index of the relationship data (only in collection relationships)
        // @return [ActiveResource::Base] the include built into an ActiveResource::Base


        findResourceForRelationship(relationshipData, includes, resource, reflection, index) {
          var buildResourceOptions, findConditions, include, parentReflection, potentialTarget, primaryKey, target;
          primaryKey = resource.klass().primaryKey;
          findConditions = {
            type: relationshipData.type
          };
          findConditions[primaryKey] = relationshipData[primaryKey];
          include = _.findWhere(includes, findConditions);

          if (reflection.collection()) {
            target = resource.association(reflection.name).target.detect(t => {
              return t[primaryKey] === findConditions[primaryKey];
            }) || resource.association(reflection.name).target.get(index);
          } else if ((potentialTarget = resource.association(reflection.name).target) != null) {
            if (!reflection.polymorphic() || potentialTarget.klass().queryName === findConditions['type']) {
              target = potentialTarget;
            }
          }

          buildResourceOptions = {};

          if (reflection.polymorphic()) {
            parentReflection = reflection.polymorphicInverseOf(this.resourceLibrary.constantize(_.singularize(s.classify(relationshipData['type']))));
          } else {
            parentReflection = reflection.inverseOf();
          }

          if (parentReflection != null) {
            buildResourceOptions.parentRelationship = {};
            buildResourceOptions.parentRelationship[parentReflection.name] = parentReflection.collection() ? [resource] : resource;
          }

          if (target != null) {
            buildResourceOptions.existingResource = target;
          }

          if (target != null || include != null) {
            return this.buildResource(include || {}, includes, buildResourceOptions);
          }
        } // Merges the changes made from a POST/PUT/PATCH call into the resource that called it
        // @param [Object] response The response to pull persisted changes from
        // @param [ActiveResource::Base] the resource to merge persisted changes into
        // @return [ActiveResource::Base] the resource, now persisted, with updated changes


        mergePersistedChanges(response, resource) {
          return this.buildResource(response['data'], response['included'], {
            existingResource: resource
          });
        } // Adds errors in making a POST/PUT/PATCH call into the resource that called it
        // @note The format for resource errors is as follows:
        //   {
        //     "errors": [
        //       {
        //         "source": { "pointer": "/data/attributes/title" },
        //         "code": "blank",
        //         "detail": "Title cannot be blank."
        //       },
        //       {
        //         "source": { "pointer": "/data/relationships/product" },
        //         "code": "blank",
        //         "detail": "Product cannot be blank."
        //       },
        //       {
        //         "source": { "pointer": "/data/relationships/product/data/attributes/title" },
        //         "code": "blank",
        //         "detail": "Title cannot be blank."
        //       }
        //     ]
        //   }
        // @param [Object] response The response to pull errors from
        // @param [ActiveResource::Base] the resource to add errors onto
        // @return [ActiveResource::Base] the unpersisted resource, now with errors


        resourceErrors(resource, errors) {
          var errorCollection;
          errorCollection = ActiveResource.Collection.build(errors).map(function (error) {
            var field;
            field = [];

            if (error['source']['pointer'] === '/data') {
              field.push('base');
            } else {
              _.each(error['source']['pointer'].split('/data'), function (i) {
                var m;

                if ((m = i.match(/\/(attributes|relationships|)\/(\w+)/)) != null) {
                  return field.push(s.camelize(m[2]));
                }
              });
            }

            return resource.errors().__buildError(field.join('.'), s.camelize(error['code']), error['detail']);
          });
          resource.errors().propagate(errorCollection);
          return resource;
        } // De-serializes errors from the error response to GET and DELETE requests,
        // which will be of the form: { source: { parameter: '...' } }
        // @note The format for parameter errors is as follows:
        //   {
        //     "errors": [
        //       {
        //         "source": { "parameter": "a_parameter" },
        //         "code": "invalid",
        //         "detail": "a_parameter was invalid."
        //       }
        //     ]
        //   }
        // @param [Array] errors the errors to de-serialize
        // @return [Collection] the collection of errors


        parameterErrors(errors) {
          return ActiveResource.prototype.Collection.build(errors).map(function (error) {
            var out, ref;
            out = {
              detail: error['detail'],
              message: error['detail']
            };

            if (((ref = error['source']) != null ? ref['parameter'] : void 0) != null) {
              out['parameter'] = s.camelize(error['source']['parameter']);
            }

            out['code'] = s.camelize(error['code']);
            return out;
          });
        } //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        //                          HTTP REQUEST METHODS
        //          (takes JSONAPI responses and builds them into resources)
        //---------------------------------------------------------------------------
        //---------------------------------------------------------------------------
        // Make GET request
        // @param [String] url the url to query
        // @param [Object] queryParams query params to send to the server


        get(url, queryParams = {}) {
          var _this, data;

          data = {};

          if (queryParams['filter'] != null) {
            data['filter'] = this.buildFilters(queryParams['filter']);
          }

          if (queryParams['fields'] != null) {
            data['fields'] = this.buildSparseFieldset(queryParams['fields'], queryParams);
          }

          if (queryParams['include'] != null) {
            data['include'] = this.buildIncludeTree(queryParams['include']);
          }

          if (queryParams['sort'] != null) {
            data['sort'] = this.buildSortList(queryParams['sort']);
          }

          if (queryParams['page'] != null) {
            data['page'] = queryParams['page'];
          }

          if (queryParams['limit'] != null) {
            data['limit'] = queryParams['limit'];
          }

          if (queryParams['offset'] != null) {
            data['offset'] = queryParams['offset'];
          }

          _this = this;
          return this.request(url, 'GET', data).then(function (response) {
            var built;
            built = ActiveResource.prototype.CollectionResponse.build(_.flatten([response.data])).map(function (object) {
              object = _this.buildResource(object, response.included, {});
              object.assignResourceRelatedQueryParams(queryParams);
              return object;
            });
            built.links(response.links);

            if (_.isArray(response.data)) {
              return built;
            } else {
              return built.first();
            }
          }, function (errors) {
            return Promise.reject(_this.parameterErrors(errors.response.data['errors']));
          });
        } // Make POST request
        // @param [String] url the url to query
        // @param [Object] resourceData the resourceData to send to the server
        // @param [Object] options options that may modify the data sent to the server
        // @option [Boolean] onlyResourceIdentifiers if false, render the attributes and relationships
        //   of each resource into the resource document


        post(url, resourceData, options = {}) {
          var _this, data, queryParams;

          data = {
            data: this.buildResourceDocument({
              resourceData: resourceData,
              onlyResourceIdentifiers: options['onlyResourceIdentifiers']
            })
          };

          if (!options['onlyResourceIdentifiers']) {
            queryParams = resourceData.queryParams();

            if (queryParams['fields'] != null) {
              data['fields'] = this.buildSparseFieldset(queryParams['fields'], queryParams);
            }

            if (queryParams['include'] != null) {
              data['include'] = this.buildIncludeTree(queryParams['include']);
            }
          }

          _this = this;
          return this.request(url, 'POST', data).then(function (response) {
            if (options['onlyResourceIdentifiers']) {
              return response;
            } else {
              return _this.mergePersistedChanges(response, resourceData);
            }
          }, function (errors) {
            if (options['onlyResourceIdentifiers']) {
              return Promise.reject(errors);
            } else {
              return Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']));
            }
          });
        } // Make PATCH request
        // @param [String] url the url to query
        // @param [Object] resourceData the resourceData to send to the server
        // @param [Object] options options that may modify the data sent to the server
        //   @see #post


        patch(url, resourceData, options = {}) {
          var _this, data, queryParams;

          data = {
            data: this.buildResourceDocument({
              resourceData: resourceData,
              onlyResourceIdentifiers: options['onlyResourceIdentifiers'],
              onlyChanged: true
            })
          };

          if (!options['onlyResourceIdentifiers']) {
            queryParams = resourceData.queryParams();

            if (queryParams['fields'] != null) {
              data['fields'] = this.buildSparseFieldset(queryParams['fields'], queryParams);
            }

            if (queryParams['include'] != null) {
              data['include'] = this.buildIncludeTree(queryParams['include']);
            }
          }

          _this = this;
          return this.request(url, 'PATCH', data).then(function (response) {
            if (options['onlyResourceIdentifiers']) {
              return response;
            } else {
              return _this.mergePersistedChanges(response, resourceData);
            }
          }, function (errors) {
            if (options['onlyResourceIdentifiers']) {
              return Promise.reject(errors);
            } else {
              return Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']));
            }
          });
        } // Make PUT request
        // @param [String] url the url to query
        // @param [Object] resourceData the resourceData to send to the server
        // @param [Object] options options that may modify the data sent to the server
        //   @see #post


        put(url, resourceData, options = {}) {
          var _this, data, queryParams;

          data = {
            data: this.buildResourceDocument({
              resourceData: resourceData,
              onlyResourceIdentifiers: options['onlyResourceIdentifiers']
            })
          };

          if (!options['onlyResourceIdentifiers']) {
            queryParams = resourceData.queryParams();

            if (queryParams['fields'] != null) {
              data['fields'] = this.buildSparseFieldset(queryParams['fields'], queryParams);
            }

            if (queryParams['include'] != null) {
              data['include'] = this.buildIncludeTree(queryParams['include']);
            }
          }

          _this = this;
          return this.request(url, 'PUT', data).then(function (response) {
            if (options['onlyResourceIdentifiers']) {
              return response;
            } else {
              return _this.mergePersistedChanges(response, resourceData);
            }
          }, function (errors) {
            if (options['onlyResourceIdentifiers']) {
              return Promise.reject(errors);
            } else {
              return Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']));
            }
          });
        } // Make DELETE request
        // @note There are two instances where a DELETE request will be made
        //   1. A resource is to be deleted, by calling `DELETE /api/v1/:type/:id`
        //     * In this case, the data will simply be {}
        //   2. A relationship is to have members removed, by calling `DELETE /api/v1/:type/:id/relationships/:relationship`
        //     * In this case, the data will have to be resource identifiers
        // @param [String] url the url to query
        // @param [Object] resourceData the resourceData to send to the server
        // @param [Object] options options that may modify the data sent to the server
        //   @see #post


        delete(url, resourceData, options = {}) {
          var _this, data;

          data = resourceData != null ? {
            data: this.buildResourceDocument({
              resourceData: resourceData,
              onlyResourceIdentifiers: true
            })
          } : {};
          _this = this;
          return this.request(url, 'DELETE', data).then(null, function (errors) {
            if (errors.response.data) {
              return Promise.reject(_this.parameterErrors(errors.response.data['errors']));
            } else {
              return Promise.reject(null);
            }
          });
        }

      }

      
      JsonApi.contentType = 'application/vnd.api+json';
      return JsonApi;
    }.call(this);
  }).call(undefined);
  (function () {
    // Adds methods for managing associations, which are built at the instance level
    // based on reflections stored at the class level of ActiveResources
    ActiveResource.prototype.Associations = class Associations {
      // Finds an association on a resource, and creates it if it was not built yet
      // @note Throws error if association does not exist
      // @param [String] name the name of the association
      // @return [Association] the association for the resource
      association(name) {
        var association, reflection;
        this.__associations || (this.__associations = {});

        if ((association = this.__associations[name]) == null) {
          if ((reflection = this.klass().reflectOnAssociation(name)) == null) {
            throw `Association ${name} does not exist`;
          }

          association = new (reflection.associationClass())(this, reflection);
          this.__associations[name] = association;
        }

        return association;
      } // Builds a one-to-many relationship between an ActiveResource and another collection of ActiveResources
      // @param [String] name the name of the association
      // @param [Object] options the options to build the association with


      static hasMany(name, options = {}) {
        var reflection;
        reflection = ActiveResource.prototype.Associations.prototype.Builder.prototype.HasMany.build(this, name, options);
        return ActiveResource.prototype.Reflection.addReflection(this, name, reflection);
      } // Builds a one-to-one relationship between one ActiveResource and another. This should be used
      // if the class does not contain the foreign_key. If this class contains the foreign_key, you should
      // use #belongsTo() instead
      // @param [String] name the name of the association
      // @param [Object] options the options to build the association with


      static hasOne(name, options = {}) {
        var reflection;
        reflection = ActiveResource.prototype.Associations.prototype.Builder.prototype.HasOne.build(this, name, options);
        return ActiveResource.prototype.Reflection.addReflection(this, name, reflection);
      } // Builds a one-to-one relationship between one ActiveResource and another. This should be used
      // if the class contains the foreign_key. If the other class contains the foreign_key, you should
      // use #hasOne() instead
      // @param [String] name the name of the association
      // @param [Object] options the options to build the association with


      static belongsTo(name, options = {}) {
        var reflection;
        reflection = ActiveResource.prototype.Associations.prototype.Builder.prototype.BelongsTo.build(this, name, options);
        return ActiveResource.prototype.Reflection.addReflection(this, name, reflection);
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource methods for managing attributes of resources
    ActiveResource.prototype.Attributes = class Attributes {
      // Used to establish attribute fields for a resource class
      // @note Attribute fields are tracked along with relationships using `klass().fields()`
      // @see fields.coffee
      // @example Add attributes
      //   class Order extends MyLibrary.Base {
      //     static define() {
      //       this.attributes('price', 'tax')
      //     }
      //   }
      // @example Retrieve klass attributes
      //   resource.klass().attributes()
      // @param [Array<String>] attributes the attributes to add to the list of attributes the class tracks
      // @return [Collection<String>] the klass attributes
      attributes(...attributes) {
        var options;
        options = {};

        if (_.isObject(_.last(attributes))) {
          options = attributes.pop();
        }

        if (this.__attributes == null) {
          this.__attributes = {
            all: ActiveResource.prototype.Collection.build(),
            read: ActiveResource.prototype.Collection.build(),
            readWrite: ActiveResource.prototype.Collection.build()
          };
        }

        if (options.readOnly) {
          this.__attributes.read.push(...attributes);
        } else {
          this.__attributes.readWrite.push(...attributes);
        }

        this.__attributes.all.push(...attributes);

        return this.__attributes;
      } // Checks if the resource has an attribute
      // @param [String] attribute the attribute to check the existence of on the resource
      // @return [Boolean] whether or not the resource has the attribute


      static hasAttribute(attribute) {
        return this.__readAttribute(attribute) != null;
      } // Assigns `attributes` to the resource, using @__assignAttributes to allow this method
      //   to be overridden easier
      // @param [Object] attributes the attributes to assign


      static assignAttributes(attributes) {
        return this.__assignAttributes(attributes);
      } // Retrieves all the attributes of the resource
      // @return [Object] the attributes of the resource


      static attributes(options = {}) {
        var k, output, ref, v;
        output = {};
        ref = this;

        for (k in ref) {
          v = ref[k];

          if (this.__validAttribute(k, v, options)) {
            output[k] = v;
          }
        }

        return output;
      } // Reloads all the attributes from the server, using saved @__queryParams
      // to ensure proper field and include reloading
      // @example
      //   Order.includes('transactions').last().then (order) ->
      //     order.transactions.last().amount == 3.0 # TRUE
      //     Transaction.find(order.transactions.last().id).then (transaction) ->
      //       transaction.update amount: 5, ->
      //         order.transactions.last().amount == 3.0 # TRUE
      //         order.reload().then ->
      //           order.transactions.last().amount == 5.0 # TRUE
      // @return [Promise] a promise to return the reloaded ActiveResource **or** 404 NOT FOUND


      static reload() {
        var ref, resource, url;

        if (!(this.persisted() || ((ref = this.id) != null ? ref.toString().length : void 0) > 0)) {
          throw 'Cannot reload a resource that is not persisted or has an ID';
        }

        resource = this;
        url = this.links()['self'] || ActiveResource.prototype.Links.__constructLink(this.links()['related'], this.id.toString());
        return this.interface().get(url, this.queryParams()).then(function (reloaded) {
          resource.__assignFields(reloaded.attributes());

          resource.klass().reflectOnAllAssociations().each(function (reflection) {
            var target;
            target = reloaded.association(reflection.name).reader();

            if (typeof reflection.collection === "function" ? reflection.collection() : void 0) {
              target = target.toArray();
            }

            return resource.association(reflection.name).writer(target, false);
          });
          return resource;
        });
      } // private
      // Assigns `attributes` to the resource
      // @param [Object] attributes the attributes to assign


      static __assignAttributes(attributes) {
        var k, v;

        for (k in attributes) {
          v = attributes[k];

          try {
            this.association(k).writer(v, false);
          } catch (error) {
            this[k] = v;
          }
        }

        return null;
      } // Reads an attribute on the resource
      // @param [String] attribute the attribute to read
      // @return [Object] the attribute


      static __readAttribute(attribute) {
        return this.attributes()[attribute];
      } // Determines whether or not an attribute is a valid attribute on the resource class
      // @note A property is valid to be in `attributes` if it meets these conditions:
      //   1. It must not be a function
      //   2. It must not be a reserved keyword
      //   3. It must not be an association
      // @param [String] attribute the attribute to determine validity for
      // @param [Number,String,Object] value the value for the attribute, relevant for !strictAttributes mode
      // @param [Object] options the options to modify valid attributes with


      static __validAttribute(attribute, value, options) {
        var e, reserved;
        reserved = ['__super__', '__associations', '__errors', '__fields', '__links', '__queryParams'];

        if (this.klass().resourceLibrary.strictAttributes) {
          if (options.readOnly) {
            return this.klass().attributes().read.include(attribute);
          } else if (options.readWrite) {
            return this.klass().attributes().readWrite.include(attribute);
          } else {
            return this.klass().attributes().all.include(attribute);
          }
        } else {
          return !_.isFunction(value) && !_.contains(reserved, attribute) && function () {
            try {
              return this.association(attribute) == null;
            } catch (error) {
              return true;
            }
          }.call(this);
        }
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource callbacks to execute around things like requests and initialization
    ActiveResource.prototype.Callbacks = class Callbacks {
      callbacks() {
        return this.__callbacks || (this.__callbacks = {
          afterBuild: ActiveResource.prototype.Collection.build(),
          afterCreate: ActiveResource.prototype.Collection.build(),
          afterRequest: ActiveResource.prototype.Collection.build()
        });
      }

      afterBuild(func) {
        return this.callbacks()['afterBuild'].push(func);
      }

      afterCreate(func) {
        return this.callbacks()['afterCreate'].push(func);
      }

      afterRequest(func) {
        return this.callbacks()['afterRequest'].push(func);
      } // private


      static __executeCallbacks(type) {
        return this.klass().callbacks()[type].each(callback => {
          return _.bind(callback, this)();
        });
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource cloning
    ActiveResource.prototype.Cloning = class Cloning {
      // Clones the resource and its relationship resources recursively
      static clone() {
        return this.__createClone({});
      } // private
      // Clones a resource recursively, taking in a cloner argument to protect against circular cloning
      //   of relationships
      // @note This will clone:
      //   1. Resource errors
      //   2. Resource links
      //   3. Resource queryParams
      //   4. Resource attributes
      //   5. Resource relationships
      //     a. Relationship links
      //     b. Relationship loaded status
      //     c. Relationship resources, according to these principles:
      //       1. An autosave association is interpreted as part of the identity of a resource. If the resource
      //          is cloned, the autosave association target is cloned, and vice-versa.
      //       2. Only clone a related resource if it is part of the identity of the resource being cloned.
      // @option [ActiveResource::Base] cloner the resource cloning this resource (always a related resource)
      // @option [ActiveResource::Base] newCloner the clone of cloner to reassign fields to
      // @return [ActiveResource::Base] the cloned resource


      static __createClone({
        cloner,
        newCloner
      }) {
        var attributes, clone;
        clone = this.klass().build();
        this.errors().each((attribute, e) => {
          return clone.errors().push(_.clone(e));
        });
        clone.__links = _.clone(this.links());
        clone.__queryParams = _.clone(this.queryParams());
        attributes = {};
        attributes[this.klass().primaryKey] = this[this.klass().primaryKey];

        clone.__assignAttributes(_.extend(attributes, this.attributes()));

        this.klass().fields().each(f => {
          var newAssociation, oldAssociation, ref, ref1, ref2, ref3, reflection, target;
          clone.__fields[f] = ((ref = this.__fields[f]) != null ? ref.toArray : void 0) != null ? this.__fields[f].clone() : this.__fields[f];

          try {
            oldAssociation = this.association(f);
            newAssociation = clone.association(f);
            newAssociation.__links = _.clone(oldAssociation.links());

            if (oldAssociation.loaded()) {
              newAssociation.loaded(true);
            }

            reflection = oldAssociation.reflection;
            target = reflection.collection() ? reflection.autosave() && oldAssociation.target.include(cloner) ? this.__createCollectionAutosaveAssociationClone(oldAssociation, {
              parentClone: clone,
              cloner: cloner,
              newCloner: newCloner
            }) : ((ref1 = reflection.inverseOf()) != null ? ref1.autosave() : void 0) ? this.__createCollectionInverseAutosaveAssociationClone(oldAssociation, {
              parentClone: clone,
              cloner: cloner
            }) : oldAssociation.target : reflection.autosave() && oldAssociation.target === cloner ? this.__createSingularAutosaveAssociationClone(oldAssociation, {
              parentClone: clone,
              newCloner: newCloner
            }) : ((ref2 = reflection.inverseOf()) != null ? ref2.autosave() : void 0) && oldAssociation.target != null ? this.__createSingularInverseAutosaveAssociationClone(oldAssociation, {
              parentClone: clone,
              cloner: cloner
            }) : (((ref3 = reflection.inverseOf()) != null ? ref3.collection() : void 0) ? this.__replaceSingularInverseCollectionAssociationClone(oldAssociation, {
              parentClone: clone
            }) : void 0, oldAssociation.target);
            return newAssociation.writer(target, false);
          } catch (error) {
            return true;
          }
        });
        return clone;
      } // Creates a clone of an autosave collection association on parentClone when cloner of
      //   parentClone is in the association's target
      // @example
      //   An order has many orderItems that it autosaves. When an orderItem is cloned, clone the order
      //   and replace the cloned orderItem in its orderItems collection but skip cloning the other
      //   orderItems.
      // @note The following changes are made:
      //   1. Replaces the cloner with the newCloner in the collection on parentClone
      //   2. Replaces the cloner with the newCloner in the parentClone fields cache so newCloner
      //        is not registered as a change in the collection
      //   3. Replaces the inverse belongsTo association on each member of the collection with parentClone
      // @param [Association] association the association that is being cloned
      // @param [ActiveResource] parentClone the cloned owner that is cloning the association
      // @param [ActiveResource] cloner the original related resource that initiated parentClone to be cloned
      // @param [ActiveResource] newCloner the clone of cloner
      // @return [Collection] the clone of the collection association


      static __createCollectionAutosaveAssociationClone(association, {
        parentClone,
        cloner,
        newCloner
      }) {
        var clone, inverse;
        clone = association.target.clone();
        clone.replace(cloner, newCloner);

        parentClone.__fields[association.reflection.name].replace(cloner, newCloner);

        if ((inverse = association.reflection.inverseOf()) != null) {
          clone.each(t => {
            if (t.__fields[inverse.name] === this) {
              t.__fields[inverse.name] = parentClone;
            }

            return t.association(inverse.name).writer(parentClone, false);
          });
        }

        return clone;
      } // Clones each item in a collection association on parentClone when the inverse of the association
      //   is autosaving
      // @example
      //   A customer has many orders, and each order autosaves the customer so that customer information
      //   can be updated with each new order. When the order is cloned, clone the customer and since the
      //   customer is cloned, clone each order that it has but skip cloning the order that initiated
      //   cloning.
      // @note The following changes are made:
      //   1. Clones each item in the association
      //   2. Replaces each item in the parentClone fields cache with the clone of each item
      //   3. Skips cloning the item that is the cloner of parentClone
      // @param [Association] association the association that is being cloned
      // @param [ActiveResource] parentClone the cloned owner that is cloning the association
      // @param [ActiveResource] cloner the original related resource that initiated parentClone to be cloned
      // @return [Collection] the original collection association


      static __createCollectionInverseAutosaveAssociationClone(association, {
        parentClone,
        cloner
      }) {
        return association.target.map(t => {
          var clone;

          if (cloner != null && cloner === t) {
            return cloner;
          } else {
            clone = t.__createClone({
              cloner: this,
              newCloner: parentClone
            });

            parentClone.__fields[association.reflection.name].replace(t, clone);

            return clone;
          }
        });
      } // Clones an autosaving singular association on parentClone when cloner is the association's target
      // @example
      //   A customer has many orders, and each order autosaves the customer so that customer information
      //   can be updated with each new order. When the customer is cloned, it will clone its orders,
      //   and each order should replace the customer on its belongsTo association with the cloned one.
      // @note The following changes are made:
      //   1. Replaces the association target with newCloner
      //   2. Replaces the parentClone fields cache with newCloner so newCloner is not registered as a change
      // @param [Association] association the association that is being cloned
      // @param [ActiveResource] parentClone the cloned owner that is cloning the association
      // @param [ActiveResource] newCloner the clone of cloner
      // @return [ActiveResource] the new association target, newCloner


      static __createSingularAutosaveAssociationClone(association, {
        parentClone,
        newCloner
      }) {
        parentClone.__fields[association.reflection.name] = newCloner;
        return newCloner;
      } // Clones a singular association on parentClone when the inverse of the association is autosaving and
      //   the association has a target that can be cloned
      // @example
      //   An order has one rating that it autosaves. When the rating is cloned, clone the order it belongs to.
      // @note
      //   1. If the association target is cloner, no changes are needed
      //   2. If association target is not cloner, clone the association target and replace parentClone field cache
      //        with the clone so that the clone is not registered as a change
      // @param [Association] association the association that is being cloned
      // @param [ActiveResource] parentClone the cloned owner that is cloning the association
      // @param [ActiveResource] cloner the original related resource that initiated parentClone to be cloned
      // @return [ActiveResource] the new association target


      static __createSingularInverseAutosaveAssociationClone(association, {
        parentClone,
        cloner
      }) {
        var clone;

        if (association.target === cloner) {
          return cloner;
        } else {
          clone = association.target.__createClone({
            cloner: this,
            newCloner: parentClone
          });

          if (parentClone.__fields[association.reflection.name] === association.target) {
            parentClone.__fields[association.reflection.name] = clone;
          }

          return clone;
        }
      } // When parentClone has a belongsTo association that is inverse of a collection association, replace
      //   the original of parentClone with parentClone in the collection association
      // @example
      //   An order has many orderItems. When an orderItem is cloned, replace it in the orderItems
      //   collection of the order that it belongs to.
      // @param [Association] association the association that is being cloned
      // @param [ActiveResource] parentClone the cloned owner that is cloning the association


      static __replaceSingularInverseCollectionAssociationClone(association, {
        parentClone
      }) {
        var inverse;
        inverse = association.reflection.inverseOf();
        return association.target.association(inverse.name).target.replace(this, parentClone);
      }

    };
  }).call(undefined);
  (function () {
    // Wraps a Javascript array with some useful functions native to Ruby Arrays
    ActiveResource.Collection = ActiveResource.prototype.Collection = function () {
      class Collection {
        // Builds a new ActiveResource::Collection
        // @param [Array,Collection,Value] array the array/value to wrap in a collection
        // @return [Collection] the built Collection
        static build(array = []) {
          if (array != null ? typeof array.isA === "function" ? array.isA(this) : void 0 : void 0) {
            return array.clone();
          } else if ((array != null ? array.length : void 0) != null) {
            return new this(array);
          } else {
            return new this([array]);
          }
        } // @param [Array] __collection the collection to wrap with Collection functionality


        constructor(__collection = []) {
          this.__collection = __collection;
        } // Returns the size of the collection
        // @return [Integer] the size of the collection


        size() {
          return _.size(this.__collection);
        } // Indicates whether or not the collection is empty
        // @return [Boolean] whether or not the collection is empty


        empty() {
          return this.size() === 0;
        } // Check whether or not the specified item is in the collection
        // @param [Value] item the item to check for in the collection
        // @return [Boolean] whether or not the item is in the collection


        include(item) {
          return this.indexOf(item) >= 0;
        } // Get the index of the specified item in the collection
        // @param [Value] item the item to get the index for in the collection
        // @return [Integer] the index of the item in the collection, or -1 if it is not in the collection


        indexOf(item) {
          return _.indexOf(this.__collection, item);
        } // Gets the item at the index of the collection
        // @param [Integer] index the index to get
        // @return [Value] the item at the index


        get(index) {
          if (!(index >= this.size())) {
            return this.__collection[index];
          }
        } // Sets the index of the collection to the item
        // @param [Integer] index the index to set
        // @param [Value] item the item to set on the index


        set(index, item) {
          if (!(index >= this.size())) {
            return this.__collection[index] = item;
          }
        } // Finds original in the collection and if found, replaces it with next
        // @param [Value] original the original item to replace in the collection
        // @param [Value] next the next value to replace the item
        // @return [


        replace(original, next) {
          var index;

          if ((index = this.indexOf(original)) > -1) {
            this.set(index, next);
          }

          return next;
        } // @return [Array] all the resources loaded in this collection as an array


        toArray() {
          return this.__collection;
        } // @note Alias for toArray()
        // @return [Array] all the resources loaded in this collection as an array


        all() {
          return this.toArray();
        } // Get the first N resources from this association
        // @param n [Integer] the number of resources to return
        // @return  [Array] array of N resources


        first(n) {
          var output;
          output = _.first(this.__collection, n || 1);

          if (n) {
            return output;
          } else {
            return output[0];
          }
        } // Get the last N resources from this association
        // @param n [Integer] the number of resources to return
        // @return  [Array] array of N resources


        last(n) {
          var output;
          output = _.last(this.__collection, n || 1);

          if (n) {
            return output;
          } else {
            return output[0];
          }
        } // Performs an iteratee function on each item of the collection
        // @param [Function] iteratee the function to call with each item of the collection passed in


        each(iteratee) {
          return _.each(this.__collection, iteratee);
        } // Injects a persisting object as well as each item of the collection into an iteratee, boiling down
        // the collection into a single value that is returned
        // @param memo an initial value to pass into the iteratee
        // @param [Function] iteratee the function to iterate over with the object and items of the collection
        // @return [Collection] the boiled down value as a result of each iteration of the iteratee


        inject(memo, iteratee) {
          return _.reduce(this.__collection, iteratee, memo);
        } // Maps each item of the collection into a new collection using the iteratee
        // @param [Function] iteratee the function to call with each item of the collection passed in
        // @return [ActiveResource::Collection] a collection mapped based on the iteratee


        map(iteratee) {
          return this.constructor.build(_.map(this.__collection, iteratee));
        } // Removes all null values from the array (undefined, null)
        // @return [ActiveResource::Collection] a collection with all null values removed


        compact(iteratee) {
          return this.constructor.build(_.without(this.__collection, null, void 0));
        } // Joins each item of the collection as a string, with a separator
        // @param [String] separator the string to separate each item of the collection with
        // @return [String] the joined collection


        join(separator = ',') {
          return s.join(separator, ..._.map(this.__collection, function (i) {
            return i.toString();
          }));
        } // Flattens a deep nested array into a shallow array
        // @return [Collection] the shallow collection


        flatten() {
          return this.constructor.build(_.flatten(this.__collection));
        } // Push items onto the end of this collection
        // @param [Array] items a list of items to push onto the collection


        push(...items) {
          return this.__collection.push(...items);
        } // Unshifts items onto the beginning of this collection
        // @param [Array] items a list of items to unshift onto the collection


        unshift(...items) {
          return this.__collection.unshift(...items);
        } // Pops items off the end of this collection
        // @return [Item] the last item popped off the collection


        pop() {
          return this.__collection.pop();
        } // Shifts items off the beginning of this collection
        // @return [Item] the first item shifted off the collection


        shift() {
          return this.__collection.shift();
        } // Deletes an item from the collection and returns it
        // @param [Array<Value>] items the items to delete from the collection
        // @return [Array] an array of items deleted from the collection


        delete(...items) {
          var deleted;
          deleted = _.intersection(this.__collection, items);
          this.__collection = _.without(this.__collection, ...items);
          return deleted;
        } // Clear the collection (does not delete on server)


        clear() {
          return this.__collection = [];
        } // Looks through each item in the collection, returning an array of all items that pass the
        // truth test (predicate)
        // @param predicate [Function] the function to evaluate each item in the collection with
        // @return [ActiveResource::Collection] a collection with only item that return true in the predicate


        select(predicate) {
          return this.constructor.build(_.filter(this.__collection, predicate));
        } // Get the first item that returns true from the predicate
        // @param [Function] predicate the function to evaluate each resource in the collection with
        // @return [Value] the first resource that returned true in the predicate


        detect(predicate) {
          return _.detect(this.__collection, predicate);
        } // Duplicates the items of the collection into a new collection
        // @return [Collection] the cloned collection of original items


        clone() {
          return this.constructor.build(_.map(this.__collection, i => {
            return i;
          }));
        }

      }

      
      ActiveResource.include(Collection, ActiveResource.prototype.Typing);
      return Collection;
    }.call(this);
  }).call(undefined);
  (function () {
    // Wraps an ActiveResource::Collection with some useful functions specific to GET responses
    ActiveResource.CollectionResponse = ActiveResource.prototype.CollectionResponse = class CollectionResponse extends ActiveResource.prototype.Collection {
      // Builds a new ActiveResource::CollectionResponse
      // @param [Array,Collection,Object] array the array/object to wrap in a collection
      // @return [CollectionResponse] the built CollectionResponse
      static build(array = []) {
        if (typeof array.isA === "function" ? array.isA(ActiveResource.prototype.Collection) : void 0) {
          return new this(array.toArray());
        } else {
          return super.build(array);
        }
      } // Retrieves and sets the links that were sent at the top level in the response
      // @param [Object] data the link data to set this CollectionResponse's links to
      // @return [Object] the link data for the response


      links(data = {}) {
        if (!_.isEmpty(data) || this.__links == null) {
          this.__links = data;
        }

        return this.__links;
      } // Indicates whether or not a prev link was included in the response
      // @return [Boolean] whether or not the response has a previous page that can be loaded


      hasPrevPage() {
        return this.links()['prev'] != null;
      } // Indicates whether or not a next link was included in the response
      // @return [Boolean] whether or not the response has a next page that can be loaded


      hasNextPage() {
        return this.links()['next'] != null;
      } // Loads data at links()['prev'] if there is a link
      // @return [Promise] a promise to return the previous page of data, or errors


      prevPage() {
        if (this.hasPrevPage()) {
          return this.prevPagePromise || (this.prevPagePromise = this.first().klass().resourceLibrary.interface.get(this.links()['prev']));
        }
      } // Loads data at links()['next'] if there is a link
      // @return [Promise] a promise to return the next page of data, or errors


      nextPage() {
        if (this.hasNextPage()) {
          return this.nextPagePromise || (this.nextPagePromise = this.first().klass().resourceLibrary.interface.get(this.links()['next']));
        }
      } // Converts this a plain ActiveResource::Collection
      // @return [Collection] the converted collection for this CollectionResponse


      toCollection() {
        return ActiveResource.prototype.Collection.build(this.toArray());
      }

    };
  }).call(undefined);
  (function () {
    // A class for managing errors associated with persisting an ActiveResource
    // Also adds instance methods to ActiveResource::Base to manage the class itself
    // @example
    //   product = Product{ title: '' }
    //   product.save ->
    //     unless product.valid?()
    //       product.errors()
    ActiveResource.Errors = ActiveResource.prototype.Errors = class Errors {
      // Caches an instance of this class on ActiveResource::Base#errors in order to manage
      // that resource's errors
      // @return [ActiveResource::Errors] the errors class for the resource
      static errors() {
        return this.__errors || (this.__errors = new ActiveResource.prototype.Errors(this));
      } // Indicates whether or not the resource is valid?
      // @note A resource is valid if it does not have any errors
      // @return [Boolean] whether or not the resource is valid


      static valid() {
        return this.errors().empty();
      } // Instantiates with a @base resource and @__errors storage object
      // @param [ActiveResource::Base] the resource that these errors apply to


      constructor(base) {
        this.base = base;
        this.reset();
      }

      reset() {
        return this.__errors = {};
      }

      clear() {
        return this.reset();
      } // Adds an error with code and message to the error object for an field
      // @param [String] field the field the error applies to
      //   Or 'base' if it applies to the base object
      // @param [String] code the code for the error
      // @param [String] detail the message for the error
      // @return [Object] the error object created and added to storage


      add(field, code, detail = '') {
        return this.__add(field, code, detail);
      } // Adds an array of errors
      // @see #add for individual error params
      // @param [Array<Array>] errors error objects to add


      addAll(...errors) {
        return _.map(errors, error => {
          return this.__add(...error);
        });
      } // Propagates errors with nested fields down through relationships to their appropriate resources
      // TODO: Propagate errors to appropriate collection item instead of just first
      // @param [ActiveResource.Collection<Object>] errors the errors to propagate down the resource


      propagate(errors) {
        return errors.each(error => {
          var association, field, nestedError, nestedErrors, nestedField, ref, ref1;
          nestedField = error.field.split('.');
          field = nestedField.shift();
          this.push(error);

          try {
            association = this.base.association(field);
            nestedError = _.clone(error);
            nestedError.field = nestedField.length === 0 && 'base' || nestedField.join('.');
            nestedErrors = ActiveResource.Collection.build([nestedError]);

            if (association.reflection.collection()) {
              return (ref = association.target.first()) != null ? ref.errors().propagate(nestedErrors) : void 0;
            } else {
              return (ref1 = association.target) != null ? ref1.errors().propagate(nestedErrors) : void 0;
            }
          } catch (error1) {}
        });
      } // Adds an existing error with field to this errors object
      // @param [Object] error the error to push onto this errors object
      // @return [Object] the error object


      push(error) {
        var base, name;
        (base = this.__errors)[name = error.field] || (base[name] = []);

        this.__errors[error.field].push(error);

        return error;
      } // Indicates whether or not the error with code `code` is on the `field`
      // @param [String] field the field to check if the error exists on
      // @param [String] code the code to check for on the field
      // @return [Boolean] whether or not the error with code is on the field


      added(field, code) {
        return ActiveResource.prototype.Collection.build(this.__errors[field]).detect(function (e) {
          return e.code === code;
        }) != null;
      } // Indicates whether or not there are errors for a specific field
      // @param [String] field the field to see if there are errors for
      // @return [Boolean] whether or not the field has errors


      include(field) {
        return this.__errors[field] != null && _.size(this.__errors[field]) > 0;
      } // Indicates whether or not the errors object is empty
      // @return [Boolean] whether or not the errors object is empty


      empty() {
        return this.size() === 0;
      } // Indicates the size of the errors array
      // @return [Integer] the number of errors


      size() {
        return _.size(this.toArray());
      } // Delete the errors for a specific field
      // @param [String] field the field to delete errors for


      delete(field) {
        return this.__errors[field] = [];
      } // Iterates over each error key, value pair in the errors object
      // using a provided iterator that takes in two arguments (field, error)
      // @example
      //   resource.errors().each (field, error) ->
      //     # Will yield 'name' and { code: '...', message: '...' }
      //     # Then, will yield 'name' and { code: '...', message: '...' }
      // @param [Function] iterator the function to use to iterate over errors


      each(iterator) {
        return _.each(this.__errors, function (errors, field) {
          var error, i, len, results;
          results = [];

          for (i = 0, len = errors.length; i < len; i++) {
            error = errors[i];
            results.push(iterator(field, error));
          }

          return results;
        });
      } // Returns the error object for an field
      // @param [String] field the name of field to get errors for
      // @return [Object] the error object for the field


      forField(field) {
        return ActiveResource.prototype.Collection.build(_.keys(this.__errors)).select(k => {
          return s.startsWith(k, field);
        }).map(k => {
          return this.__errors[k];
        }).flatten();
      } // Returns the error object for an field
      // @param [String] field the field to get errors for
      // @return [Object] the error object for the field


      detailsForField(field) {
        return this.forField(field).inject({}, function (out, error) {
          out[error.code] = error.detail;
          return out;
        });
      } // Returns the error object for base
      // @return [Object] the error object for base


      forBase() {
        return this.forField('base');
      } // Converts the errors object to an array of errors
      // @return [Array] the errors object converted to an array of errors


      toArray() {
        var errors, field, output, ref;
        output = [];
        ref = this.__errors;

        for (field in ref) {
          errors = ref[field];
          output.push(...errors);
        }

        return output;
      } // Convert the errors object to a collection of errors
      // @return [Collection] the errors object converted to a collection of errors


      toCollection() {
        return ActiveResource.prototype.Collection.build(this.toArray());
      } // private
      // Adds an error with code and message to the error object for an field
      // @param [String] field the field the error applies to
      //   Or 'base' if it applies to the base object
      // @param [String] code the code for the error
      // @param [String] detail the message for the error
      // @return [Object] the error object created and added to storage


      __add(field, code, detail = '') {
        var base, error;
        (base = this.__errors)[field] || (base[field] = []);

        this.__errors[field].push(error = this.__buildError(field, code, detail));

        return error;
      } // @param [String] field the field the error applies to
      //   Or 'base' if it applies to the base object
      // @param [String] code the code for the error
      // @param [String] detail the message for the error
      // @return [Object] a mapped object that represents an error


      __buildError(field, code, detail) {
        return {
          field: field,
          code: code,
          detail: detail,
          message: detail
        };
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource methods for managing changes in tracked fields
    ActiveResource.prototype.Fields = class Fields {
      // Returns all of the fields of the klass (attributes + relationships)
      // @return [Collection<String>] the names of all the fields of the klass
      fields() {
        var attributes, output;
        attributes = this.attributes();
        output = ActiveResource.prototype.Collection.build(attributes.all);
        output.push(...attributes.read.toArray());
        output.push(..._.keys(this.reflections()));
        return output;
      } // Called in Base constructor to initialize tracking for each field by creating the `__field` object and storing
      //   either blank Collection or null for each field


      static __initializeFields() {
        this.__fields = {};
        return this.klass().fields().each(field => {
          var ref;

          if ((ref = this.klass().reflectOnAssociation(field)) != null ? ref.collection() : void 0) {
            return this.__fields[field] = ActiveResource.prototype.Collection.build();
          } else {
            return this.__fields[field] = null;
          }
        });
      } // Called after requests, used to assign the values for fields according to the server's response and
      //   update the control for field tracking
      // @note Each time `changedFields()` is run, the current value of each field is compared against the fields last assigned
      //   using this method.
      // @param [Object] fields the fields to assign and use as the control for field change tracking


      static __assignFields(fields) {
        _.each(fields, (v, k) => {
          if (!_.has(this.__fields, k)) {
            return;
          }

          try {
            if (this.association(k).reflection.collection()) {
              return this.__fields[k] = ActiveResource.prototype.Collection.build(v);
            } else {
              return this.__fields[k] = v;
            }
          } catch (error) {
            return this.__fields[k] = v;
          }
        });

        return this.__assignAttributes(fields);
      } // If true, at least one field on the resource has changed
      // @return [Boolean] whether or not the resource has changed


      static changed() {
        return !this.changedFields().empty();
      } // Returns all of the fields that have been changed since the last server response
      // @return [Collection<String>] the changed fields for the resource


      static changedFields() {
        return this.klass().fields().select(field => {
          var association, newField, newTargets, oldField;
          oldField = this.__fields[field];
          newField = this[field];

          try {
            // Relationship field if association found
            association = this.association(field);
            newField = this[field]();

            if (association.reflection.collection()) {
              if (oldField.size() !== newField.size()) {
                return true;
              }

              newTargets = newField.target().select(t => {
                return !oldField.include(t) || association.reflection.autosave() && t.changed();
              });
              return !newTargets.empty();
            } else {
              return oldField != newField || association.reflection.autosave() && newField.changed();
            }
          } catch (error) {
            // Attribute field if association not found
            // Check that they are not equal, and that its not a case of undefined !== null
            return oldField != newField && !_.isUndefined(newField);
          }
        });
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource methods for managing links of resources to their servers
    ActiveResource.Links = ActiveResource.prototype.Links = class Links {
      // Links to query the server for this persisted resource with
      links() {
        return this.__links || (this.__links = _.clone(this.klass().links()));
      } // @note Static method
      // Links to query the server for this model with
      // @return [Object] the URL links used to query this resource type


      static links() {
        if (this.resourceLibrary.baseUrl == null) {
          throw 'baseUrl is not set';
        }

        if (this.queryName == null) {
          throw 'queryName is not set';
        }

        return this.__links || (this.__links = {
          related: this.resourceLibrary.baseUrl + this.queryName + '/'
        });
      } // @note Static method
      // Constructs formatted links
      // @param [Array<String>] args the segments of a URL to join
      // @return [String] joined segments of URL together with /


      static __constructLink(...args) {
        return _.map(args, function (str) {
          if (s.endsWith(str, '/')) {
            return str;
          } else {
            return str + '/';
          }
        }).join('');
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource methods for persisting local resources with the server
    ActiveResource.prototype.Persistence = class Persistence {
      // Whether or not this resource is persisted on the server
      // @note If the resource has a `self` link, that means it has a link to itself on the server,
      //   thus, it is persisted. Before a resource has a `self` link, it will have a `related` link
      //   that belongs to its @klass()
      // @example
      //   @klass().links() == { related: '/api/v1/orders' }
      //   @links() == { self: '/api/v1/orders/1' }
      //   return true
      // @example
      //   @klass().links() == { related: '/api/v1/orders' }
      //   @links() == { related: '/api/v1/orders' }
      //   return false
      // @return [Boolean] whether or not the resource is persisted on the server
      static persisted() {
        return this.links()['self'] != null;
      } // Whether or not this resource is a new resource
      // @note Is the opposite of persisted()
      // @return [Boolean] whether or not the resource is a new resource


      static newResource() {
        return !this.persisted();
      } // Save any changes to the resource, and inserts the resource into callback after
      // @note
      //   If !resource.persisted(), then create it
      //   If resource.persisted(), then update it
      // @note
      //   Callback will be called regardless if the resource is successfully saved
      //   This is useful because ActiveResource builds regardless if it is valid or not,
      //   and one can read the errors on a resource in the same function as success
      // @example
      //   Order.build(...).save (savedresource) ->
      //     if savedresource.valid()
      //       ...
      //     else
      //       savedresource.errors.each (e) ->
      //         ...
      // @example
      //   resource.save ->
      //     if resource.valid()
      //       ...
      //     else
      //       resource.errors()
      // @param [Function] callback the callback to pass the ActiveResource into
      // @return [Promise] a promise to return the ActiveResource, valid or invalid


      static save(callback) {
        return this.__createOrUpdate().then(callback, callback);
      } // Update specific attributes of the resource, save it, and insert resource into callback after
      // @note
      //   If !resource.persisted(), then create it
      //   If resource.persisted(), then update it
      // @note
      //   Callback will be called regardless if the resource is successfully saved
      //   This is useful because ActiveResource builds regardless if it is valid or not,
      //   and one can read the errors on a resource in the same function as success
      // @example
      //   resource.update { title: '...', price: '...' }, ->
      //     if resource.valid()
      //       ...
      //     else
      //       resource.errors()
      // @param [Object] attributes the attributes to update in the resource
      // @param [Function] callback the callback to pass the ActiveResource into
      // @return [Promise] a promise to return the ActiveResource, valid or invalid


      static update(attributes, callback) {
        var attributesKeys, oldAttributes;
        attributesKeys = ActiveResource.prototype.Collection.build(_.keys(attributes));
        oldAttributes = _.pick(this.attributes(), attributesKeys.toArray());
        oldAttributes = _.defaults(oldAttributes, attributesKeys.inject({}, (obj, k) => {
          obj[k] = null;
          return obj;
        }));

        this.__assignAttributes(attributes);

        return this.__createOrUpdate().then(null, function (resource) {
          resource.__assignAttributes(oldAttributes);

          return resource;
        }).then(callback, callback);
      } // Deletes the resource from the server, assuming callbacks pass
      // TODO: Remove the resource from all associations as well
      // @example
      // Order.last().then (order) ->
      //   order.destroy()
      //   .then (destroyedresource) ->
      //     ...
      //   .catch ->
      //     ...


      static destroy() {
        var resource;
        return this.klass().resourceLibrary.interface.delete(this.links()['self'], resource = this).then(function () {
          resource.__links = {};
          return resource;
        });
      } // private
      // Called by `save` and `update` to determine if we should create a new resource with attributes
      // on the server, or simply update a persisted resource with the attributes
      // @note This uses the `related` link of the resource (example: `/api/v1/orders`) if it is not persisted,
      //   since that is the create endpoint. If the resource is persisted, it uses the `self` link of the resource,
      //   which would be `/api/v1/orders/:id`, so we can make changes to the persisted resource
      // @note This uses `PUT` for update instead of `PATCH` because until we implement dirty attributes
      //   we have to send the entire resource to the server, warranting use of the `PUT` verb
      // @return [Promise] a promise to return the persisted ActiveResource **or** ActiveResource with errors


      static __createOrUpdate() {
        this.errors().reset();

        if (this.persisted()) {
          return this.klass().resourceLibrary.interface.patch(this.links()['self'], this);
        } else {
          return this.klass().resourceLibrary.interface.post(this.links()['related'], this);
        }
      }

    };
  }).call(undefined);
  (function () {
    ActiveResource.prototype.QueryParams = function () {
      var COLLECTION_RELATED, RESOURCE_RELATED;

      class QueryParams {
        // Gets a queryParams object for `this`
        // If `this` is an instance of a class, instantiate its queryParams with that of its classes,
        // which will have built-in queryParams from autosave associations and `fields` declarations
        // TODO: Add autosave associations to default klass().queryParams (returns {} right now)
        // @return [Object] the queryParams for `this`
        static queryParams() {
          return this.__queryParams || (this.__queryParams = (typeof this.isA === "function" ? this.isA(ActiveResource.prototype.Base) : void 0) ? _.clone(this.klass().queryParams()) : {});
        } // Gets the queryParams for a given reflection of a resource's class
        // @note This is used by associations when doing any queries (reload, etc) to get the
        //   includes/fields that the association was initially created with in their owner's call,
        //   thus maintaining their fields/includes instead of getting all fields & no includes:
        // @example
        //   Product.includes(orders: 'customer').select('title', orders: ['price']).first()
        //   .then (resource) ->
        //     resource.queryParamsForReflection(resource.klass().reflectOnAssociation('orders'))
        //     => { includes: ['customer'], fields: { orders: ['price'] } }
        // @param [Reflection] reflection the reflection to get queryParams for
        // @return [Object] the queryParams for the reflections


        static queryParamsForReflection(reflection) {
          var includes, queryParams, ref;
          queryParams = {};

          if (this.queryParams()['include'] != null) {
            includes = ActiveResource.prototype.Collection.build(this.queryParams()['include']).inject([], function (out, i) {
              if (_.isObject(i)) {
                _.each(_.keys(i), function (i2) {
                  if (i2 === reflection.name) {
                    return out.push(..._.flatten([i[i2]]));
                  }
                });
              }

              return out;
            });

            if (includes.length !== 0) {
              queryParams['include'] = includes;
            }
          }

          if (!(typeof reflection.polymorphic === "function" ? reflection.polymorphic() : void 0) && ((ref = this.queryParams()['fields']) != null ? ref[reflection.klass().queryName] : void 0) != null) {
            queryParams['fields'] = _.pick(this.queryParams()['fields'], reflection.klass().queryName);
          }

          return queryParams;
        }

        static assignQueryParams(queryParams) {
          return this.__queryParams = queryParams;
        } // Used to assign only resource related queryParams like `fields` and `include` to an object
        // @param [Object] queryParams the queryParams to pick resource related params out of and assign
        //   to `this`


        static assignResourceRelatedQueryParams(queryParams) {
          return this.assignQueryParams(_.pick(queryParams, ...RESOURCE_RELATED));
        }

        static resetQueryParams() {
          return this.__queryParams = {};
        }

        static __resourceRelatedParams() {
          return _.pick(this.queryParams(), ...RESOURCE_RELATED);
        }

        static __collectionRelatedParams() {
          return _.pick(this.queryParams(), ...COLLECTION_RELATED);
        } // Extends a value param of queryParams with the new value passed in
        // @example
        //   @__queryParams = { limit: 2 }
        //   param = 'limit'
        //   value = 5
        //   return { limit: 5 }
        // @note queryParams defaults to @__queryParams, but this function can be used
        //   to modify any object
        // @param [String] param the name of the param to extend
        // @param [Object] value the value to replace on the param
        // @param [Object] queryParams the object to modify instead of @__queryParams
        // @return [Object] the extended queryParams


        static __extendValueParam(param, value, queryParams) {
          queryParams || (queryParams = _.clone(this.queryParams()));
          queryParams[param] = value;
          return queryParams;
        } // Extends an object param of queryParams with the options passed in
        // @example
        //   @__queryParams = { fields: { order: '...' } }
        //   param = 'fields'
        //   options = { transactions: 'id,amount' }
        //   return { fields: { order: '...', transactions: 'id,amount' } }
        // @note queryParams defaults to @__queryParams, but this function can be used
        //   to modify any object
        // @param [String] param the name of the param to extend
        // @param [Object] options the options to add to the param
        // @param [Object] queryParams the object to modify instead of @__queryParams
        // @return [Object] the extended queryParams


        static __extendObjectParam(param, options, queryParams) {
          queryParams || (queryParams = _.clone(this.queryParams()));
          queryParams[param] = _.extend(queryParams[param] || {}, options);
          return queryParams;
        } // Push items onto an array param of queryParams
        // @example
        //   @__queryParams = { sort: ['id'] }
        //   param = 'sort'
        //   value = 'updatedAt'
        //   return { sort: ['id', 'updatedAt'] }
        // @note queryParams defaults to @__queryParams, but this function can be used
        //   to modify any object
        // @param [String] param the name of the param to extend
        // @param [Array<String,Object>] items items to push onto the collection param
        // @param [Object] queryParams the object to modify instead of @__queryParams
        // @return [Object] the extended queryParams


        static __extendArrayParam(param, items, queryParams) {
          queryParams || (queryParams = _.clone(this.queryParams())); // shallow clone

          queryParams[param] = queryParams[param] ? queryParams[param].slice(0) : []; // clone array

          if (items != null) {
            queryParams[param].push(...items);
          }

          return queryParams;
        }

      }

       // private

      RESOURCE_RELATED = ['fields', 'include'];
      COLLECTION_RELATED = ['filter', 'sort', 'page'];
      return QueryParams;
    }.call(this);
  }).call(undefined);
  (function () {
    // Adds methods for managing reflections, which reflect on associations of ActiveResources
    ActiveResource.Reflection = ActiveResource.prototype.Reflection = function () {
      class Reflection {
        // Returns an object with the name of the reflection as the key and a Reflection as the value
        // @example
        //   Order.reflections() == { transactions: HasManyReflection }
        // @return [Object] the name/reflection pair object for all reflections of the ActiveResource
        reflections() {
          return this.__reflections || (this.__reflections = {});
        } // Returns all reflections of associations of the ActiveResource class
        // @param [String] macro filters reflections by their macro
        // @return [Collection] a collection of reflections of all associations


        reflectOnAllAssociations(macro = null) {
          var reflections;
          reflections = ActiveResource.prototype.Collection.build(_.values(this.__reflections));

          if (macro) {
            reflections = reflections.select(function (r) {
              return r.macro === macro;
            });
          }

          return reflections;
        } // @return [Reflection] the reflection of a specific association


        reflectOnAssociation(association) {
          return this.reflections()[association];
        } // Returns all reflections of autosaving associations of the ActiveResource class
        // @return [Collection] a collection of reflections of all autosaving associations


        reflectOnAllAutosaveAssociations() {
          var reflections;
          reflections = ActiveResource.prototype.Collection.build(_.values(this.__reflections));
          return reflections.select(function (r) {
            return typeof r.autosave === "function" ? r.autosave() : void 0;
          });
        } // Creates a reflection of an association
        // @param [String] macro the macro type for the reflection (hasMany, hasOne, belongsTo)
        // @param [String] name the name of the association to reflect on
        // @param [Object] options the options to build into the reflection
        // @param [Class] activeResource the ActiveResource class that owns this reflection
        // @return [Reflection] the built reflection of an association


        static create(macro, name, options, activeResource) {
          var klass;

          klass = function () {
            switch (macro) {
              case 'hasMany':
                return Reflection.prototype.HasManyReflection;

              case 'hasOne':
                return Reflection.prototype.HasOneReflection;

              case 'belongsTo':
                return Reflection.prototype.BelongsToReflection;
            }
          }();

          return new klass(name, options, activeResource);
        } // Adds a reflection to the ActiveResource's class
        // @param [Class] ar the ActiveResource class to add the reflection to
        // @param [String] name the name of the reflection
        // @param [Reflection] reflection the reflection to add to the class


        static addReflection(ar, name, reflection) {
          var r;
          r = {};
          r[name] = reflection;
          return ar.__reflections = _.extend(ar.__reflections || {}, r);
        }

      }

      

      Reflection.prototype.AbstractReflection = function () {
        var INVALID_AUTOMATIC_INVERSE_OPTIONS, VALID_AUTOMATIC_INVERSE_MACROS, automaticInverseOf, canFindInverseOfAutomatically, validInverseReflection; // Reflects on associations between ActiveResources. This is stored at the class level,
        // and when an ActiveResource is instantiated the reflection is built into an appropriate
        // Association

        class AbstractReflection {
          // @param [String] name the name of the association to reflect on
          // @param [Object] options the options to build into the reflection
          // @param [Class] activeResource the ActiveResource class that owns this reflection
          constructor(name1, options1, activeResource1) {
            this.name = name1;
            this.options = options1;
            this.activeResource = activeResource1;

            if (this.autosave()) {
              this.activeResource.assignQueryParams(this.activeResource.__extendArrayParam('include', [this.name]));
            }
          } // Returns the target klass that this reflection reflects on
          // @note Will throw error if called on polymorphic reflection
          // @return [Class] The klass that this reflection reflects on


          klass() {
            return this.activeResource.resourceLibrary.constantize(this.className());
          }

          type() {
            return this.__type || (this.__type = this.options['as'] && (this.options['foreignType'] || `${this.options['as']}Type`));
          } // @return [String] the className of the klass this reflection reflects on


          className() {
            return this.__className || (this.__className = this.options['className'] || this.__deriveClassName());
          } // @return [String] the foreignKey of the reflection


          foreignKey() {
            return this.__foreignKey || (this.__foreignKey = this.options['foreignKey'] || this.__deriveForeignKey());
          } // @return [String] the foreignType of the reflection


          foreignType() {
            return this.__foreignType || (this.__foreignType = this.options['foreignType'] || `${this.name}Type`);
          } // @param [Class] the class to get the primary key of
          // @return [String] the primary key for the associated klass this reflects on


          associationPrimaryKey(klass) {
            return this.options['primaryKey'] || this.__primaryKey(klass || this.klass());
          } // @return [String] the primaryKey for the owner ActiveResource of the reflection


          activeResourcePrimaryKey() {
            return this.__activeResourcePrimaryKey || (this.__activeResourcePrimaryKey = this.options['primaryKey'] || this.__primaryKey(this.activeResource));
          } // @return [Boolean] whether or not this reflection is for a collection of resources


          collection() {
            return false;
          } // @return [Boolean] whether or not this reflection is the hasOne side of a singular reflection


          hasOne() {
            return false;
          } // @return [Boolean] whether or not this reflection is the belongsTo side of a singular reflection


          belongsTo() {
            return false;
          } // @return [Boolean] whether or not the association can be constructed via a build/create method


          constructable() {
            return true;
          } // @return [Boolean] whether or not the association is polymorphic


          polymorphic() {
            return this.options['polymorphic'] || false;
          } // @return [Boolean] whether or not this is an autosave association


          autosave() {
            return this.options['autosave'] || false;
          }

          buildAssociation() {
            return this.klass().build();
          } // Whether or not the reflection has an inverse


          hasInverse() {
            return this.__inverseName() != null;
          } // The inverseOf this reflection on the target klass
          // @example
          //   Product.hasMany('orders')
          //   Order.belongsTo('product')
          //   Product.reflectOnAssociation('orders').inverseOf()
          //     # => Order.reflectOnAssociation('product')
          // @return [Reflection] the inverseOf this reflection


          inverseOf() {
            if (!this.hasInverse()) {
              return;
            }

            return this.__inverseOf || (this.__inverseOf = this.klass().reflectOnAssociation(this.__inverseName()));
          } // Finds the inverseOf a polymorphic reflection, given a class to search the reflections of
          // @note The child side of the relationship must define @options['inverseOf'] in order for
          //   this to work
          // @example
          //   Order.hasMany('comments', as: 'resource')
          //   Comment.belongsTo('resource', polymorphic: true, inverseOf: 'comments')
          //   Comment.reflectOnAssociation('resource').polymorphicInverseOf(Order)
          //   # => Order.reflectOnAssociation('comments')
          // @param [Class] associatedClass the class to check for the inverseOf reflection on
          // @return [Reflection] the inverseOf this polymorphic reflection


          polymorphicInverseOf(associatedClass) {
            var inverseRelationship;

            if (this.hasInverse()) {
              if (inverseRelationship = associatedClass.reflectOnAssociation(this.options['inverseOf'])) {
                return inverseRelationship;
              }
            }
          } // private
          // Derives the class name of the reflection from its name
          // @return [String] the class name of the reflection


          __deriveClassName() {
            return s.classify(_.singularize(this.name));
          } // Derives the foreign key of the reflection based on its type
          // @return [String] the foreign key of the reflection


          __deriveForeignKey() {
            if (this.belongsTo()) {
              return `${this.name}Id`;
            } else if (this.options['as']) {
              return `${this.options['as']}Id`;
            } else {
              return `${s.camelize(this.activeResource.className, true)}Id`;
            }
          } // Determines the primaryKey of a given class
          // @note Throws an error if the primaryKey could not be determined
          // @param [Class] klass the klass to determine the primaryKey of
          // @return [String] the primaryKey of the class


          __primaryKey(klass) {
            return klass.primaryKey || function () {
              throw `Unknown primary key for ${klass.className}`;
            }();
          } // The name of the inverseOf this reflection
          // @example
          //   Product.has_many('orders')
          //   Product.reflectOnAssociation('orders').inverseName() # => 'product'
          // @return [String] the name of the inverseOf this reflection


          __inverseName() {
            return this.options['inverseOf'] || (this.__automaticInverseOf === false ? null : this.__automaticInverseOf || (this.__automaticInverseOf = automaticInverseOf(this)));
          }

        }

        
        ActiveResource.include(AbstractReflection, ActiveResource.prototype.Typing);
        AbstractReflection.__excludeFromExtend = true; // Finds the inverseOf the reflection automatically, either because an inverseOf option
        // was specified or through using the name of the ActiveResource to find this reflection
        // on the target klass
        // @note A belongsTo reflection will not have an automaticInverseOf if it belongsTo a
        //   one-to-many reflection
        // @param [Reflection] the reflection to find the automaticInverseOf
        // @return [Reflection,Boolean] the automaticInverseOf reflection for this reflection

        automaticInverseOf = function (reflection) {
          var e, inverseName, inverseReflection;

          if (canFindInverseOfAutomatically(reflection)) {
            inverseName = s.camelize(reflection.options['as'] || reflection.activeResource.className, true);

            try {
              inverseReflection = reflection.klass().reflectOnAssociation(inverseName);
            } catch (error) {
              inverseReflection = false;
            }

            if (validInverseReflection(reflection, inverseReflection)) {
              return inverseName;
            }
          }

          return false;
        };

        VALID_AUTOMATIC_INVERSE_MACROS = ['hasMany', 'hasOne', 'belongsTo'];
        INVALID_AUTOMATIC_INVERSE_OPTIONS = ['polymorphic']; // Check that reflection does not have any options that prevent us from being
        // able to guess its inverse automatically.
        // @note
        //   1. The 'inverseOf' option cannot be false
        //   2. The reflection macro must be in the list of valid automatic inverse macros
        //   3. The reflection must not have any options like 'polymorphic' that prevent us
        //      from correctly guessing the inverse
        // @param [Reflection] reflection the reflection to check if we can find the inverseOf automatically
        // @return [Boolean] whether or not we can find the inverseOf automatically

        canFindInverseOfAutomatically = function (reflection) {
          return reflection.options['inverseOf'] !== false && _.include(VALID_AUTOMATIC_INVERSE_MACROS, reflection.macro) && _.isEmpty(_.pick(reflection.options, ...INVALID_AUTOMATIC_INVERSE_OPTIONS));
        }; // Checks if inverse reflection that is returned from `automaticInverseOf` method is a
        // valid reflection. We must make sure that the reflections ActiveResource className matches
        // up with the current reflections klass className
        // @note klass() will always be valid because when theres an error from calling `klass()`,
        //   `reflection` will already be set to false
        // @param [Reflection] reflection the reflection this inverseReflection will be for
        // @param [Reflection,Boolean] inverseReflection the inverse reflection to check the validity of
        // @return [Boolean] whether or not the inverse reflection is valid


        validInverseReflection = function (reflection, inverseReflection) {
          return inverseReflection && reflection.klass().className === inverseReflection.activeResource.className && canFindInverseOfAutomatically(inverseReflection);
        };

        return AbstractReflection;
      }.call(this);

      Reflection.prototype.HasManyReflection = function () {
        class HasManyReflection extends Reflection.prototype.AbstractReflection {
          collection() {
            return true;
          }

          associationClass() {
            return ActiveResource.prototype.Associations.prototype.HasManyAssociation;
          }

        }

        
        HasManyReflection.__excludeFromExtend = true;
        HasManyReflection.prototype.macro = 'hasMany';
        return HasManyReflection;
      }.call(this);

      Reflection.prototype.HasOneReflection = function () {
        class HasOneReflection extends Reflection.prototype.AbstractReflection {
          hasOne() {
            return true;
          }

          associationClass() {
            return ActiveResource.prototype.Associations.prototype.HasOneAssociation;
          }

        }

        
        HasOneReflection.__excludeFromExtend = true;
        HasOneReflection.prototype.macro = 'hasOne';
        return HasOneReflection;
      }.call(this);

      Reflection.prototype.BelongsToReflection = function () {
        class BelongsToReflection extends Reflection.prototype.AbstractReflection {
          belongsTo() {
            return true;
          }

          constructable() {
            return !this.polymorphic();
          }

          associationClass() {
            if (this.polymorphic()) {
              return ActiveResource.prototype.Associations.prototype.BelongsToPolymorphicAssociation;
            } else {
              return ActiveResource.prototype.Associations.prototype.BelongsToAssociation;
            }
          }

        }

        
        BelongsToReflection.__excludeFromExtend = true;
        BelongsToReflection.prototype.macro = 'belongsTo';
        return BelongsToReflection;
      }.call(this);

      return Reflection;
    }.call(this);
  }).call(undefined);
  (function () {
    // Relation constructs queries based on a chained series of functions that extend the chain
    // or execute the built query, then building the result and returning it as either an
    // ActiveResource::Base or Collection of ActiveResource::Base
    // ActiveResource::Base extends Relation and Relation.prototype in order to add class level and instance level
    // Relation functions to its class level. Relation instances build extended Relation instances, but
    // ActiveResource::Base subclasses can build extended Relation instances much like Rails
    // @example
    //   Order.where(price: 5.0).all()
    // @example
    //   Order.where(price: 5.0).order('updatedAt').page(2).perPage(5).all()
    // @example
    //   Order.includes('transactions').select('id','price',transactions: ['id','amount']).first(5)
    // @example
    //   Order.find(token: 'as8h2nW')
    // @example
    //   Order.includes('transactions').findBy(token: 'as8h2nW')
    ActiveResource.Relation = ActiveResource.prototype.Relation = function () {
      class Relation {
        // @param [ActiveResource::Base] base the resource class this relation is for
        // @param [Object] __queryParams the __queryParams already built by previous links in
        //   the Relation chain
        constructor(base, __queryParams) {
          var INTERNAL_METHODS, classMethods, customClassMethods, mixin;
          this.base = base;
          this.__queryParams = __queryParams;
          this.queryName = this.base.queryName;

          if (this.base.isA(Function)) {
            INTERNAL_METHODS = ['arguments', 'caller', 'length', 'name', 'prototype', '__super__', 'className', 'queryName', 'resourceLibrary', '__attributes', '__callbacks', '__links', '__reflections', '__queryParams'];
            classMethods = _.difference(Object.getOwnPropertyNames(this.base), _.keys(ActiveResource.prototype.Base));
            customClassMethods = _.difference(classMethods, INTERNAL_METHODS);
            mixin = ActiveResource.Collection.build(customClassMethods).inject({}, (obj, method) => {
              obj[method] = this.base[method];
              return obj;
            });
            ActiveResource.extend(this, mixin);
          }
        } // Returns links to the server for the resource that this relation is for
        // This will always be { related: baseUrl + '/[@base.queryName]' }
        // @return [Object] string URLs for the resource


        links() {
          return this.base.links();
        } // Returns the interface for the resource, taken from its klass's resourceLibrary
        // @return [Interface] the interface to use for this resource


        interface() {
          return this.base.interface();
        } // Adds filters to the query
        // @example
        //  .where(price: 5.0) = { filter: { price: 5.0 } }
        // @param [Object] options the hash of filters to add the query
        // @return [ActiveResource::Relation] the extended relation with added `filter` params
        // 1. Extend __queryParams['filter'] with the additional options
        // 2. Create new relation with the extended __queryParams


        where(options) {
          return this.__newRelation(this.__extendObjectParam('filter', options));
        } // Sorts the query based on columns
        // @example
        //  .order(updatedAt: 'asc') = { sort: 'updatedAt' }
        // @example
        //  .order(price: 'desc') = { sort: '-price' }
        // @example
        //  .order(price: 'desc', updatedAt: 'asc') = { sort: '-price,updatedAt' }
        // @param [Array<String>] args a list of columns to order the query by
        // @return [ActiveResource::Relation] the extended relation with added `sort` params
        // 1. Add sorting key/value pairs to __queryParams['sort'] object
        // 2. Create new relation with the extended __queryParams


        order(args) {
          return this.__newRelation(this.__extendObjectParam('sort', args));
        } // Selects the fields to return from the query
        // @example
        //  Order.select('id', 'updatedAt') = { fields: { orders: 'id,updatedAt' } }
        // @example
        //  Order.includes('transactions').select('id', 'updatedAt', transactions: 'amount') =
        //    { fields: { orders: 'id,updatedAt', transactions: 'amount' } }
        // @example
        //  Order.includes(transactions: 'merchant')
        //  .select('id', 'updatedAt', transactions: 'amount', merchant: ['id', 'name']) =
        //    { fields: { orders: 'id,updatedAt', transactions: 'amount', merchant: 'id,name' } }
        // @note Just because the merchant include is nested, does not mean we nest the merchant fields definition
        // @param [Array<String,Object>] args an array of field representations to cull the query by
        // @return [ActiveResource::Relation] the extended relation with added `sort` params
        // 1. Build new queryParams so we don't persist across relation constructions
        // 2. Set queryParams.__root to @queryName so we can use it for future merging of fields/includes in interfaces
        // 3. Flatten the field arguments into an array of strings/objects and iterate over it
        // 4. Determine the model name for each field
        //   * If object: model name is the key (Order.select({ transactions: [...] }) # => transactions)
        //   * If string: model name is @base.queryName (Order.select('id') # => orders)
        // 5. Append the list of fields to the array of fields for that model
        //   * If object: first value of arg is array to append (Order.select({ transactions: ['id'] }) => ['id'])
        //   * If string: arg itself is item to append to array (Order.select('id') => ['id'])
        // 6. Create new relation with the extended queryParams


        select(...args) {
          var queryParams;
          queryParams = _.clone(this.queryParams());
          queryParams['fields'] || (queryParams['fields'] = {});
          queryParams['__root'] || (queryParams['__root'] = this.queryName);
          ActiveResource.prototype.Collection.build(args).map(function (a) {
            var i, key, len, ref, results;

            if (_.isObject(a)) {
              ref = _.keys(a);
              results = [];

              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                results.push(_.pick(a, key));
              }

              return results;
            } else {
              return a;
            }
          }).flatten().each(arg => {
            var modelName;
            modelName = _.isObject(arg) ? _.keys(arg)[0] : queryParams.__root;
            return queryParams['fields'] = this.__extendArrayParam(modelName, _.isObject(arg) ? [_.values(arg)[0]] : [arg], queryParams['fields']);
          });
          return this.__newRelation(queryParams);
        } // Defines the page number of the query
        // @example
        //  .page(2) = { page: { number: 2 } }
        // @param [Integer] value the page number to define for the query
        // @return [ActiveResource::Relation] the extended relation with added `page.number` param


        page(value) {
          return this.__newRelation(this.__extendObjectParam('page', {
            number: value
          }));
        } // Defines the page size of the query
        // @example
        //  .perPage(5) = { page: { size: 5 } }
        // @param [Integer] value the page size to define for the query
        // @return [ActiveResource::Relation] the extended relation with added `page.size` param


        perPage(value) {
          return this.__newRelation(this.__extendObjectParam('page', {
            size: value
          }));
        } // Defines the limit on the number of resources to query
        // @example
        //  .limit(2) = { limit: 2 }
        // @param [Integer] value the limit on the number of resources to query
        // @return [ActiveResource::Relation] the extended relation with added `limit` param


        limit(value) {
          return this.__newRelation(this.__extendValueParam('limit', value));
        } // Defines the offset to start querying resources at
        // @example
        //  .offset(2) = { offset: 2 }
        // @param [Integer] value the offset to start querying resources at
        // @return [ActiveResource::Relation] the extended relation with added `offset` param


        offset(value) {
          return this.__newRelation(this.__extendValueParam('offset', value));
        } // Adds association includes to the query
        // @example
        //   .includes('merchant','product') = { include: ['merchant','product'] }
        // @example
        //   .includes('merchant','product',transactions: ['paymentMethod','paymentGateway']) =
        //     { ['merchant','product',{ transactions: ['paymentMethod','paymentGateway'] }] }
        // @example
        //   .includes('merchant','product',transactions: { paymentMethod: 'customer' }]) =
        //     { ['merchant','product',{ transactions: { paymentMethod: 'customer' } }] }
        // @param [Array<String,Object>] args the representations of includes to add to the query
        // @return [ActiveResource::Relation] the extended relation with added `include` params
        // 1. Go through array of args and separate objects with multiple keys in arrays of single key objects so
        //    the array does this: ['1', '2', { 3: 'a', 4: 'b' }] => ['1', '2', { 3: 'a' }, { 4: 'b' }]
        // 1. Append flattened array args to __queryParams['include'] collection
        // 2. Create new relation with extended __queryParams


        includes(...args) {
          args = ActiveResource.prototype.Collection.build(args).map(function (a) {
            var i, key, len, ref, results;

            if (_.isObject(a)) {
              ref = _.keys(a);
              results = [];

              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                results.push(_.pick(a, key));
              }

              return results;
            } else {
              return a;
            }
          }).flatten().toArray();
          return this.__newRelation(this.__extendArrayParam('include', args));
        } // Builds a new ActiveResource of the type for this relation
        // @example
        //   Order.build(price: 5.0, merchant: merchant)
        // @example
        //   Order.where(price: 5.0).build(merchant: merchant)
        // @param [Object] attributes the attributes to build the resource with
        // @return [ActiveResource::Base] the built resource
        // 1. If @base exists (class is Relation), then build base()
        // 2. If @base does not exist (class is Base), then build this()
        // 3. Assign attributes passed in to built resource
        // 4. Assign the filters of the Relation to the built resource
        // 5. Return the built resource


        build(attributes = {}) {
          var resource;
          resource = this.base != null ? new this.base() : new this();

          resource.__assignAttributes(_.extend(attributes, this.queryParams()['filter']));

          resource.assignResourceRelatedQueryParams(this.queryParams());

          resource.__executeCallbacks('afterBuild');

          return resource;
        } // Builds a new ActiveResource of the type for this relation and persists it on the server
        // @example
        //   Order.create(price: 5.0, merchant: merchant)
        // @example
        //   Order.where(price: 5.0).create(merchant: merchant)
        // @param [Object] attributes the attributes to build the resource with
        // @param [Function] callback the callback to pass the ActiveResource into on completion
        // @return [Promise] a promise to return the ActiveResource, valid or invalid


        create(attributes = {}, callback) {
          return this.build(attributes).save(callback);
        } // TODO: Add `updateAll` and `destroyAll` when JSON API supports mass updating/destroying
        // https://github.com/json-api/json-api/issues/795
        // Retrieves an ActiveResource in the relation corresponding to an ID
        // @param [Integer,String] primaryKey the primary key of the resource to query the server for
        // @return [Promise] a promise to return the ActiveResource **or** errors


        find(primaryKey) {
          var url;

          if (primaryKey == null) {
            return;
          }

          url = ActiveResource.prototype.Links.__constructLink(this.links()['related'], primaryKey.toString());
          return this.interface().get(url, this.queryParams());
        } // Retrieves the first ActiveResource in the relation corresponding to conditions
        // @param [Object] conditions the conditions to filter by
        // @return [Promise] a promise to return the ActiveResource **or** errors


        findBy(conditions) {
          return this.where(conditions).first();
        } // Retrieves all resources in the relation
        // @return [Promise] a promise to return a Collection of ActiveResources **or** errors


        all() {
          return this.interface().get(this.links()['related'], this.queryParams());
        } // Retrieves all resources in the relation and calls a function with each one of them
        // @param [Function] iteratee the function to call with each item of the relation
        // @return [Promise] a promise that returns the collection **or** errors


        each(iteratee) {
          return this.all().then(function (collection) {
            collection.each(iteratee);
            return collection;
          });
        } // Retrieves the first n ActiveResource in the relation
        // @param [Integer] n the number of resources to retrieve
        // @return [Promise] a promise to return an Array of n ActiveResources **or** errors
        // 1. If there are no page params set, we can apply limit n to optimize the query
        // => * If page params are set, we risk retrieving the "first" resource incorrectly
        // 2. Query all resources in the relation and then return the first N resources from the resulting collection


        first(n) {
          var relation;
          relation = this.queryParams()['page'] != null ? this : this.limit(n || 1);
          return relation.all().then(function (collection) {
            return collection.first(n);
          });
        } // Retrieves the last n ActiveResource in the relation
        // @param [Integer] n the number of resources to retrieve
        // @return [Promise] a promise to return an Array of n ActiveResources **or** errors
        // 1. If there are no page params set, we can apply limit and offset to optimize the query
        // => * If page params are set, we risk retrieving the "last" resource incorrectly
        // 2. Query all resources in the relation and then return the last N resources from the resulting collection


        last(n) {
          var relation;
          relation = this.queryParams()['page'] != null ? this : this.offset(-(n || 1)).limit(n || 1);
          return relation.all().then(function (collection) {
            return collection.last(n);
          });
        } // private
        // Creates a new ActiveResource::Relation with the extended __queryParams passed in
        // @param [Object] queryParams the extended query params for the relation
        // @return [ActiveResource::Relation] the new Relation for the extended query


        __newRelation(queryParams) {
          return new this.constructor(this.base, queryParams);
        }

      }

      
      ActiveResource.include(Relation, ActiveResource.prototype.QueryParams);
      ActiveResource.include(Relation, ActiveResource.prototype.Typing);
      return Relation;
    }.call(this);
  }).call(undefined);
  (function () {
    // Core methods and members for Base class
    ActiveResource.prototype.Core = function () {
      class Core {
        // The interface to use when querying the server for this class
        static interface() {
          return this.resourceLibrary.interface;
        } // The interface to use when querying the server for this resource


        interface() {
          return this.klass().interface();
        } // Creates a new ActiveResource::Relation with the extended queryParams passed in
        // @param [Object] queryParams the extended query params for the relation
        // @return [ActiveResource::Relation] the new Relation for the extended query


        static __newRelation(queryParams) {
          return new ActiveResource.prototype.Relation(this, queryParams);
        }

        toString() {
          return JSON.stringify(this.interface().buildResourceDocument({
            resourceData: this
          }));
        }

      }

       // The name to use when constantizing on the client
      // @example 'Product'
      // @note On a production server where minification occurs, the actual name of classes
      //   `@constructor.name` will change from `Product` to perhaps `p`. But, since a class
      //   is added as a variable to its resource library (or its prototype), we can use this
      //   method to determine the name of the variable in the resource library scope
      // @className = ''
      // The name to use when querying the server for this resource
      // @example 'products'
      // @queryName = ''
      // The primary key by which to index this resource

      Core.primaryKey = 'id';
      return Core;
    }.call(this);
  }).call(undefined);
  (function () {
    // Base class for interfacing with ActiveResources
    // @example
    //   class window.Order extends ActiveResource::Base
    //     this.className = 'Order'
    //     this.queryName = 'orders'
    //     @belongsTo('product')
    //     @hasMany('comments', as: 'resource')
    ActiveResource.prototype.Base = function () {
      class Base {
        constructor() {
          this.__initializeFields();
        }

      }

      
      ActiveResource.extend(Base, ActiveResource.prototype.Associations);
      ActiveResource.extend(Base, ActiveResource.prototype.Attributes.prototype);
      ActiveResource.extend(Base, ActiveResource.prototype.Callbacks.prototype);
      ActiveResource.extend(Base, ActiveResource.prototype.Core);
      ActiveResource.extend(Base, ActiveResource.prototype.Fields.prototype);
      ActiveResource.extend(Base, ActiveResource.prototype.Links);
      ActiveResource.extend(Base, ActiveResource.prototype.Reflection.prototype);
      ActiveResource.extend(Base, ActiveResource.prototype.Relation.prototype);
      ActiveResource.include(Base, ActiveResource.prototype.Associations.prototype);
      ActiveResource.include(Base, ActiveResource.prototype.Core.prototype);
      ActiveResource.include(Base, ActiveResource.prototype.Attributes);
      ActiveResource.include(Base, ActiveResource.prototype.Callbacks);
      ActiveResource.include(Base, ActiveResource.prototype.Cloning);
      ActiveResource.include(Base, ActiveResource.prototype.Errors);
      ActiveResource.include(Base, ActiveResource.prototype.Fields);
      ActiveResource.include(Base, ActiveResource.prototype.Links.prototype);
      ActiveResource.include(Base, ActiveResource.prototype.Persistence);
      ActiveResource.include(Base, ActiveResource.prototype.QueryParams);
      ActiveResource.include(Base, ActiveResource.prototype.Typing);
      return Base;
    }.call(this);
  }).call(undefined);
  (function () {
    // The instantiated class that manages an association for an ActiveResource
    ActiveResource.prototype.Associations.prototype.Association = function () {
      class Association {
        // @param [ActiveResource::Base] the resource that owners this association
        // @param [ActiveResource::Reflection] reflection the reflection of the association
        constructor(owner, reflection) {
          this.owner = owner;
          this.reflection = reflection;
          this.reset();
        } // Delegate the klass of the association to its reflection
        // @return [Class] the ActiveResource class for the association


        klass() {
          return this.reflection.klass();
        } // Delegate the options of the association to its reflection
        // @return [Object] the options for the association


        options() {
          return this.reflection.options;
        } // Retrieves the links for the association
        // @note Two types of links:
        //   {
        //     links: {
        //       self:    '/products/1/relationships/orders',  # Called when modifying relationships
        //       related: '/products/1/orders'                 # Called when creating/finding target
        //     }
        //   }
        // @return [Object] the links for the association


        links() {
          return this.__links || (this.__links = _.clone(this.klass().links()));
        } // The interface that the owner of this association uses


        interface() {
          return this.owner.klass().interface();
        } // Resets the loaded flag to `false` and the target to `nil`


        reset() {
          this.__loaded = false;
          return this.target = null;
        } // Reloads the target and returns `this` on success
        // @return [Promise] a promise to return the reloaded association **or** errors


        reload() {
          var _this;

          this.reset();
          _this = this;
          return this.loadTarget().then(function () {
            return _this;
          });
        } // A setter and getter for the loaded flag
        // @note @loaded() is the getter
        // @note @loaded(true) is the setter
        // @param [Boolean] set whether or not to set loaded flag to true
        // @return [Boolean] the loaded flag


        loaded(set = false) {
          if (set) {
            this.__loaded = true;
          }

          return this.__loaded;
        } // Loads the target if needed and returns it
        // This method is abstract in the sense that it relies on `__findTarget`,
        // which is expected to be provided by descendants
        // If the target is already loaded it is just returned. Thus, you can call
        // loadTarget unconditionally to get the target
        // @return [Promise] a promise to return the loaded target **or** 404 error


        loadTarget() {
          if (this.__canFindTarget()) {
            return this.__findTarget().then(loadedTarget => {
              this.target = loadedTarget;
              this.loaded(true);
              return loadedTarget;
            }).catch(() => {
              return this.reset();
            });
          } else {
            this.reset();
            return null;
          }
        } // Sets the inverse association of the resource to the owner of the association
        // @example
        //   GiftCard.hasOne('order')
        //   Order.belongsTo('giftCard')
        //   g = GiftCard.build()
        //   o = Order.build()
        //   g.association('order').setInverseInstance(o)
        //   o.association('giftCard').target == g
        // @param [ActiveResource::Base] the resource to set the inverse association of
        // @return [ActiveResource::Base] the resource, possibly with an inversed association


        setInverseInstance(resource) {
          var inverse;

          if (this.__invertibleFor(resource)) {
            inverse = resource.association(this.__inverseReflectionFor(resource).name);

            if (inverse.reflection.collection()) {
              inverse.addToTarget(this.owner);
            } else {
              inverse.target = this.owner;
            }
          }

          return resource;
        } // private
        // Throws error if we try to assign resource of one type to an association that requires another type
        // @param [Object] resource the value/resource being assigned to the association


        __raiseOnTypeMismatch(resource) {
          if (!(typeof resource.isA === "function" ? resource.isA(this.reflection.klass()) : void 0)) {
            throw `${this.reflection.className()} expected, got ${resource} which is an instance of ${resource.constructor}`;
          }
        } // Whether or not we can find the target
        // We can find the target if:
        // 1. The owner resource is not a new resource, or we have a foreign key to query with
        // 2. The target klass exists (so we can build the target)
        // @return [Boolean] whether or not we can find the target


        __canFindTarget() {
          return (!this.owner.newResource() || this.__foreignKeyPresent()) && this.klass();
        } // Defines attributes to create new resources with this association
        // @return [Object] the attributes to create new resources with this association with


        __creationAttributes() {
          var attributes, base, base1;
          attributes = {};

          if ((typeof (base = this.reflection).hasOne === "function" ? base.hasOne() : void 0) || (typeof (base1 = this.reflection).collection === "function" ? base1.collection() : void 0)) {
            attributes[this.reflection.foreignKey()] = this.owner[this.reflection.activeResourcePrimaryKey()];

            if (this.reflection.options['as']) {
              attributes[this.reflection.type()] = this.owner.klass().className;
            }
          }

          return attributes;
        } // If the resource library of the owner klass is immutable, then execute callback in the context
        //   of a clone of the owner association, and return the cloned owner from the method calling
        //   __cloneOnCallbackIfImmutable
        // @note If immutable is true, then value will be cloned before assignment to owner.clone
        // @note Used by association writer, build, create, concat, delete
        // @param [Boolean] checkImmutable if true, check if immutable, otherwise just run the normal fn
        // @param [ActiveResource, Array<ActiveResource>] value the value to assign to the relationship
        // @param [Function] fn the function to execute, potentially in the scope of the cloned owner
        // @return [Resource, Promise] if immutable, return cloned owner, otherwise return the value returned by fn


        __executeOnCloneIfImmutable(checkImmutable, value, fn) {
          var clone, newValue, result;

          if (checkImmutable && this.owner.klass().resourceLibrary.immutable) {
            clone = this.owner.clone();
            newValue = ActiveResource.Collection.build(value).map(val => {
              return (val != null ? val.__createClone({
                cloner: this.owner,
                newCloner: clone
              }) : void 0) || null;
            });
            result = _.bind(fn, clone.association(this.reflection.name))(((typeof value.isA === "function" ? value.isA(ActiveResource.Collection) : void 0) || _.isArray(value)) && newValue.toArray() || newValue.first());

            if (result.then != null) {
              return result.then(() => {
                return clone;
              });
            } else {
              return clone;
            }
          } else {
            return _.bind(fn, this)(value);
          }
        } // Used by hasOne and hasMany to set their owner attributes on belongsTo resources


        __setOwnerAttributes(resource) {
          var key, ref, results, value;
          ref = this.__creationAttributes();
          results = [];

          for (key in ref) {
            value = ref[key];
            results.push(resource[key] = value);
          }

          return results;
        } // Returns true if there is a foreign key present on the owner which
        // references the target. This is used to determine whether we can load
        // the target if the owner is currently a new resource (and therefore
        // without a key). If the owner is a new resource then foreign_key must
        // be present in order to load target.
        // Currently implemented by belongsTo (vanilla and polymorphic)


        __foreignKeyPresent() {
          return false;
        } // Can be redefined by subclasses, notably polymorphic belongs_to
        // The resource parameter is necessary to support polymorphic inverses as we must check for
        // the association in the specific class of the resource.
        // @param [ActiveResource::Base] the resource with reflection to find an inverseOf()
        // @return [ActiveResource::Reflection] the inverse reflection for the resource's reflection


        __inverseReflectionFor(resource) {
          return this.reflection.inverseOf();
        } // Returns true if inverse association on the given resource needs to be set.
        // This method is redefined by subclasses.
        // @param [ActiveResource::Base] the resource to determine if we need to set the inverse association for
        // @return [Boolean] whether or not the inverse association needs to be set


        __invertibleFor(resource) {
          return this.__inverseReflectionFor(resource) != null;
        } // @return [Boolean] returns true if the resource contains the foreignKey


        __foreignKeyFor(resource) {
          return typeof resource.hasAttribute === "function" ? resource.hasAttribute(this.reflection.foreignKey()) : void 0;
        } // Builds a resource in the association with the given attributes
        // @param [Object] attributes the attributes to build the resource with
        // @return [ActiveResource::Base] the built resource in the association


        __buildResource(attributes) {
          var resource;
          resource = this.reflection.buildAssociation();

          resource.__assignAttributes(attributes);

          return resource;
        }

      }

      
      ActiveResource.include(Association, ActiveResource.prototype.Typing); // Don't add this class when extending/include the parent

      Association.__excludeFromExtend = true;
      return Association;
    }.call(this);
  }).call(undefined);
  (function () {
    // CollectionAssociation is an abstract class that provides common stuff to ease the implementation
    // of association proxies that represent collections.
    ActiveResource.prototype.Associations.prototype.CollectionAssociation = class CollectionAssociation extends ActiveResource.prototype.Associations.prototype.Association {
      // @note Adds @queryName so it can be used in CollectionProxy when making Relations
      // @param [ActiveResource::Base] the resource that owners this association
      // @param [ActiveResource::Reflection] reflection the reflection of the association
      constructor(owner, reflection) {
        super(...arguments);
        this.owner = owner;
        this.reflection = reflection;
        this.queryName = this.klass().queryName;
      } // Getter for the proxy to the target


      reader() {
        return this.proxy || (this.proxy = new ActiveResource.prototype.Associations.prototype.CollectionProxy(this));
      } // Setter for the target
      // @param [Collection,Array] resources the resources to assign to the association
      // @param [Boolean] save whether or not to persist the assignment on the server before
      //   continuing with the local assignment
      // @param [Boolean] checkImmutable if true, check if immutable when applying changes
      // @return [Promise] a promise that indicates that the assignment was successful **or** errors


      writer(resources, save = true, checkImmutable = false) {
        return this.__executeOnCloneIfImmutable(checkImmutable, resources, function (resources) {
          var base, localAssignment, persistedResources;
          resources = ActiveResource.prototype.Collection.build(resources);
          resources.each(r => {
            return this.__raiseOnTypeMismatch(r);
          });
          persistedResources = resources.select(function (r) {
            return typeof r.persisted === "function" ? r.persisted() : void 0;
          });

          localAssignment = () => {
            if (save) {
              this.loaded(true);
            }

            this.replace(resources);
            return resources;
          };

          if (save && !(typeof (base = this.owner).newResource === "function" ? base.newResource() : void 0) && (resources.empty() || !persistedResources.empty())) {
            return this.__persistAssignment(persistedResources.toArray()).then(localAssignment);
          } else {
            return localAssignment();
          }
        });
      } // Builds resource(s) for the association
      // @param [Object,Array<Object>] attributes the attributes to build into the resource
      // @return [ActiveResource::Base] the built resource(s) for the association, with attributes


      build(attributes = {}) {
        return this.__executeOnCloneIfImmutable(true, [], function () {
          if (_.isArray(attributes)) {
            return ActiveResource.prototype.Collection.build(attributes).map(attr => {
              return this.build(attr);
            });
          } else {
            return this.__concatResources(ActiveResource.prototype.Collection.build(this.__buildResource(attributes))).first();
          }
        });
      } // Creates resource for the association
      // @todo Add support for multiple resource creation when JSON API supports it
      // @param [Object] attributes the attributes to build into the resource
      // @param [Object] queryParams the options to add to the query, like `fields` and `include`
      // @param [Function] callback the function to pass the built resource into after calling create
      //   @note May not be persisted, in which case `resource.errors().empty? == false`
      // @return [ActiveResource::Base] a promise to return the persisted resource **or** errors


      create(attributes = {}, queryParams = {}, callback = _.noop()) {
        return this.__executeOnCloneIfImmutable(true, [], function () {
          return this.__createResource(attributes, queryParams, callback);
        });
      } // Pushes resources onto the target
      // @param [Collection,Array] resources the resources to push onto the association
      // @return [Promise] a promise that indicates that the concat was successful **or** errors


      concat(resources) {
        return this.__executeOnCloneIfImmutable(true, resources, function () {
          var base, persistedResources;
          resources = ActiveResource.prototype.Collection.build(resources);
          resources.each(r => {
            return this.__raiseOnTypeMismatch(r);
          });

          if (!(typeof (base = this.owner).newResource === "function" ? base.newResource() : void 0) && (persistedResources = resources.select(function (r) {
            return typeof r.persisted === "function" ? r.persisted() : void 0;
          })).size()) {
            // TODO: Do something better with unpersisted resources, like saving them
            return this.__persistConcat(persistedResources.toArray()).then(() => {
              return this.__concatResources(resources);
            });
          } else {
            return this.__concatResources(resources);
          }
        });
      } // Deletes resources from the target
      // @param [Collection,Array] resources the resources to delete from the association
      // @return [Promise] a promise that indicates that the delete was successful **or** errors


      delete(resources) {
        return this.__executeOnCloneIfImmutable(true, resources, function () {
          var base, persistedResources;
          resources = ActiveResource.prototype.Collection.build(resources);
          resources.each(r => {
            return this.__raiseOnTypeMismatch(r);
          });

          if (!(typeof (base = this.owner).newResource === "function" ? base.newResource() : void 0) && (persistedResources = resources.select(function (r) {
            return typeof r.persisted === "function" ? r.persisted() : void 0;
          })).size()) {
            return this.__persistDelete(persistedResources.toArray()).then(() => {
              return this.__removeResources(resources);
            });
          } else {
            return this.__removeResources(resources);
          }
        });
      }

      reset() {
        super.reset();
        return this.target = ActiveResource.prototype.Collection.build();
      } // Adds the resource to the target
      // @note Uses `replaceOnTarget` to replace the resource in the target if it is
      //   already in the target
      // @param [ActiveResource::Base] resource the resource to add to the target


      addToTarget(resource) {
        var index;
        index = _.indexOf(this.target.toArray(), resource);

        if (index < 0) {
          index = null;
        }

        return this.replaceOnTarget(resource, index);
      } // Pushes the resource onto the target or replaces it if there is an index
      // @param [ActiveResource::Base] resource the resource to add to/replace on the target
      // @param [Integer] index the index of the existing resource to replace


      replaceOnTarget(resource, index) {
        if (index != null) {
          this.target.set(index, resource);
        } else {
          this.target.push(resource);
        }

        this.setInverseInstance(resource);
        return resource;
      } // Checks whether or not the target is empty
      // @note Does not take into consideration that the target may not be loaded,
      //   so if you want to truly know if the association is empty, check that
      //   `association(...).loaded() and association(...).empty()`
      // @return [Boolean] whether or not the target is empty


      empty() {
        return this.target.empty();
      } // private


      __findTarget() {
        var _this;

        _this = this;
        return this.interface().get(this.links()['related'], this.owner.queryParamsForReflection(this.reflection)).then(function (resources) {
          resources.each(function (r) {
            return _this.setInverseInstance(r);
          });
          return resources;
        });
      } // Replaces the target with `other`
      // @param [Collection] other the array to replace on the target


      replace(other) {
        this.__removeResources(this.target);

        return this.__concatResources(other);
      } // Concats resources onto the target
      // @param [Collection] resources the resources to concat onto the target


      __concatResources(resources) {
        resources.each(resource => {
          this.addToTarget(resource);
          return this.insertResource(resource);
        });
        return resources;
      } // Removes the resources from the target
      // @note Only calls @__deleteResources for now, but can implement callbacks when
      //   the library gets to that point
      // @param [Collection] the resources to remove from the association


      __removeResources(resources) {
        return this.__deleteResources(resources);
      } // Deletes the resources from the target
      // @note Expected to be defined by descendants
      // @param [Collection] resources the resource to delete from the association


      __deleteResources(resources) {
        throw '__deleteResources not implemented on CollectionAssociation';
      } // Persists the new association by patching the owner's relationship endpoint
      // @param [Array] resources the resource to delete from the association


      __persistAssignment(resources) {
        return this.interface().patch(this.links()['self'], resources, {
          onlyResourceIdentifiers: true
        });
      } // Persists a concat to the association by posting to the owner's relationship endpoint
      // @param [Array] resources the resource to delete from the association


      __persistConcat(resources) {
        return this.interface().post(this.links()['self'], resources, {
          onlyResourceIdentifiers: true
        });
      } // Persists deleting resources from the association by deleting it on the owner's relationship endpoint
      // @param [Array] resources the resource to delete from the association


      __persistDelete(resources) {
        return this.interface().delete(this.links()['self'], resources, {
          onlyResourceIdentifiers: true
        });
      } // @see #create


      __createResource(attributes, queryParams, callback) {
        var _this, base, resource;

        if (!(typeof (base = this.owner).persisted === "function" ? base.persisted() : void 0)) {
          throw 'You cannot call create on an association unless the parent is saved';
        }

        resource = this.__buildResource(attributes);
        resource.assignQueryParams(queryParams);
        this.insertResource(resource);
        _this = this;
        return resource.save(callback).then(function () {
          _this.addToTarget(resource);

          return resource;
        });
      }

    };
  }).call(undefined);
  (function () {
    // Manages a hasMany association in the same form as a Relation, except all queries
    // are made with association links and a lot of the methods make use of Association
    // to accomplish their goal
    ActiveResource.prototype.Associations.prototype.CollectionProxy = function () {
      class CollectionProxy extends ActiveResource.prototype.Relation {
        target() {
          return this.base.target;
        } // Override Relation#queryParams so we can merge together the queryParams of both
        // owner.queryParamsForReflection(thisReflection) and the queryParams of the association
        // class. This is important because we have to use the queryParams that were used to
        // initially load this association, but if we ever do another query here we must also use
        // the queryParams for the klass so autosave associations will be reloaded if we do something
        // like `product.orders().create(orderItems: [...])`, if Order#orderItems were an autosave
        // association
        // TODO: If we ever include an association, we should automatically add nested includes for
        // each default include of that association's class
        // @return [Object] queryParams the queryParams for the collection proxy


        queryParams() {
          return this.__queryParams || (this.__queryParams = (() => {
            var base, klassQueryParams, queryParams;
            queryParams = _.clone(this.base.owner.queryParamsForReflection(this.base.reflection));

            if (!(typeof (base = this.base.reflection).polymorphic === "function" ? base.polymorphic() : void 0)) {
              klassQueryParams = _.clone(this.base.klass().queryParams());

              if (klassQueryParams['include'] != null) {
                queryParams = this.__extendArrayParam('include', klassQueryParams['include'], queryParams);
              }

              if (klassQueryParams['fields'] != null) {
                _.each(klassQueryParams['fields'], function (v, k) {
                  var v2;

                  if (v2 = queryParams['fields'][k]) {
                    return v2.push(...v);
                  } else {
                    return queryParams['fields'][k] = v;
                  }
                });
              }
            }

            return queryParams;
          })());
        } // Gets all the items in the association
        // @note This method will not set the target of the association to the response,
        //   it will only retrieve the target of the association and return it
        //   You must preload the association or call `load[Association]()` or
        //   `association(...).loadTarget()`
        // @param [Object] options the options to use when getting the items
        // @option [Boolean] cached if true, uses items already cached locallys
        // TODO: Add cached versions of first, last, find, where, empty etc.


        all(options = {}) {
          if (options['cached']) {
            return this.target();
          } else {
            return super.all();
          }
        } // Loads into the target the result of `all` (which does not write its
        // result to target)
        // @note This differs from @base.loadTarget() because that does not use queryParams()
        //   like Relation or CollectionProxy
        // @return [Promise] the array of cached collection association items


        load() {
          return this.all().then(collection => {
            return this.base.writer(collection, false, true);
          });
        } // Gets the cached association collection and returns it as an array
        // @return [Array<ActiveResource::Base>] the array of cached collection association items


        toArray() {
          return this.all({
            cached: true
          }).toArray();
        } // Returns the size of the target currently loaded into memory
        // @return [Integer] the size of the loaded target


        size() {
          return this.target().size();
        } // Checks whether or not the target is empty
        // @note Does not take into consideration that the target may not be loaded,
        //   so if you want to truly know if the association is empty, check that
        //   `association(...).loaded() and association(...).empty()`
        // @return [Boolean] whether or not the target is empty


        empty() {
          return this.target().empty();
        } // Assigns the association to `other`
        // @param [Array,Collection] other the other collection to set the association to
        // @param [Boolean] save whether or not to persist the assignment on the server
        // @return [Promise] a promise to return a success indicator (204 No Content) **or**
        //   an error indicator (403 Forbidden)


        assign(other, save = true) {
          return this.base.writer(other, save, true);
        } // Pushes the resources onto the association
        // @param [Array,Collection] resources the resources to push onto the association
        // @return [Promise] a promise to return a success indicator (204 No Content) **or**
        //   an error indicator (403 Forbidden)


        push(resources) {
          return this.base.concat(resources);
        } // Builds resource(s) for the association
        // @see CollectionAssociation#build
        // @param [Object,Array<Object>] attributes the attributes to build into the resource
        // @return [ActiveResource::Base] the built resource(s) for the association, with attributes


        build(attributes = {}) {
          var resources;
          attributes = _.isArray(attributes) ? _.map(attributes, attr => {
            return _.extend(attr, this.queryParams()['filter']);
          }) : _.extend(attributes, this.queryParams()['filter']);
          resources = ActiveResource.prototype.Collection.build(this.base.build(attributes));
          resources.each(r => {
            return r.assignResourceRelatedQueryParams(this.queryParams());
          });

          if (resources.size() > 1) {
            return resources;
          } else {
            return resources.first();
          }
        } // Create resource for the association
        // @see CollectionAssociation#create
        // @param [Object] attributes the attributes to build into the resource
        // @param [Function] callback the function to pass the built resource into after calling create
        //   @note May not be persisted, in which case `resource.errors().empty? == false`
        // @return [ActiveResource::Base] a promise to return the persisted resource **or** errors


        create(attributes = {}, callback) {
          attributes = _.extend(attributes, this.queryParams()['filter']);
          return this.base.create(attributes, this.__resourceRelatedParams(), callback);
        } // Reloads the association
        // @return [Promise<ActiveResource::Base>] a promise to return the reloaded target **or** errors


        reload() {
          return this.base.reload();
        } // Deletes the resources from the association
        // @param [Array,Collection] resources the resources to delete from the association
        // @return [Promise] a promise to return a success indicator (204 No Content) **or**
        //   an error indicator (403 Forbidden)


        delete(resources) {
          return this.base.delete(resources);
        } // Deletes all the resources in the association from the association
        // @return [Promise] a promise to return a success indicator (204 No Content) **or**
        //   an error indicator (403 Forbidden)


        deleteAll() {
          return this.base.delete(this.target());
        }

      }

       // Don't add this class when extending/include the parent

      CollectionProxy.__excludeFromExtend = true;
      return CollectionProxy;
    }.call(this);
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.HasManyAssociation = class HasManyAssociation extends ActiveResource.prototype.Associations.prototype.CollectionAssociation {
      // Inserts a resource into the collection by setting its owner attributes and inversing it
      // @param [ActiveResource::Base] resource the resource to insert into the collection
      insertResource(resource) {
        this.__setOwnerAttributes(resource);

        return this.setInverseInstance(resource);
      } // Deletes resources from the target and removes their foreign key
      // @param [Array] resources the resources to delete from the target


      __deleteResources(resources) {
        resources.each(resource => {
          var inverse;

          if ((inverse = this.reflection.inverseOf()) != null) {
            return resource.association(inverse.name).replace(null);
          } else {
            return resource[this.reflection.foreignKey()] = null;
          }
        });
        return this.target = ActiveResource.prototype.Collection.build(_.difference(this.target.toArray(), resources.toArray()));
      }

    };
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.SingularAssociation = class SingularAssociation extends ActiveResource.prototype.Associations.prototype.Association {
      // Getter for the target
      reader() {
        return this.target;
      } // Setter for the target
      // @param [ActiveResource::Base] resources the resource to assign to the association
      // @param [Boolean] save whether or not to persist the assignment on the server before
      //   continuing with the local assignment
      // @param [Boolean] checkImmutable if true, check if immutable when applying changes
      // @return [Promise] a promise that indicates that the assignment was successful **or** errors


      writer(resource, save = true, checkImmutable = false) {
        return this.__executeOnCloneIfImmutable(checkImmutable, resource, function (resource) {
          var base, localAssignment;

          if (resource != null) {
            this.__raiseOnTypeMismatch(resource);
          }

          localAssignment = () => {
            if (save) {
              this.loaded(true);
            }

            return this.replace(resource);
          };

          if (save && !(typeof (base = this.owner).newResource === "function" ? base.newResource() : void 0)) {
            return this.__persistAssignment(resource).then(localAssignment);
          } else {
            return localAssignment();
          }
        });
      } // Builds a resource for the association
      // @param [Object] attributes the attributes to build into the resource
      // @return [ActiveResource::Base] the built resource for the association, with attributes


      build(attributes = {}) {
        return this.__executeOnCloneIfImmutable(true, [], function () {
          var resource;
          resource = this.__buildResource(attributes);
          this.replace(resource);
          return resource;
        });
      } // Creates a resource for the association
      // @param [Object] attributes the attributes to build into the resource
      // @param [Object] queryParams the options to add to the query, like `fields` and `include`
      // @param [Function] callback the function to pass the built resource into after calling create
      //   @note May not be persisted, in which case `resource.errors().empty? == false`
      // @return [ActiveResource::Base] a promise to return the persisted resource **or** errors


      create(attributes = {}, queryParams = {}, callback) {
        return this.__executeOnCloneIfImmutable(true, [], function () {
          return this.__createResource(attributes, queryParams, callback);
        });
      } // private


      replace(resource) {
        return raise('Subclasses must implement a replace(resource) method');
      } // Persists the new association by patching the owner's relationship endpoint


      __persistAssignment(resource) {
        return this.interface().patch(this.links()['self'], resource, {
          onlyResourceIdentifiers: true
        });
      } // Gets the resource that is the target
      // @return [Promise] a promise to return the resource **or** error 404


      __getResource() {
        return this.interface().get(this.links()['related'], this.owner.queryParamsForReflection(this.reflection));
      } // Finds target using either the owner's relationship endpoint
      // @return [Promise] a promise to return the target **or** error 404


      __findTarget() {
        var _this;

        _this = this;
        return this.__getResource().then(function (resource) {
          return _this.setInverseInstance(resource);
        });
      } // Creates a resource for the association
      // @see #create
      // @return [Promise] a promise to return the created target **or** errors


      __createResource(attributes, queryParams, callback) {
        var _this, base, resource;

        if (!(typeof (base = this.owner).persisted === "function" ? base.persisted() : void 0)) {
          throw 'You cannot call create on an association unless the parent is saved';
        }

        resource = this.__buildResource(attributes);
        resource.assignQueryParams(queryParams);
        this.replace(resource);
        _this = this;
        return resource.save(callback).then(function () {
          _this.loaded(true);

          return resource;
        });
      }

    };
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.HasOneAssociation = class HasOneAssociation extends ActiveResource.prototype.Associations.prototype.SingularAssociation {
      // private
      replace(resource) {
        this.__removeTarget();

        if (resource) {
          this.__setOwnerAttributes(resource);

          this.setInverseInstance(resource);
          return this.target = resource;
        }
      } // TODO: Add delete/destroy dependency processing


      __removeTarget() {
        if (this.target) {
          this.__nullifyOwnerAttributes(this.target);
        }

        return this.target = null;
      }

      __nullifyOwnerAttributes(resource) {
        return resource[this.reflection.foreignKey()] = null;
      }

    };
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.BelongsToAssociation = class BelongsToAssociation extends ActiveResource.prototype.Associations.prototype.SingularAssociation {
      reset() {
        super.reset();
        return this.updated = false;
      } // private


      replace(resource) {
        if (resource) {
          this.__replaceKeys(resource);

          this.setInverseInstance(resource);
          this.updated = true;
        } else {
          this.__removeKeys();
        }

        return this.target = resource;
      } // Gets the resource that is the target of this association, using either the
      // owner's relationship data endpoint, or the foreign key to query the resource's root URL
      // @return [Promise] a promise to return the resource **or** error 404


      __getResource() {
        if (!this.owner.newResource()) {
          // @example Uses @links()['related'] == '/orders/1/product'
          return super.__getResource();
        } else {
          // @example Uses @links()['related'] == '/products/:product_id'
          return this.interface().get(this.links()['related'] + this.owner[this.reflection.foreignKey()], this.owner.queryParamsForReflection(this.reflection));
        }
      } // Replaces the foreign key of the owner with the primary key of the resource (the new target)
      // @param [ActiveResource::Base] resource the resource with a primaryKey to replace the foreignKey of the owner


      __replaceKeys(resource) {
        return this.owner[this.reflection.foreignKey()] = resource.__readAttribute(this.reflection.associationPrimaryKey(resource.klass()));
      } // Removes the foreign key of the owner


      __removeKeys() {
        return this.owner[this.reflection.foreignKey()] = null;
      }

      __foreignKeyPresent() {
        return this.owner.__readAttribute(this.reflection.foreignKey()) != null;
      }

    };
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.BelongsToPolymorphicAssociation = class BelongsToPolymorphicAssociation extends ActiveResource.prototype.Associations.prototype.BelongsToAssociation {
      klass() {
        var type;
        type = this.owner[this.reflection.foreignType()];

        try {
          return this.owner.klass().resourceLibrary.constantize(type);
        } catch (error) {
          return void 0;
        }
      }

      links() {
        if (this.klass()) {
          return super.links();
        } else {
          return {};
        }
      } // private
      // Replaces the foreignKey && foreignType of the owner
      // @see BelongsToAssociation#__replaceKeys


      __replaceKeys(resource) {
        super.__replaceKeys(resource);

        return this.owner[this.reflection.foreignType()] = resource.klass().className;
      } // Removes the foreignKey && foreignType of the owner
      // @see BelongsToAssociation#__removeKeys


      __removeKeys() {
        super.__removeKeys();

        return this.owner[this.reflection.foreignType()] = null;
      } // Gets the inverse reflection of the polymorphic reflection


      __inverseReflectionFor(resource) {
        return this.reflection.polymorphicInverseOf(resource.klass());
      }

      __raiseOnTypeMismatch(resource) {}

    }; // A polymorphic association cannot have a type mismatch, by definition
  }).call(undefined);
  (function () {
    // Defines accessors on ActiveResources for managing associations, handling
    // foreign key reassignment, persistence, etc.
    ActiveResource.prototype.Associations.prototype.Builder = function () {
      class Builder {}

       // Don't add this class when extending/include the parent

      Builder.__excludeFromExtend = true;
      Builder.prototype.Association = class Association {
        // Builds a reflection of an association and defines accessor methods into instances of the model
        // @param [Class] model the ActiveResource class to apply the association to
        // @param [String] name the name of the association
        // @param [Object] options options to apply to the association
        // @return [Reflection] the built reflection
        static build(model, name, options) {
          var reflection;
          reflection = ActiveResource.prototype.Reflection.create(this.macro, name, options, model);
          this.defineAccessors(model, reflection);
          return reflection;
        } // Defines getter/setter methods on the model for the association
        // @param [Class] model the ActiveResource class to apply the association to
        // @param [Reflection] reflection the reflection of the association to build accessors for


        static defineAccessors(model, reflection) {
          var name;
          name = reflection.name;
          this.defineReaders(model, name);
          return this.defineWriters(model, name);
        } // Defines getter methods on the model for the association
        // @param [Class] mixin the class to mix getter methods into
        // @param [String] name the name of the association


        static defineReaders(mixin, name) {
          mixin.prototype[name] = function () {
            return this.association(name).reader();
          };

          return mixin.prototype[`load${s.capitalize(name)}`] = function () {
            return this.association(name).loadTarget();
          };
        } // Defines setter methods on the model for the association
        // @note In Rails, this method is defined much like `@define_readers` because
        //   operator overloading exists in Ruby. However, because operator overloading does
        //   not exist in Javascript, we must define `assign()` methods for associations. But,
        //   because singular association targets are assigned as variables to their owner model,
        //   whereas collection association targets are wrapped in a proxy, we must define the
        //   `assign()` methods in different ways. Singular association assignment is defined on
        //   the owner model as `assign_[target_klass]()`, whereas collection association
        //   assignment is defined on the proxy object, as `assign()`
        // @param [Class] mixin the class to mix getter methods into
        // @param [String] name the name of the association


        static defineWriters(mixin, name) {
          return _.noop();
        }

      };
      return Builder;
    }.call(this);
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.Builder.prototype.CollectionAssociation = class CollectionAssociation extends ActiveResource.prototype.Associations.prototype.Builder.prototype.Association {};
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.Builder.prototype.HasMany = function () {
      class HasMany extends ActiveResource.prototype.Associations.prototype.Builder.prototype.CollectionAssociation {}

      
      HasMany.macro = 'hasMany';
      return HasMany;
    }.call(this);
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.Builder.prototype.SingularAssociation = class SingularAssociation extends ActiveResource.prototype.Associations.prototype.Builder.prototype.Association {
      // Defines getter/setter methods on the model for the association
      // @param [Class] model the ActiveResource class to apply the association to
      // @param [Reflection] reflection the reflection of the association to build accessors for
      static defineAccessors(model, reflection) {
        super.defineAccessors(...arguments);

        if (typeof reflection.constructable === "function" ? reflection.constructable() : void 0) {
          return this.defineConstructors(model, reflection.name);
        }
      } // Defines setter methods on the model for the association
      // @param [Class] mixin the class to mix getter methods into
      // @param [String] name the name of the association


      static defineWriters(mixin, name) {
        mixin.prototype[`assign${s.capitalize(name)}`] = function (value) {
          return this.association(name).writer(value, false, true);
        };

        return mixin.prototype[`update${s.capitalize(name)}`] = function (value) {
          return this.association(name).writer(value, true, true);
        };
      } // Defines builder methods on the model for the association
      // @note This is only called on associations with reflections that are `constructable?`
      //   Polymorphic reflections are not constructable, because the type is ambiguous
      // @param [Class] mixin the class to mix construction methods into
      // @param [String] name the name of the association


      static defineConstructors(mixin, name) {
        mixin.prototype[`build${s.capitalize(name)}`] = function (attributes) {
          return this.association(name).build(attributes);
        };

        return mixin.prototype[`create${s.capitalize(name)}`] = function (attributes, callback) {
          return this.association(name).create(attributes, callback);
        };
      }

    };
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.Builder.prototype.BelongsTo = function () {
      class BelongsTo extends ActiveResource.prototype.Associations.prototype.Builder.prototype.SingularAssociation {}

      
      BelongsTo.macro = 'belongsTo';
      return BelongsTo;
    }.call(this);
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Associations.prototype.Builder.prototype.HasOne = function () {
      class HasOne extends ActiveResource.prototype.Associations.prototype.Builder.prototype.SingularAssociation {}

      
      HasOne.macro = 'hasOne';
      return HasOne;
    }.call(this);
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Immutable = class Immutable {};
  }).call(undefined);
  (function () {
    // ActiveResource methods for managing attributes of immutable resources
    ActiveResource.prototype.Immutable.prototype.Attributes = class Attributes {
      // Assigns `attributes` to a new resource cloned from this immutable resource
      // @param [Object] attributes the attributes to assign
      static assignAttributes(attributes) {
        var clone;
        clone = this.clone();

        clone.__assignAttributes(attributes);

        return clone;
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource methods for managing attributes of immutable resources
    ActiveResource.prototype.Immutable.prototype.Errors = class Errors extends ActiveResource.prototype.Errors {
      // Override ActiveResource::Errors#errors so that errors on resources are managed immutably
      static errors() {
        return this.__errors || (this.__errors = new ActiveResource.prototype.Immutable.prototype.Errors(this));
      } // Adds an error with code and message to a new immutable resource's error object for a field
      // @param [String] field the field the error applies to
      //   Or 'base' if it applies to the base object
      // @param [String] code the code for the error
      // @param [String] detail the message for the error
      // @return [ActiveResource::Base] the new resource with the error added


      add(field, code, detail = '') {
        var clone;
        clone = this.base.clone();

        clone.errors().__add(field, code, detail);

        return clone;
      } // Adds an array of errors in a new immutable resource and returns the resource
      // @see #add for individual error params
      // @param [Array<Array>] errors error objects to add
      // @return [ActiveResource::Base] the new resource with the errors added


      addAll(...errors) {
        var clone;
        clone = this.base.clone();

        _.map(errors, error => {
          return clone.errors().__add(...error);
        });

        return clone;
      } // Propagates errors with nested fields down through relationships to their appropriate resources
      // @note Clones any resource that has errors added to it and replaces it on the owner's association target
      // @param [ActiveResource.Collection<Object>] errors the errors to propagate down the resource


      propagate(errors) {
        var errorsByTarget;
        errorsByTarget = errors.inject({}, (targetObject, error) => {
          var association, field, nestedError, nestedField;
          nestedField = error.field.split('.');
          field = nestedField.shift();
          nestedError = _.clone(error);

          if (targetObject[field] == null) {
            try {
              association = this.base.association(field);
            } catch (error1) {
              association = null;
            }

            targetObject[field] = {
              association: association,
              errors: ActiveResource.Collection.build()
            };
          }

          if (targetObject[field].association != null) {
            nestedError.field = nestedField.length === 0 && 'base' || nestedField.join('.');
          }

          targetObject[field].errors.push(nestedError);
          return targetObject;
        });
        return _.each(errorsByTarget, (errorsForTarget, k) => {
          var association, baseErrors, clone, ref, relationshipResource;

          if (errorsForTarget.association != null) {
            association = errorsForTarget.association;

            if (association.reflection.collection()) {
              baseErrors = errorsForTarget.errors.select(e => {
                return e.field === 'base';
              });
              baseErrors.each(e => {
                e.field = k;
                return errorsForTarget.errors.delete(e);
              });
              baseErrors.each(e => {
                return this.push(e);
              });
              relationshipResource = association.target.first();

              if (clone = relationshipResource != null ? relationshipResource.__createClone({
                cloner: this.base
              }) : void 0) {
                this.base.__fields[association.reflection.name].replace(relationshipResource, clone);

                association.target.replace(relationshipResource, clone);
                clone.errors().clear();
                return clone.errors().propagate(errorsForTarget.errors);
              }
            } else {
              if (clone = (ref = association.target) != null ? ref.__createClone({
                cloner: this.base
              }) : void 0) {
                clone.errors().clear();
                return clone.errors().propagate(errorsForTarget.errors);
              }
            }
          } else {
            return errorsForTarget.errors.each(e => {
              return this.push(e);
            });
          }
        });
      }

    };
  }).call(undefined);
  (function () {
    // ActiveResource methods for managing persistence of immutable resources to the server
    ActiveResource.prototype.Immutable.prototype.Persistence = class Persistence {
      // Update specific attributes of the resource, save it, and insert resource into callback after
      // @param [Object] attributes the attributes to update in the resource
      // @param [Function] callback the callback to pass the ActiveResource into
      // @return [Promise] a promise to return the ActiveResource, valid or invalid
      static update(attributes, callback) {
        var attributesKeys, oldAttributes;
        attributesKeys = ActiveResource.prototype.Collection.build(_.keys(attributes));
        oldAttributes = _.pick(this.attributes(), attributesKeys.toArray());
        oldAttributes = _.defaults(oldAttributes, attributesKeys.inject({}, (obj, k) => {
          obj[k] = null;
          return obj;
        }));
        return this.__createOrUpdate(this.assignAttributes(attributes)).then(null, function (resource) {
          resource.__assignAttributes(oldAttributes);

          return resource;
        }).then(callback, callback);
      } // Override default __createOrUpdate so it will use a clone in persisting the record


      static __createOrUpdate(clone = this.clone()) {
        clone.errors().reset();

        if (clone.persisted()) {
          return this.klass().resourceLibrary.interface.patch(this.links()['self'], clone);
        } else {
          return this.klass().resourceLibrary.interface.post(this.links()['related'], clone);
        }
      }

    };
  }).call(undefined);
  (function () {
    ActiveResource.prototype.Immutable.prototype.Base = function () {
      class Base extends ActiveResource.prototype.Base {
        constructor() {
          super();
        }

      }

      
      ActiveResource.include(Base, ActiveResource.prototype.Immutable.prototype.Attributes, true);
      ActiveResource.include(Base, ActiveResource.prototype.Immutable.prototype.Errors, true);
      ActiveResource.include(Base, ActiveResource.prototype.Immutable.prototype.Persistence, true);
      return Base;
    }.call(this);
  }).call(undefined);

  return activeResource;

})));
