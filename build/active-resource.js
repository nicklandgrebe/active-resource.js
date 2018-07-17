(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["axios","es6-promise","underscore","underscore.string","qs","underscore.inflection"], function (a0,b1,c2,d3,e4,f5) {
      return (root['ActiveResource'] = factory(a0,b1,c2,d3,e4,f5));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("axios"),require("es6-promise"),require("underscore"),require("underscore.string"),require("qs"),require("underscore.inflection"));
  } else {
    root['ActiveResource'] = factory(root["axios"],root["es6-promise"],root["underscore"],root["underscore.string"],root["qs"],root["underscore.inflection"]);
  }
}(this, function (axios, es6Promise, _, s, Qs) {

var ActiveResource = function(){};

window.Promise = es6Promise.Promise;

(function() {
  ActiveResource.extend = function(klass, mixin) {
    var method, name, _results;
    _results = [];
    for (name in mixin) {
      method = mixin[name];
      if (!method.__excludeFromExtend) {
        _results.push(klass[name] = method);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  ActiveResource.include = function(klass, mixin) {
    return this.extend(klass.prototype, mixin);
  };

}).call(this);

(function() {
  ActiveResource.prototype.Typing = (function() {
    function Typing() {}

    Typing.klass = function() {
      return this.constructor;
    };

    Typing.isA = function(klass) {
      var match, object;
      object = this;
      match = object.constructor === klass;
      while (!(match || ((object = object.constructor.__super__) == null))) {
        match = object.constructor === klass;
      }
      return match;
    };

    return Typing;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.createResourceLibrary = function(baseUrl, options) {
    var ResourceLibrary;
    if (options == null) {
      options = {};
    }
    return ResourceLibrary = (function() {
      var Base, base, resourceLibrary, _ref;

      function ResourceLibrary() {}

      ResourceLibrary.baseUrl = baseUrl.charAt(baseUrl.length - 1) === '/' ? baseUrl : "" + baseUrl + "/";

      ResourceLibrary.headers = options.headers;

      ResourceLibrary["interface"] = new (options["interface"] || ActiveResource.Interfaces.JsonApi)(ResourceLibrary);

      ResourceLibrary.constantizeScope = options['constantizeScope'];

      ResourceLibrary.immutable = options.immutable;

      ResourceLibrary.includePolymorphicRepeats = options.includePolymorphicRepeats;

      ResourceLibrary.strictAttributes = options.strictAttributes;

      base = ResourceLibrary.immutable ? ActiveResource.prototype.Immutable.prototype.Base : ActiveResource.prototype.Base;

      resourceLibrary = ResourceLibrary;

      ResourceLibrary.Base = Base = (function(_super) {
        __extends(Base, _super);

        function Base() {
          _ref = Base.__super__.constructor.apply(this, arguments);
          return _ref;
        }

        Base.resourceLibrary = resourceLibrary;

        return Base;

      })(base);

      ResourceLibrary.constantize = function(className) {
        var klass, scope, v, _i, _len;
        klass = null;
        if (!_.isUndefined(className) && !_.isNull(className)) {
          scope = this.constantizeScope && _.values(this.constantizeScope) || _.flatten([_.values(this), _.values(this.prototype)]);
          for (_i = 0, _len = scope.length; _i < _len; _i++) {
            v = scope[_i];
            if (_.isObject(v) && v.className === className) {
              klass = v;
            }
          }
        }
        if (klass == null) {
          throw "NameError: klass " + className + " does not exist";
        }
        return klass;
      };

      return ResourceLibrary;

    }).call(this);
  };

}).call(this);

(function() {
  ActiveResource.Interfaces = ActiveResource.prototype.Interfaces = (function() {
    function Interfaces() {}

    Interfaces.prototype.Base = (function() {
      Base.contentType = 'application/json';

      function Base(resourceLibrary) {
        var _this = this;
        this.resourceLibrary = resourceLibrary;
        this.axios = axios.create({
          headers: _.extend(this.resourceLibrary.headers || {}, {
            'Content-Type': this.constructor.contentType
          })
        });
        this.axios.interceptors.response.use(function(config) {
          return config;
        }, function(error) {
          if (error.response.status === 408 || error.code === 'ECONNABORTED') {
            return Promise.reject({
              response: {
                data: {
                  errors: [
                    {
                      code: 'timeout',
                      detail: "Timeout occurred while loading " + error.config.url
                    }
                  ]
                }
              }
            });
          } else {
            return Promise.reject(error);
          }
        });
      }

      Base.prototype.request = function(url, method, data) {
        var options;
        options = {
          responseType: 'json',
          method: method,
          url: url
        };
        if (method === 'GET') {
          options.params = data;
          options.paramsSerializer = function(params) {
            return Qs.stringify(params, {
              arrayFormat: 'brackets'
            });
          };
        } else {
          options.data = data;
        }
        return this.axios.request(options);
      };

      Base.prototype.get = function(url, queryParams) {
        throw '#get not implemented on base interface';
      };

      Base.prototype.post = function(url, resourceData, options) {
        throw '#post not implemented on base interface';
      };

      Base.prototype.patch = function(url, resourceData, options) {
        throw '#patch not implemented on base interface';
      };

      Base.prototype.put = function(url, resourceData, options) {
        throw '#put not implemented on base interface';
      };

      Base.prototype["delete"] = function(url, resourceData, options) {
        throw '#delete not implemented on base interface';
      };

      return Base;

    })();

    return Interfaces;

  }).call(this);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  ActiveResource.Interfaces.JsonApi = ActiveResource.prototype.Interfaces.prototype.JsonApi = (function(_super) {
    __extends(JsonApi, _super);

    function JsonApi() {
      _ref = JsonApi.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    JsonApi.contentType = 'application/vnd.api+json';

    JsonApi.prototype.request = function(url, method, data) {
      return JsonApi.__super__.request.apply(this, arguments).then(function(response) {
        var _ref1;
        if (!((((_ref1 = response.data) != null ? _ref1.data : void 0) != null) || response.status === 204)) {
          throw "Response from " + url + " was not in JSON API format";
        }
        return response.data;
      });
    };

    JsonApi.prototype.toUnderscored = function(object) {
      var k, underscored, v,
        _this = this;
      underscored = {};
      for (k in object) {
        v = object[k];
        underscored[s.underscored(k)] = _.isArray(v) ? _.map(v, function(i) {
          return _this.toUnderscored(i);
        }) : _.isObject(v) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Base) : void 0) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Collection) : void 0) && !_.isDate(v) ? this.toUnderscored(v) : v;
      }
      return underscored;
    };

    JsonApi.prototype.toCamelCase = function(object) {
      var camelized, k, v,
        _this = this;
      camelized = {};
      for (k in object) {
        v = object[k];
        camelized[s.camelize(k)] = _.isArray(v) ? _.map(v, function(i) {
          if (_.isObject(i)) {
            return _this.toCamelCase(i);
          } else {
            return i;
          }
        }) : _.isObject(v) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Base) : void 0) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Collection) : void 0) ? this.toCamelCase(v) : v;
      }
      return camelized;
    };

    JsonApi.prototype.buildSparseFieldset = function(fields) {
      return _.mapObject(fields, function(fieldArray) {
        return _.map(fieldArray, function(f) {
          return s.underscored(f);
        }).join();
      });
    };

    JsonApi.prototype.buildIncludeTree = function(includes) {
      var buildNestedIncludes;
      buildNestedIncludes = function(object) {
        var includeCollection, modelName, value;
        modelName = s.underscored(_.keys(object)[0]);
        value = _.values(object)[0];
        includeCollection = ActiveResource.prototype.Collection.build([value]).flatten().map(function(item) {
          if (_.isString(item)) {
            return _.map(item.split(','), function(i) {
              return s.underscored(i);
            });
          } else if (_.isObject(item)) {
            return buildNestedIncludes(item);
          }
        }).flatten();
        return includeCollection.map(function(i) {
          return "" + modelName + "." + i;
        }).toArray();
      };
      return ActiveResource.prototype.Collection.build(includes).inject([], function(includeStrArray, include) {
        if (_.isObject(include)) {
          includeStrArray.push.apply(includeStrArray, buildNestedIncludes(include));
          return includeStrArray;
        } else {
          includeStrArray.push(s.underscored(include));
          return includeStrArray;
        }
      }).join();
    };

    JsonApi.prototype.buildSortList = function(sortObject) {
      var column, dir, output;
      output = [];
      for (column in sortObject) {
        dir = sortObject[column];
        if (dir === 'asc') {
          output.push(s.underscored(column));
        } else if (dir === 'desc') {
          output.push("-" + (s.underscored(column)));
        }
      }
      return output.join(',');
    };

    JsonApi.prototype.buildResourceIdentifier = function(resource) {
      var identifier, primaryKeyValue;
      identifier = {
        type: resource.klass().queryName
      };
      if ((primaryKeyValue = resource[resource.klass().primaryKey])) {
        identifier[resource.klass().primaryKey] = primaryKeyValue.toString();
      }
      return identifier;
    };

    JsonApi.prototype.buildResourceRelationships = function(resource, relationships, onlyChanged) {
      var output,
        _this = this;
      if (onlyChanged == null) {
        onlyChanged = false;
      }
      output = {};
      _.each(relationships, function(relationship) {
        var reflection, target;
        reflection = resource.klass().reflectOnAssociation(relationship);
        target = resource.association(reflection.name).target;
        if (!onlyChanged && ((reflection.collection() && target.empty()) || (target == null))) {
          return;
        }
        return output[s.underscored(reflection.name)] = {
          data: _this.buildResourceDocument({
            resourceData: target,
            onlyResourceIdentifiers: !reflection.autosave(),
            onlyChanged: onlyChanged,
            parentReflection: reflection.polymorphic() ? reflection.polymorphicInverseOf(target.klass()) : reflection.inverseOf()
          })
        };
      });
      return output;
    };

    JsonApi.prototype.buildResourceDocument = function(_arg) {
      var data, onlyChanged, onlyResourceIdentifiers, parentReflection, resourceData,
        _this = this;
      resourceData = _arg.resourceData, onlyResourceIdentifiers = _arg.onlyResourceIdentifiers, onlyChanged = _arg.onlyChanged, parentReflection = _arg.parentReflection;
      onlyResourceIdentifiers = onlyResourceIdentifiers || false;
      onlyChanged = onlyChanged || false;
      data = ActiveResource.prototype.Collection.build(resourceData).compact().map(function(resource) {
        var attributes, changedFields, documentResource, relationships;
        documentResource = _this.buildResourceIdentifier(resource);
        if (!onlyResourceIdentifiers) {
          attributes = _.omit(resource.attributes({
            readWrite: true
          }), resource.klass().primaryKey);
          relationships = _.keys(resource.klass().reflections());
          if (parentReflection) {
            if (!(parentReflection.polymorphic() && _this.resourceLibrary.includePolymorphicRepeats)) {
              relationships = _.without(relationships, parentReflection.name);
            }
          }
          if (onlyChanged) {
            changedFields = resource.changedFields().toArray();
            attributes = _.pick.apply(_, [attributes].concat(__slice.call(changedFields)));
            relationships = _.intersection(relationships, changedFields);
          }
          documentResource['attributes'] = _this.toUnderscored(attributes);
          documentResource['relationships'] = _this.buildResourceRelationships(resource, relationships, onlyChanged);
        }
        return documentResource;
      });
      if (_.isArray(resourceData) || (_.isObject(resourceData) && (typeof resourceData.isA === "function" ? resourceData.isA(ActiveResource.prototype.Collection) : void 0))) {
        return data.toArray();
      } else {
        return data.first() || null;
      }
    };

    JsonApi.prototype.buildResource = function(data, includes, _arg) {
      var attributes, existingResource, parentRelationship, resource;
      existingResource = _arg.existingResource, parentRelationship = _arg.parentRelationship;
      resource = existingResource || this.resourceLibrary.constantize(_.singularize(s.classify(data['type']))).build();
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
      resource.klass().reflectOnAllAssociations().each(function(reflection) {
        var association, relationship, relationshipEmpty, relationshipLinks, selfLink, url_safe_reflection_name, _ref1, _ref2, _ref3, _ref4,
          _this = this;
        association = resource.association(reflection.name);
        if ((relationshipLinks = (_ref1 = data['relationships']) != null ? (_ref2 = _ref1[s.underscored(reflection.name)]) != null ? _ref2['links'] : void 0 : void 0) != null) {
          association.__links = _.extend(association.links(), _.mapObject(relationshipLinks, function(l) {
            return ActiveResource.prototype.Links.__constructLink(l);
          }));
        } else if ((selfLink = resource.links()['self']) != null) {
          url_safe_reflection_name = s.underscored(reflection.name);
          association.__links = {
            self: ActiveResource.prototype.Links.__constructLink(selfLink, 'relationships', url_safe_reflection_name),
            related: ActiveResource.prototype.Links.__constructLink(selfLink, url_safe_reflection_name)
          };
        }
        relationshipEmpty = _.isObject(relationship = (_ref3 = data['relationships']) != null ? (_ref4 = _ref3[s.underscored(reflection.name)]) != null ? _ref4['data'] : void 0 : void 0) ? _.keys(relationship).length === 0 : relationship != null ? relationship.length === 0 : true;
        if (_.has(attributes, reflection.name) || relationshipEmpty) {
          return association.loaded(true);
        }
      });
      resource.__executeCallbacks('afterRequest');
      return resource;
    };

    JsonApi.prototype.addRelationshipsToFields = function(attributes, relationships, includes, resource) {
      var _this = this;
      _.each(relationships, function(relationship, relationshipName) {
        var include, reflection, relationshipItems;
        if ((reflection = resource.klass().reflectOnAssociation(s.camelize(relationshipName)))) {
          if (reflection.collection()) {
            relationshipItems = ActiveResource.prototype.Collection.build(relationship['data']).map(function(relationshipMember, index) {
              return _this.findResourceForRelationship(relationshipMember, includes, resource, reflection, index);
            }).compact();
            if (!(typeof relationshipItems.empty === "function" ? relationshipItems.empty() : void 0)) {
              return attributes[relationshipName] = relationshipItems;
            }
          } else if (relationship['data'] != null) {
            include = _this.findResourceForRelationship(relationship['data'], includes, resource, reflection);
            if (include != null) {
              return attributes[relationshipName] = include;
            }
          }
        }
      });
      return attributes;
    };

    JsonApi.prototype.findResourceForRelationship = function(relationshipData, includes, resource, reflection, index) {
      var buildResourceOptions, findConditions, include, parentReflection, potentialTarget, primaryKey, target,
        _this = this;
      primaryKey = resource.klass().primaryKey;
      findConditions = {
        type: relationshipData.type
      };
      findConditions[primaryKey] = relationshipData[primaryKey];
      buildResourceOptions = {};
      if ((parentReflection = reflection.inverseOf()) != null) {
        buildResourceOptions.parentRelationship = {};
        buildResourceOptions.parentRelationship[parentReflection.name] = resource;
      }
      include = _.findWhere(includes, findConditions);
      if (reflection.collection()) {
        target = resource.association(reflection.name).target.detect(function(t) {
          return t[primaryKey] === findConditions[primaryKey];
        }) || resource.association(reflection.name).target.get(index);
      } else if ((potentialTarget = resource.association(reflection.name).target) != null) {
        if (!reflection.polymorphic() || potentialTarget.klass().queryName === findConditions['type']) {
          target = potentialTarget;
        }
      }
      if (target != null) {
        buildResourceOptions.existingResource = target;
      }
      if ((target != null) || (include != null)) {
        return this.buildResource(include || {}, includes, buildResourceOptions);
      }
    };

    JsonApi.prototype.mergePersistedChanges = function(response, resource) {
      return this.buildResource(response['data'], response['included'], {
        existingResource: resource
      });
    };

    JsonApi.prototype.resourceErrors = function(resource, errors) {
      var errorCollection;
      errorCollection = ActiveResource.Collection.build(errors).map(function(error) {
        var field;
        field = [];
        if (error['source']['pointer'] === '/data') {
          field.push('base');
        } else {
          _.each(error['source']['pointer'].split('/data'), function(i) {
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
    };

    JsonApi.prototype.parameterErrors = function(errors) {
      return ActiveResource.prototype.Collection.build(errors).map(function(error) {
        var out, _ref1;
        out = {
          detail: error['detail'],
          message: error['detail']
        };
        if (((_ref1 = error['source']) != null ? _ref1['parameter'] : void 0) != null) {
          out['parameter'] = s.camelize(error['source']['parameter']);
        }
        out['code'] = s.camelize(error['code']);
        return out;
      });
    };

    JsonApi.prototype.get = function(url, queryParams) {
      var data, _this;
      if (queryParams == null) {
        queryParams = {};
      }
      data = {};
      if (queryParams['filter'] != null) {
        data['filter'] = this.toUnderscored(queryParams['filter']);
      }
      if (queryParams['fields'] != null) {
        data['fields'] = this.buildSparseFieldset(queryParams['fields']);
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
      return this.request(url, 'GET', data).then(function(response) {
        var built;
        built = ActiveResource.prototype.CollectionResponse.build(_.flatten([response.data])).map(function(object) {
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
      }, function(errors) {
        return Promise.reject(_this.parameterErrors(errors.response.data['errors']));
      });
    };

    JsonApi.prototype.post = function(url, resourceData, options) {
      var data, queryParams, _this;
      if (options == null) {
        options = {};
      }
      data = {
        data: this.buildResourceDocument({
          resourceData: resourceData,
          onlyResourceIdentifiers: options['onlyResourceIdentifiers']
        })
      };
      if (!options['onlyResourceIdentifiers']) {
        queryParams = resourceData.queryParams();
        if (queryParams['fields'] != null) {
          data['fields'] = this.buildSparseFieldset(queryParams['fields']);
        }
        if (queryParams['include'] != null) {
          data['include'] = this.buildIncludeTree(queryParams['include']);
        }
      }
      _this = this;
      return this.request(url, 'POST', data).then(function(response) {
        if (options['onlyResourceIdentifiers']) {
          return response;
        } else {
          return _this.mergePersistedChanges(response, resourceData);
        }
      }, function(errors) {
        if (options['onlyResourceIdentifiers']) {
          return Promise.reject(errors);
        } else {
          return Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']));
        }
      });
    };

    JsonApi.prototype.patch = function(url, resourceData, options) {
      var data, queryParams, _this;
      if (options == null) {
        options = {};
      }
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
          data['fields'] = this.buildSparseFieldset(queryParams['fields']);
        }
        if (queryParams['include'] != null) {
          data['include'] = this.buildIncludeTree(queryParams['include']);
        }
      }
      _this = this;
      return this.request(url, 'PATCH', data).then(function(response) {
        if (options['onlyResourceIdentifiers']) {
          return response;
        } else {
          return _this.mergePersistedChanges(response, resourceData);
        }
      }, function(errors) {
        if (options['onlyResourceIdentifiers']) {
          return Promise.reject(errors);
        } else {
          return Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']));
        }
      });
    };

    JsonApi.prototype.put = function(url, resourceData, options) {
      var data, queryParams, _this;
      if (options == null) {
        options = {};
      }
      data = {
        data: this.buildResourceDocument({
          resourceData: resourceData,
          onlyResourceIdentifiers: options['onlyResourceIdentifiers']
        })
      };
      if (!options['onlyResourceIdentifiers']) {
        queryParams = resourceData.queryParams();
        if (queryParams['fields'] != null) {
          data['fields'] = this.buildSparseFieldset(queryParams['fields']);
        }
        if (queryParams['include'] != null) {
          data['include'] = this.buildIncludeTree(queryParams['include']);
        }
      }
      _this = this;
      return this.request(url, 'PUT', data).then(function(response) {
        if (options['onlyResourceIdentifiers']) {
          return response;
        } else {
          return _this.mergePersistedChanges(response, resourceData);
        }
      }, function(errors) {
        if (options['onlyResourceIdentifiers']) {
          return Promise.reject(errors);
        } else {
          return Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']));
        }
      });
    };

    JsonApi.prototype["delete"] = function(url, resourceData, options) {
      var data, _this;
      if (options == null) {
        options = {};
      }
      data = resourceData != null ? {
        data: this.buildResourceDocument({
          resourceData: resourceData,
          onlyResourceIdentifiers: true
        })
      } : {};
      _this = this;
      return this.request(url, 'DELETE', data).then(null, function(errors) {
        if (errors.response.data) {
          return Promise.reject(_this.parameterErrors(errors.response.data['errors']));
        } else {
          return Promise.reject(null);
        }
      });
    };

    return JsonApi;

  })(ActiveResource.prototype.Interfaces.prototype.Base);

}).call(this);

(function() {
  ActiveResource.prototype.Associations = (function() {
    function Associations() {}

    Associations.prototype.association = function(name) {
      var association, reflection;
      this.__associations || (this.__associations = {});
      if ((association = this.__associations[name]) == null) {
        if ((reflection = this.klass().reflectOnAssociation(name)) == null) {
          throw "Association " + name + " does not exist";
        }
        association = new (reflection.associationClass())(this, reflection);
        this.__associations[name] = association;
      }
      return association;
    };

    Associations.hasMany = function(name, options) {
      var reflection;
      if (options == null) {
        options = {};
      }
      reflection = ActiveResource.prototype.Associations.prototype.Builder.prototype.HasMany.build(this, name, options);
      return ActiveResource.prototype.Reflection.addReflection(this, name, reflection);
    };

    Associations.hasOne = function(name, options) {
      var reflection;
      if (options == null) {
        options = {};
      }
      reflection = ActiveResource.prototype.Associations.prototype.Builder.prototype.HasOne.build(this, name, options);
      return ActiveResource.prototype.Reflection.addReflection(this, name, reflection);
    };

    Associations.belongsTo = function(name, options) {
      var reflection;
      if (options == null) {
        options = {};
      }
      reflection = ActiveResource.prototype.Associations.prototype.Builder.prototype.BelongsTo.build(this, name, options);
      return ActiveResource.prototype.Reflection.addReflection(this, name, reflection);
    };

    return Associations;

  })();

}).call(this);

(function() {
  var __slice = [].slice;

  ActiveResource.prototype.Attributes = (function() {
    function Attributes() {}

    Attributes.prototype.attributes = function() {
      var attributes, options, _ref, _ref1, _ref2;
      attributes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
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
        (_ref = this.__attributes.read).push.apply(_ref, attributes);
      } else {
        (_ref1 = this.__attributes.readWrite).push.apply(_ref1, attributes);
      }
      (_ref2 = this.__attributes.all).push.apply(_ref2, attributes);
      return this.__attributes;
    };

    Attributes.hasAttribute = function(attribute) {
      return this.__readAttribute(attribute) != null;
    };

    Attributes.assignAttributes = function(attributes) {
      return this.__assignAttributes(attributes);
    };

    Attributes.attributes = function(options) {
      var k, output, v;
      if (options == null) {
        options = {};
      }
      output = {};
      for (k in this) {
        v = this[k];
        if (this.__validAttribute(k, v, options)) {
          output[k] = v;
        }
      }
      return output;
    };

    Attributes.reload = function() {
      var resource, url, _ref;
      if (!(this.persisted() || ((_ref = this.id) != null ? _ref.toString().length : void 0) > 0)) {
        throw 'Cannot reload a resource that is not persisted or has an ID';
      }
      resource = this;
      url = this.links()['self'] || (ActiveResource.prototype.Links.__constructLink(this.links()['related'], this.id.toString()));
      return this["interface"]().get(url, this.queryParams()).then(function(reloaded) {
        resource.__assignFields(reloaded.attributes());
        resource.klass().reflectOnAllAssociations().each(function(reflection) {
          var target;
          target = reloaded.association(reflection.name).reader();
          if (typeof reflection.collection === "function" ? reflection.collection() : void 0) {
            target = target.toArray();
          }
          return resource.association(reflection.name).writer(target, false);
        });
        return resource;
      });
    };

    Attributes.__assignAttributes = function(attributes) {
      var k, v, _base;
      for (k in attributes) {
        v = attributes[k];
        try {
          if (typeof (_base = this.association(k).reflection).collection === "function" ? _base.collection() : void 0) {
            this[k]().assign(v, false);
          } else {
            this["assign" + (s.capitalize(k))](v);
          }
        } catch (_error) {
          this[k] = v;
        }
      }
      return null;
    };

    Attributes.__readAttribute = function(attribute) {
      return this.attributes()[attribute];
    };

    Attributes.__validAttribute = function(attribute, value, options) {
      var e, reserved;
      reserved = ['__associations', '__errors', '__fields', '__links', '__queryParams'];
      if (this.klass().resourceLibrary.strictAttributes) {
        if (options.readOnly) {
          return this.klass().attributes().read.include(attribute);
        } else if (options.readWrite) {
          return this.klass().attributes().readWrite.include(attribute);
        } else {
          return this.klass().attributes().all.include(attribute);
        }
      } else {
        return !_.isFunction(value) && !_.contains(reserved, attribute) && (function() {
          try {
            return this.association(attribute) == null;
          } catch (_error) {
            e = _error;
            return true;
          }
        }).call(this);
      }
    };

    return Attributes;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Callbacks = (function() {
    function Callbacks() {}

    Callbacks.prototype.callbacks = function() {
      return this.__callbacks || (this.__callbacks = {
        afterBuild: ActiveResource.prototype.Collection.build(),
        afterRequest: ActiveResource.prototype.Collection.build()
      });
    };

    Callbacks.prototype.afterBuild = function(func) {
      return this.callbacks()['afterBuild'].push(func);
    };

    Callbacks.prototype.afterRequest = function(func) {
      return this.callbacks()['afterRequest'].push(func);
    };

    Callbacks.__executeCallbacks = function(type) {
      var _this = this;
      return this.klass().callbacks()[type].each(function(callback) {
        return _.bind(callback, _this)();
      });
    };

    return Callbacks;

  })();

}).call(this);

(function() {
  var __slice = [].slice;

  ActiveResource.Collection = ActiveResource.prototype.Collection = (function() {
    ActiveResource.include(Collection, ActiveResource.prototype.Typing);

    Collection.build = function(array) {
      if (array == null) {
        array = [];
      }
      if (typeof array.isA === "function" ? array.isA(this) : void 0) {
        return array.clone();
      } else if (array.length != null) {
        return new this(array);
      } else {
        return new this([array]);
      }
    };

    function Collection(__collection) {
      this.__collection = __collection != null ? __collection : [];
    }

    Collection.prototype.size = function() {
      return _.size(this.__collection);
    };

    Collection.prototype.empty = function() {
      return this.size() === 0;
    };

    Collection.prototype.include = function(item) {
      return this.indexOf(item) >= 0;
    };

    Collection.prototype.indexOf = function(item) {
      return _.indexOf(this.__collection, item);
    };

    Collection.prototype.get = function(index) {
      if (!(index >= this.size())) {
        return this.__collection[index];
      }
    };

    Collection.prototype.set = function(index, item) {
      if (!(index >= this.size())) {
        return this.__collection[index] = item;
      }
    };

    Collection.prototype.replace = function(original, next) {
      var index;
      if ((index = this.indexOf(original)) > -1) {
        this.set(index, next);
      }
      return next;
    };

    Collection.prototype.toArray = function() {
      return this.__collection;
    };

    Collection.prototype.all = function() {
      return this.toArray();
    };

    Collection.prototype.first = function(n) {
      var output;
      output = _.first(this.__collection, n || 1);
      if (n) {
        return output;
      } else {
        return output[0];
      }
    };

    Collection.prototype.last = function(n) {
      var output;
      output = _.last(this.__collection, n || 1);
      if (n) {
        return output;
      } else {
        return output[0];
      }
    };

    Collection.prototype.each = function(iteratee) {
      return _.each(this.__collection, iteratee);
    };

    Collection.prototype.inject = function(memo, iteratee) {
      return _.reduce(this.__collection, iteratee, memo);
    };

    Collection.prototype.map = function(iteratee) {
      return this.constructor.build(_.map(this.__collection, iteratee));
    };

    Collection.prototype.compact = function(iteratee) {
      return this.constructor.build(_.without(this.__collection, null, void 0));
    };

    Collection.prototype.join = function(separator) {
      if (separator == null) {
        separator = ',';
      }
      return s.join.apply(s, [separator].concat(__slice.call(_.map(this.__collection, function(i) {
        return i.toString();
      }))));
    };

    Collection.prototype.flatten = function() {
      return this.constructor.build(_.flatten(this.__collection));
    };

    Collection.prototype.push = function() {
      var items, _ref;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.__collection).push.apply(_ref, items);
    };

    Collection.prototype.unshift = function() {
      var items, _ref;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.__collection).unshift.apply(_ref, items);
    };

    Collection.prototype.pop = function() {
      return this.__collection.pop();
    };

    Collection.prototype.shift = function() {
      return this.__collection.shift();
    };

    Collection.prototype["delete"] = function() {
      var deleted, items;
      items = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      deleted = _.intersection(this.__collection, items);
      this.__collection = _.without.apply(_, [this.__collection].concat(__slice.call(items)));
      return deleted;
    };

    Collection.prototype.clear = function() {
      return this.__collection = [];
    };

    Collection.prototype.select = function(predicate) {
      return this.constructor.build(_.filter(this.__collection, predicate));
    };

    Collection.prototype.detect = function(predicate) {
      return _.detect(this.__collection, predicate);
    };

    Collection.prototype.clone = function() {
      var _this = this;
      return this.constructor.build(_.map(this.__collection, function(i) {
        return i;
      }));
    };

    return Collection;

  })();

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.CollectionResponse = ActiveResource.prototype.CollectionResponse = (function(_super) {
    __extends(CollectionResponse, _super);

    function CollectionResponse() {
      _ref = CollectionResponse.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CollectionResponse.build = function(array) {
      if (array == null) {
        array = [];
      }
      if (typeof array.isA === "function" ? array.isA(ActiveResource.prototype.Collection) : void 0) {
        return new this(array.toArray());
      } else {
        return CollectionResponse.__super__.constructor.build.apply(this, arguments);
      }
    };

    CollectionResponse.prototype.links = function(data) {
      if (data == null) {
        data = {};
      }
      if (!_.isEmpty(data) || (this.__links == null)) {
        this.__links = data;
      }
      return this.__links;
    };

    CollectionResponse.prototype.hasPrevPage = function() {
      return this.links()['prev'] != null;
    };

    CollectionResponse.prototype.hasNextPage = function() {
      return this.links()['next'] != null;
    };

    CollectionResponse.prototype.prevPage = function() {
      if (this.hasPrevPage()) {
        return this.first().klass().resourceLibrary["interface"].get(this.links()['prev']);
      }
    };

    CollectionResponse.prototype.nextPage = function() {
      if (this.hasNextPage()) {
        return this.first().klass().resourceLibrary["interface"].get(this.links()['next']);
      }
    };

    CollectionResponse.prototype.toCollection = function() {
      return ActiveResource.prototype.Collection.build(this.toArray());
    };

    return CollectionResponse;

  })(ActiveResource.prototype.Collection);

}).call(this);

(function() {
  var __slice = [].slice;

  ActiveResource.Errors = ActiveResource.prototype.Errors = (function() {
    Errors.errors = function() {
      return this.__errors || (this.__errors = new ActiveResource.prototype.Errors(this));
    };

    Errors.valid = function() {
      return this.errors().empty();
    };

    function Errors(base) {
      this.base = base;
      this.reset();
    }

    Errors.prototype.reset = function() {
      return this.__errors = {};
    };

    Errors.prototype.clear = function() {
      return this.reset();
    };

    Errors.prototype.add = function(field, code, detail) {
      if (detail == null) {
        detail = '';
      }
      return this.__add(field, code, detail);
    };

    Errors.prototype.addAll = function() {
      var errors,
        _this = this;
      errors = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return _.map(errors, function(error) {
        return _this.__add.apply(_this, error);
      });
    };

    Errors.prototype.propagate = function(errors) {
      var _this = this;
      return errors.each(function(error) {
        var association, field, nestedError, nestedErrors, nestedField, _ref, _ref1;
        nestedField = error.field.split('.');
        field = nestedField.shift();
        try {
          association = _this.base.association(field);
          nestedError = _.clone(error);
          nestedError.field = nestedField.length === 0 && 'base' || nestedField.join('.');
          nestedErrors = ActiveResource.Collection.build([nestedError]);
          if (association.reflection.collection()) {
            return (_ref = association.target.first()) != null ? _ref.errors().propagate(nestedErrors) : void 0;
          } else {
            return (_ref1 = association.target) != null ? _ref1.errors().propagate(nestedErrors) : void 0;
          }
        } catch (_error) {
          return _this.push(error);
        }
      });
    };

    Errors.prototype.push = function(error) {
      var _base, _name;
      (_base = this.__errors)[_name = error.field] || (_base[_name] = []);
      this.__errors[error.field].push(error);
      return error;
    };

    Errors.prototype.added = function(field, code) {
      return ActiveResource.prototype.Collection.build(this.__errors[field]).detect(function(e) {
        return e.code === code;
      }) != null;
    };

    Errors.prototype.include = function(field) {
      return (this.__errors[field] != null) && _.size(this.__errors[field]) > 0;
    };

    Errors.prototype.empty = function() {
      return this.size() === 0;
    };

    Errors.prototype.size = function() {
      return _.size(this.toArray());
    };

    Errors.prototype["delete"] = function(field) {
      return this.__errors[field] = [];
    };

    Errors.prototype.each = function(iterator) {
      return _.each(this.__errors, function(errors, field) {
        var error, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = errors.length; _i < _len; _i++) {
          error = errors[_i];
          _results.push(iterator(field, error));
        }
        return _results;
      });
    };

    Errors.prototype.forField = function(field) {
      var _this = this;
      return ActiveResource.prototype.Collection.build(_.keys(this.__errors)).select(function(k) {
        return s.startsWith(k, field);
      }).map(function(k) {
        return _this.__errors[k];
      }).flatten();
    };

    Errors.prototype.detailsForField = function(field) {
      return this.forField(field).inject({}, function(out, error) {
        out[error.code] = error.detail;
        return out;
      });
    };

    Errors.prototype.forBase = function() {
      return this.forField('base');
    };

    Errors.prototype.toArray = function() {
      var errors, field, output, _ref;
      output = [];
      _ref = this.__errors;
      for (field in _ref) {
        errors = _ref[field];
        output.push.apply(output, errors);
      }
      return output;
    };

    Errors.prototype.toCollection = function() {
      return ActiveResource.prototype.Collection.build(this.toArray());
    };

    Errors.prototype.__add = function(field, code, detail) {
      var error, _base;
      if (detail == null) {
        detail = '';
      }
      (_base = this.__errors)[field] || (_base[field] = []);
      this.__errors[field].push(error = this.__buildError(field, code, detail));
      return error;
    };

    Errors.prototype.__buildError = function(field, code, detail) {
      return {
        field: field,
        code: code,
        detail: detail,
        message: detail
      };
    };

    return Errors;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Fields = (function() {
    function Fields() {}

    Fields.prototype.fields = function() {
      var attributes, output;
      attributes = this.attributes();
      output = ActiveResource.prototype.Collection.build(attributes.all);
      output.push.apply(output, attributes.read.toArray());
      output.push.apply(output, _.keys(this.reflections()));
      return output;
    };

    Fields.__initializeFields = function() {
      var _this = this;
      this.__fields = {};
      return this.klass().fields().each(function(field) {
        var _ref;
        if ((_ref = _this.klass().reflectOnAssociation(field)) != null ? _ref.collection() : void 0) {
          return _this.__fields[field] = ActiveResource.prototype.Collection.build();
        } else {
          return _this.__fields[field] = null;
        }
      });
    };

    Fields.__assignFields = function(fields) {
      var _this = this;
      _.each(fields, function(v, k) {
        if (!_.has(_this.__fields, k)) {
          return;
        }
        try {
          if (_this.association(k).reflection.collection()) {
            return _this.__fields[k] = ActiveResource.prototype.Collection.build(v);
          } else {
            return _this.__fields[k] = v;
          }
        } catch (_error) {
          return _this.__fields[k] = v;
        }
      });
      return this.__assignAttributes(fields);
    };

    Fields.changed = function() {
      return !this.changedFields().empty();
    };

    Fields.changedFields = function() {
      var _this = this;
      return this.klass().fields().select(function(field) {
        var association, newField, newTargets, oldField;
        oldField = _this.__fields[field];
        newField = _this[field];
        try {
          association = _this.association(field);
          newField = _this[field]();
          if (association.reflection.collection()) {
            if (oldField.size() !== newField.size()) {
              return true;
            }
            newTargets = newField.target().select(function(t) {
              return !oldField.include(t) || (association.reflection.autosave() && t.changed());
            });
            return !newTargets.empty();
          } else {
            return oldField != newField || association.reflection.autosave() && newField.changed();
          }
        } catch (_error) {
          return oldField != newField && !_.isUndefined(newField);
        }
      });
    };

    return Fields;

  })();

}).call(this);

(function() {
  var __slice = [].slice;

  ActiveResource.Links = ActiveResource.prototype.Links = (function() {
    function Links() {}

    Links.prototype.links = function() {
      return this.__links || (this.__links = _.clone(this.klass().links()));
    };

    Links.links = function() {
      if (this.resourceLibrary.baseUrl == null) {
        throw 'baseUrl is not set';
      }
      if (this.queryName == null) {
        throw 'queryName is not set';
      }
      return this.__links || (this.__links = {
        related: this.resourceLibrary.baseUrl + this.queryName + '/'
      });
    };

    Links.__constructLink = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return _.map(args, function(str) {
        if (s.endsWith(str, '/')) {
          return str;
        } else {
          return str + '/';
        }
      }).join('');
    };

    return Links;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Persistence = (function() {
    function Persistence() {}

    Persistence.persisted = function() {
      return this.links()['self'] != null;
    };

    Persistence.newResource = function() {
      return !this.persisted();
    };

    Persistence.save = function(callback) {
      return this.__createOrUpdate().then(callback, callback);
    };

    Persistence.update = function(attributes, callback) {
      var attributesKeys, oldAttributes,
        _this = this;
      attributesKeys = ActiveResource.prototype.Collection.build(_.keys(attributes));
      oldAttributes = _.pick(this.attributes(), attributesKeys.toArray());
      oldAttributes = _.defaults(oldAttributes, attributesKeys.inject({}, function(obj, k) {
        obj[k] = null;
        return obj;
      }));
      this.__assignAttributes(attributes);
      return this.__createOrUpdate().then(null, function(resource) {
        resource.__assignAttributes(oldAttributes);
        return resource;
      }).then(callback, callback);
    };

    Persistence.destroy = function() {
      var resource;
      return this.klass().resourceLibrary["interface"]["delete"](this.links()['self'], (resource = this)).then(function() {
        resource.__links = {};
        return resource;
      });
    };

    Persistence.__createOrUpdate = function() {
      this.errors().reset();
      if (this.persisted()) {
        return this.klass().resourceLibrary["interface"].patch(this.links()['self'], this);
      } else {
        return this.klass().resourceLibrary["interface"].post(this.links()['related'], this);
      }
    };

    return Persistence;

  })();

}).call(this);

(function() {
  var __slice = [].slice;

  ActiveResource.prototype.QueryParams = (function() {
    var COLLECTION_RELATED, RESOURCE_RELATED;

    function QueryParams() {}

    RESOURCE_RELATED = ['fields', 'include'];

    COLLECTION_RELATED = ['filter', 'sort', 'page'];

    QueryParams.queryParams = function() {
      return this.__queryParams || (this.__queryParams = (typeof this.isA === "function" ? this.isA(ActiveResource.prototype.Base) : void 0) ? _.clone(this.klass().queryParams()) : {});
    };

    QueryParams.queryParamsForReflection = function(reflection) {
      var includes, queryParams, _ref;
      queryParams = {};
      if (this.queryParams()['include'] != null) {
        includes = ActiveResource.prototype.Collection.build(this.queryParams()['include']).inject([], function(out, i) {
          if (_.isObject(i)) {
            _.each(_.keys(i), function(i2) {
              if (i2 === reflection.name) {
                return out.push.apply(out, _.flatten([i[i2]]));
              }
            });
          }
          return out;
        });
        if (includes.length !== 0) {
          queryParams['include'] = includes;
        }
      }
      if (!(typeof reflection.polymorphic === "function" ? reflection.polymorphic() : void 0) && (((_ref = this.queryParams()['fields']) != null ? _ref[reflection.klass().queryName] : void 0) != null)) {
        queryParams['fields'] = _.pick(this.queryParams()['fields'], reflection.klass().queryName);
      }
      return queryParams;
    };

    QueryParams.assignQueryParams = function(queryParams) {
      return this.__queryParams = queryParams;
    };

    QueryParams.assignResourceRelatedQueryParams = function(queryParams) {
      return this.assignQueryParams(_.pick.apply(_, [queryParams].concat(__slice.call(RESOURCE_RELATED))));
    };

    QueryParams.resetQueryParams = function() {
      return this.__queryParams = {};
    };

    QueryParams.__resourceRelatedParams = function() {
      return _.pick.apply(_, [this.queryParams()].concat(__slice.call(RESOURCE_RELATED)));
    };

    QueryParams.__collectionRelatedParams = function() {
      return _.pick.apply(_, [this.queryParams()].concat(__slice.call(COLLECTION_RELATED)));
    };

    QueryParams.__extendValueParam = function(param, value, queryParams) {
      queryParams || (queryParams = _.clone(this.queryParams()));
      queryParams[param] = value;
      return queryParams;
    };

    QueryParams.__extendObjectParam = function(param, options, queryParams) {
      queryParams || (queryParams = _.clone(this.queryParams()));
      queryParams[param] = _.extend(queryParams[param] || {}, options);
      return queryParams;
    };

    QueryParams.__extendArrayParam = function(param, items, queryParams) {
      var _ref;
      queryParams || (queryParams = _.clone(this.queryParams()));
      queryParams[param] = queryParams[param] ? queryParams[param].slice(0) : [];
      if (items != null) {
        (_ref = queryParams[param]).push.apply(_ref, items);
      }
      return queryParams;
    };

    return QueryParams;

  })();

}).call(this);

(function() {
  var __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.Reflection = ActiveResource.prototype.Reflection = (function() {
    var _ref, _ref1, _ref2;

    function Reflection() {}

    Reflection.prototype.reflections = function() {
      return this.__reflections || (this.__reflections = {});
    };

    Reflection.prototype.reflectOnAllAssociations = function(macro) {
      var reflections;
      if (macro == null) {
        macro = null;
      }
      reflections = ActiveResource.prototype.Collection.build(_.values(this.__reflections));
      if (macro) {
        reflections = reflections.select(function(r) {
          return r.macro === macro;
        });
      }
      return reflections;
    };

    Reflection.prototype.reflectOnAssociation = function(association) {
      return this.reflections()[association];
    };

    Reflection.prototype.reflectOnAllAutosaveAssociations = function() {
      var reflections;
      reflections = ActiveResource.prototype.Collection.build(_.values(this.__reflections));
      return reflections.select(function(r) {
        return typeof r.autosave === "function" ? r.autosave() : void 0;
      });
    };

    Reflection.create = function(macro, name, options, activeResource) {
      var klass;
      klass = (function() {
        switch (macro) {
          case 'hasMany':
            return Reflection.prototype.HasManyReflection;
          case 'hasOne':
            return Reflection.prototype.HasOneReflection;
          case 'belongsTo':
            return Reflection.prototype.BelongsToReflection;
        }
      })();
      return new klass(name, options, activeResource);
    };

    Reflection.addReflection = function(ar, name, reflection) {
      var r;
      r = {};
      r[name] = reflection;
      return ar.__reflections = _.extend(ar.__reflections || {}, r);
    };

    Reflection.prototype.AbstractReflection = (function() {
      var INVALID_AUTOMATIC_INVERSE_OPTIONS, VALID_AUTOMATIC_INVERSE_MACROS, automaticInverseOf, canFindInverseOfAutomatically, validInverseReflection;

      ActiveResource.include(AbstractReflection, ActiveResource.prototype.Typing);

      AbstractReflection.__excludeFromExtend = true;

      function AbstractReflection(name, options, activeResource) {
        this.name = name;
        this.options = options;
        this.activeResource = activeResource;
        if (this.autosave()) {
          this.activeResource.assignQueryParams(this.activeResource.__extendArrayParam('include', [this.name]));
        }
      }

      AbstractReflection.prototype.klass = function() {
        return this.activeResource.resourceLibrary.constantize(this.className());
      };

      AbstractReflection.prototype.type = function() {
        return this.__type || (this.__type = this.options['as'] && (this.options['foreignType'] || ("" + this.options['as'] + "Type")));
      };

      AbstractReflection.prototype.className = function() {
        return this.__className || (this.__className = this.options['className'] || this.__deriveClassName());
      };

      AbstractReflection.prototype.foreignKey = function() {
        return this.__foreignKey || (this.__foreignKey = this.options['foreignKey'] || this.__deriveForeignKey());
      };

      AbstractReflection.prototype.foreignType = function() {
        return this.__foreignType || (this.__foreignType = this.options['foreignType'] || ("" + this.name + "Type"));
      };

      AbstractReflection.prototype.associationPrimaryKey = function(klass) {
        return this.options['primaryKey'] || this.__primaryKey(klass || this.klass());
      };

      AbstractReflection.prototype.activeResourcePrimaryKey = function() {
        return this.__activeResourcePrimaryKey || (this.__activeResourcePrimaryKey = this.options['primaryKey'] || this.__primaryKey(this.activeResource));
      };

      AbstractReflection.prototype.collection = function() {
        return false;
      };

      AbstractReflection.prototype.hasOne = function() {
        return false;
      };

      AbstractReflection.prototype.belongsTo = function() {
        return false;
      };

      AbstractReflection.prototype.constructable = function() {
        return true;
      };

      AbstractReflection.prototype.polymorphic = function() {
        return this.options['polymorphic'] || false;
      };

      AbstractReflection.prototype.autosave = function() {
        return this.options['autosave'] || false;
      };

      AbstractReflection.prototype.buildAssociation = function() {
        return this.klass().build();
      };

      AbstractReflection.prototype.hasInverse = function() {
        return this.__inverseName() != null;
      };

      AbstractReflection.prototype.inverseOf = function() {
        if (!this.hasInverse()) {
          return;
        }
        return this.__inverseOf || (this.__inverseOf = this.klass().reflectOnAssociation(this.__inverseName()));
      };

      AbstractReflection.prototype.polymorphicInverseOf = function(associatedClass) {
        var inverseRelationship;
        if (this.hasInverse()) {
          if ((inverseRelationship = associatedClass.reflectOnAssociation(this.options['inverseOf']))) {
            return inverseRelationship;
          }
        }
      };

      AbstractReflection.prototype.__deriveClassName = function() {
        return s.classify(_.singularize(this.name));
      };

      AbstractReflection.prototype.__deriveForeignKey = function() {
        if (this.belongsTo()) {
          return "" + this.name + "Id";
        } else if (this.options['as']) {
          return "" + this.options['as'] + "Id";
        } else {
          return "" + (s.camelize(this.activeResource.className, true)) + "Id";
        }
      };

      AbstractReflection.prototype.__primaryKey = function(klass) {
        return klass.primaryKey || (function() {
          throw "Unknown primary key for " + klass.className;
        })();
      };

      AbstractReflection.prototype.__inverseName = function() {
        return this.options['inverseOf'] || (this.__automaticInverseOf === false ? null : this.__automaticInverseOf || (this.__automaticInverseOf = automaticInverseOf(this)));
      };

      automaticInverseOf = function(reflection) {
        var e, inverseName, inverseReflection;
        if (canFindInverseOfAutomatically(reflection)) {
          inverseName = s.camelize(reflection.options['as'] || reflection.activeResource.className, true);
          try {
            inverseReflection = reflection.klass().reflectOnAssociation(inverseName);
          } catch (_error) {
            e = _error;
            inverseReflection = false;
          }
          if (validInverseReflection(reflection, inverseReflection)) {
            return inverseName;
          }
        }
        return false;
      };

      VALID_AUTOMATIC_INVERSE_MACROS = ['hasMany', 'hasOne', 'belongsTo'];

      INVALID_AUTOMATIC_INVERSE_OPTIONS = ['polymorphic'];

      canFindInverseOfAutomatically = function(reflection) {
        return reflection.options['inverseOf'] !== false && _.include(VALID_AUTOMATIC_INVERSE_MACROS, reflection.macro) && _.isEmpty(_.pick.apply(_, [reflection.options].concat(__slice.call(INVALID_AUTOMATIC_INVERSE_OPTIONS))));
      };

      validInverseReflection = function(reflection, inverseReflection) {
        return (inverseReflection != null) && reflection.klass().className === inverseReflection.activeResource.className && canFindInverseOfAutomatically(inverseReflection);
      };

      return AbstractReflection;

    })();

    Reflection.prototype.HasManyReflection = (function(_super) {
      __extends(HasManyReflection, _super);

      function HasManyReflection() {
        _ref = HasManyReflection.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HasManyReflection.__excludeFromExtend = true;

      HasManyReflection.prototype.macro = 'hasMany';

      HasManyReflection.prototype.collection = function() {
        return true;
      };

      HasManyReflection.prototype.associationClass = function() {
        return ActiveResource.prototype.Associations.prototype.HasManyAssociation;
      };

      return HasManyReflection;

    })(Reflection.prototype.AbstractReflection);

    Reflection.prototype.HasOneReflection = (function(_super) {
      __extends(HasOneReflection, _super);

      function HasOneReflection() {
        _ref1 = HasOneReflection.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      HasOneReflection.__excludeFromExtend = true;

      HasOneReflection.prototype.macro = 'hasOne';

      HasOneReflection.prototype.hasOne = function() {
        return true;
      };

      HasOneReflection.prototype.associationClass = function() {
        return ActiveResource.prototype.Associations.prototype.HasOneAssociation;
      };

      return HasOneReflection;

    })(Reflection.prototype.AbstractReflection);

    Reflection.prototype.BelongsToReflection = (function(_super) {
      __extends(BelongsToReflection, _super);

      function BelongsToReflection() {
        _ref2 = BelongsToReflection.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      BelongsToReflection.__excludeFromExtend = true;

      BelongsToReflection.prototype.macro = 'belongsTo';

      BelongsToReflection.prototype.belongsTo = function() {
        return true;
      };

      BelongsToReflection.prototype.constructable = function() {
        return !this.polymorphic();
      };

      BelongsToReflection.prototype.associationClass = function() {
        if (this.polymorphic()) {
          return ActiveResource.prototype.Associations.prototype.BelongsToPolymorphicAssociation;
        } else {
          return ActiveResource.prototype.Associations.prototype.BelongsToAssociation;
        }
      };

      return BelongsToReflection;

    })(Reflection.prototype.AbstractReflection);

    return Reflection;

  }).call(this);

}).call(this);

(function() {
  var __slice = [].slice;

  ActiveResource.Relation = ActiveResource.prototype.Relation = (function() {
    ActiveResource.include(Relation, ActiveResource.prototype.QueryParams);

    ActiveResource.include(Relation, ActiveResource.prototype.Typing);

    function Relation(base, __queryParams) {
      this.base = base;
      this.__queryParams = __queryParams;
      this.queryName = this.base.queryName;
    }

    Relation.prototype.links = function() {
      return this.base.links();
    };

    Relation.prototype["interface"] = function() {
      return this.base["interface"]();
    };

    Relation.prototype.where = function(options) {
      return this.__newRelation(this.__extendObjectParam('filter', options));
    };

    Relation.prototype.order = function(args) {
      return this.__newRelation(this.__extendObjectParam('sort', args));
    };

    Relation.prototype.select = function() {
      var args, queryParams,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      queryParams = _.clone(this.queryParams());
      queryParams['fields'] || (queryParams['fields'] = {});
      ActiveResource.prototype.Collection.build(args).map(function(a) {
        var key, _i, _len, _ref, _results;
        if (_.isObject(a)) {
          _ref = _.keys(a);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            key = _ref[_i];
            _results.push(_.pick(a, key));
          }
          return _results;
        } else {
          return a;
        }
      }).flatten().each(function(arg) {
        var modelName;
        modelName = _.isObject(arg) ? _.keys(arg)[0] : _this.queryName;
        return queryParams['fields'] = _this.__extendArrayParam(modelName, _.isObject(arg) ? [_.values(arg)[0]] : [arg], queryParams['fields']);
      });
      return this.__newRelation(queryParams);
    };

    Relation.prototype.page = function(value) {
      return this.__newRelation(this.__extendObjectParam('page', {
        number: value
      }));
    };

    Relation.prototype.perPage = function(value) {
      return this.__newRelation(this.__extendObjectParam('page', {
        size: value
      }));
    };

    Relation.prototype.limit = function(value) {
      return this.__newRelation(this.__extendValueParam('limit', value));
    };

    Relation.prototype.offset = function(value) {
      return this.__newRelation(this.__extendValueParam('offset', value));
    };

    Relation.prototype.includes = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      args = ActiveResource.prototype.Collection.build(args).map(function(a) {
        var key, _i, _len, _ref, _results;
        if (_.isObject(a)) {
          _ref = _.keys(a);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            key = _ref[_i];
            _results.push(_.pick(a, key));
          }
          return _results;
        } else {
          return a;
        }
      }).flatten().toArray();
      return this.__newRelation(this.__extendArrayParam('include', args));
    };

    Relation.prototype.build = function(attributes) {
      var resource;
      if (attributes == null) {
        attributes = {};
      }
      resource = this.base != null ? new this.base() : new this();
      resource.__assignAttributes(_.extend(attributes, this.queryParams()['filter']));
      resource.assignResourceRelatedQueryParams(this.queryParams());
      resource.__executeCallbacks('afterBuild');
      return resource;
    };

    Relation.prototype.create = function(attributes, callback) {
      if (attributes == null) {
        attributes = {};
      }
      return this.build(attributes).save(callback);
    };

    Relation.prototype.find = function(primaryKey) {
      var url;
      if (primaryKey == null) {
        return;
      }
      url = ActiveResource.prototype.Links.__constructLink(this.links()['related'], primaryKey.toString());
      return this["interface"]().get(url, this.queryParams());
    };

    Relation.prototype.findBy = function(conditions) {
      return this.where(conditions).first();
    };

    Relation.prototype.all = function() {
      return this["interface"]().get(this.links()['related'], this.queryParams());
    };

    Relation.prototype.each = function(iteratee) {
      return this.all().then(function(collection) {
        collection.each(iteratee);
        return collection;
      });
    };

    Relation.prototype.first = function(n) {
      var relation;
      relation = this.queryParams()['page'] != null ? this : this.limit(n || 1);
      return relation.all().then(function(collection) {
        return collection.first(n);
      });
    };

    Relation.prototype.last = function(n) {
      var relation;
      relation = this.queryParams()['page'] != null ? this : this.offset(-(n || 1)).limit(n || 1);
      return relation.all().then(function(collection) {
        return collection.last(n);
      });
    };

    Relation.prototype.__newRelation = function(queryParams) {
      return new this.constructor(this.base, queryParams);
    };

    return Relation;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Base = (function() {
    ActiveResource.extend(Base, ActiveResource.prototype.Associations);

    ActiveResource.extend(Base, ActiveResource.prototype.Attributes.prototype);

    ActiveResource.extend(Base, ActiveResource.prototype.Callbacks.prototype);

    ActiveResource.extend(Base, ActiveResource.prototype.Fields.prototype);

    ActiveResource.extend(Base, ActiveResource.prototype.Reflection.prototype);

    ActiveResource.extend(Base, ActiveResource.prototype.Relation.prototype);

    ActiveResource.extend(Base, ActiveResource.prototype.Links);

    ActiveResource.include(Base, ActiveResource.prototype.Associations.prototype);

    ActiveResource.include(Base, ActiveResource.prototype.Attributes);

    ActiveResource.include(Base, ActiveResource.prototype.Callbacks);

    ActiveResource.include(Base, ActiveResource.prototype.Errors);

    ActiveResource.include(Base, ActiveResource.prototype.Fields);

    ActiveResource.include(Base, ActiveResource.prototype.Links.prototype);

    ActiveResource.include(Base, ActiveResource.prototype.Persistence);

    ActiveResource.include(Base, ActiveResource.prototype.QueryParams);

    ActiveResource.include(Base, ActiveResource.prototype.Typing);

    Base.queryName = '';

    Base.className = '';

    Base.primaryKey = 'id';

    function Base() {
      this.__initializeFields();
    }

    Base["interface"] = function() {
      return this.resourceLibrary["interface"];
    };

    Base.prototype["interface"] = function() {
      return this.klass()["interface"]();
    };

    Base.prototype.clone = function() {
      return this.__createClone({});
    };

    Base.prototype.__createClone = function(_arg) {
      var attributes, clone, cloner, newCloner,
        _this = this;
      cloner = _arg.cloner, newCloner = _arg.newCloner;
      clone = this.klass().build();
      this.errors().each(function(attribute, e) {
        return clone.errors().push(_.clone(e));
      });
      clone.__links = _.clone(this.links());
      clone.__queryParams = _.clone(this.queryParams());
      attributes = {};
      attributes[this.klass().primaryKey] = this[this.klass().primaryKey];
      clone.__assignAttributes(_.extend(attributes, this.attributes()));
      this.klass().fields().each(function(f) {
        var c, inverse, newAssociation, oldAssociation, reflection, target, _ref, _ref1, _ref2, _ref3;
        clone.__fields[f] = ((_ref = _this.__fields[f]) != null ? _ref.toArray : void 0) != null ? _this.__fields[f].clone() : _this.__fields[f];
        try {
          oldAssociation = _this.association(f);
          newAssociation = clone.association(f);
          newAssociation.__links = _.clone(oldAssociation.links());
          if (oldAssociation.loaded()) {
            newAssociation.loaded(true);
          }
          reflection = oldAssociation.reflection;
          target = reflection.collection() ? reflection.autosave() && oldAssociation.target.include(cloner) ? (c = oldAssociation.target.clone(), c.replace(cloner, newCloner), (inverse = reflection.inverseOf()) != null ? c.each(function(t) {
            if (t.__fields[inverse.name] === _this) {
              t.__fields[inverse.name] = clone;
            }
            return t.association(inverse.name).writer(clone);
          }) : void 0, clone.__fields[f].replace(cloner, newCloner), c) : ((_ref1 = reflection.inverseOf()) != null ? _ref1.autosave() : void 0) ? oldAssociation.target.map(function(t) {
            if ((cloner != null) && cloner === t) {
              return cloner;
            } else {
              c = t.__createClone({
                cloner: _this,
                newCloner: clone
              });
              clone.__fields[f].replace(t, c);
              return c;
            }
          }) : oldAssociation.target : reflection.autosave() && oldAssociation.target === cloner ? (clone.__fields[f] = newCloner, newCloner) : ((_ref2 = reflection.inverseOf()) != null ? _ref2.autosave() : void 0) ? oldAssociation.target != null ? oldAssociation.target === cloner ? cloner : (c = oldAssociation.target.__createClone({
            cloner: _this,
            newCloner: clone
          }), clone.__fields[f] === oldAssociation.target ? clone.__fields[f] = c : void 0, c) : void 0 : (((_ref3 = (inverse = reflection.inverseOf())) != null ? _ref3.collection() : void 0) ? oldAssociation.target.association(inverse.name).target.replace(_this, clone) : void 0, oldAssociation.target);
          return newAssociation.writer(target, false);
        } catch (_error) {
          return true;
        }
      });
      return clone;
    };

    Base.__newRelation = function(queryParams) {
      return new ActiveResource.prototype.Relation(this, queryParams);
    };

    return Base;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Associations.prototype.Association = (function() {
    ActiveResource.include(Association, ActiveResource.prototype.Typing);

    Association.__excludeFromExtend = true;

    function Association(owner, reflection) {
      this.owner = owner;
      this.reflection = reflection;
      this.reset();
    }

    Association.prototype.klass = function() {
      return this.reflection.klass();
    };

    Association.prototype.options = function() {
      return this.reflection.options;
    };

    Association.prototype.links = function() {
      return this.__links || (this.__links = _.clone(this.klass().links()));
    };

    Association.prototype["interface"] = function() {
      return this.owner.klass()["interface"]();
    };

    Association.prototype.reset = function() {
      this.__loaded = false;
      return this.target = null;
    };

    Association.prototype.reload = function() {
      var _this;
      this.reset();
      _this = this;
      return this.loadTarget().then(function() {
        return _this;
      });
    };

    Association.prototype.loaded = function(set) {
      if (set == null) {
        set = false;
      }
      if (set) {
        this.__loaded = true;
      }
      return this.__loaded;
    };

    Association.prototype.loadTarget = function() {
      var _this = this;
      if (this.__canFindTarget()) {
        return this.__findTarget().then(function(loadedTarget) {
          _this.target = loadedTarget;
          _this.loaded(true);
          return loadedTarget;
        })["catch"](function() {
          return _this.reset();
        });
      } else {
        this.reset();
        return null;
      }
    };

    Association.prototype.setInverseInstance = function(resource) {
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
    };

    Association.prototype.__raiseOnTypeMismatch = function(resource) {
      if (!(typeof resource.isA === "function" ? resource.isA(this.reflection.klass()) : void 0)) {
        throw "" + (this.reflection.className()) + " expected, got " + resource + " which is an instance of " + resource.constructor;
      }
    };

    Association.prototype.__canFindTarget = function() {
      return (!this.owner.newResource() || this.__foreignKeyPresent()) && this.klass();
    };

    Association.prototype.__creationAttributes = function() {
      var attributes, _base, _base1;
      attributes = {};
      if ((typeof (_base = this.reflection).hasOne === "function" ? _base.hasOne() : void 0) || (typeof (_base1 = this.reflection).collection === "function" ? _base1.collection() : void 0)) {
        attributes[this.reflection.foreignKey()] = this.owner[this.reflection.activeResourcePrimaryKey()];
        if (this.reflection.options['as']) {
          attributes[this.reflection.type()] = this.owner.klass().className;
        }
      }
      return attributes;
    };

    Association.prototype.__setOwnerAttributes = function(resource) {
      var key, value, _ref, _results;
      _ref = this.__creationAttributes();
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        _results.push(resource[key] = value);
      }
      return _results;
    };

    Association.prototype.__foreignKeyPresent = function() {
      return false;
    };

    Association.prototype.__inverseReflectionFor = function(resource) {
      return this.reflection.inverseOf();
    };

    Association.prototype.__invertibleFor = function(resource) {
      return this.__inverseReflectionFor(resource) != null;
    };

    Association.prototype.__foreignKeyFor = function(resource) {
      return typeof resource.hasAttribute === "function" ? resource.hasAttribute(this.reflection.foreignKey()) : void 0;
    };

    Association.prototype.__buildResource = function(attributes) {
      var resource;
      resource = this.reflection.buildAssociation();
      resource.__assignAttributes(attributes);
      return resource;
    };

    return Association;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.CollectionAssociation = (function(_super) {
    __extends(CollectionAssociation, _super);

    function CollectionAssociation(owner, reflection) {
      this.owner = owner;
      this.reflection = reflection;
      this.queryName = this.klass().queryName;
      CollectionAssociation.__super__.constructor.apply(this, arguments);
    }

    CollectionAssociation.prototype.reader = function() {
      return this.proxy || (this.proxy = new ActiveResource.prototype.Associations.prototype.CollectionProxy(this));
    };

    CollectionAssociation.prototype.writer = function(resources, save) {
      var localAssignment, persistedResources, _base,
        _this = this;
      if (save == null) {
        save = true;
      }
      resources = ActiveResource.prototype.Collection.build(resources);
      resources.each(function(r) {
        return _this.__raiseOnTypeMismatch(r);
      });
      persistedResources = resources.select(function(r) {
        return typeof r.persisted === "function" ? r.persisted() : void 0;
      });
      _this = this;
      localAssignment = function() {
        if (save) {
          _this.loaded(true);
        }
        _this.replace(resources);
        return resources;
      };
      if (save && !(typeof (_base = this.owner).newResource === "function" ? _base.newResource() : void 0) && (resources.empty() || !persistedResources.empty())) {
        return this.__persistAssignment(persistedResources.toArray()).then(localAssignment);
      } else {
        return localAssignment();
      }
    };

    CollectionAssociation.prototype.concat = function(resources) {
      var persistConcat, persistedResources, _base,
        _this = this;
      resources = ActiveResource.prototype.Collection.build(resources);
      resources.each(function(r) {
        return _this.__raiseOnTypeMismatch(r);
      });
      persistConcat = !(typeof (_base = this.owner).newResource === "function" ? _base.newResource() : void 0) && (persistedResources = resources.select(function(r) {
        return typeof r.persisted === "function" ? r.persisted() : void 0;
      })).size() ? this.__persistConcat(persistedResources.toArray()) : $.when(resources);
      _this = this;
      return persistConcat.then(function() {
        return _this.__concatResources(resources);
      });
    };

    CollectionAssociation.prototype["delete"] = function(resources) {
      var persistDelete, persistedResources, _base,
        _this = this;
      resources = ActiveResource.prototype.Collection.build(resources);
      resources.each(function(r) {
        return _this.__raiseOnTypeMismatch(r);
      });
      persistDelete = !(typeof (_base = this.owner).newResource === "function" ? _base.newResource() : void 0) && (persistedResources = resources.select(function(r) {
        return typeof r.persisted === "function" ? r.persisted() : void 0;
      })).size() ? this.__persistDelete(persistedResources.toArray()) : $.when(resources);
      _this = this;
      return persistDelete.then(function() {
        return _this.__removeResources(resources);
      });
    };

    CollectionAssociation.prototype.reset = function() {
      CollectionAssociation.__super__.reset.apply(this, arguments);
      return this.target = ActiveResource.prototype.Collection.build();
    };

    CollectionAssociation.prototype.addToTarget = function(resource) {
      var index;
      index = _.indexOf(this.target.toArray(), resource);
      if (index < 0) {
        index = null;
      }
      return this.replaceOnTarget(resource, index);
    };

    CollectionAssociation.prototype.replaceOnTarget = function(resource, index) {
      if (index != null) {
        this.target.set(index, resource);
      } else {
        this.target.push(resource);
      }
      this.setInverseInstance(resource);
      return resource;
    };

    CollectionAssociation.prototype.empty = function() {
      return this.target.empty();
    };

    CollectionAssociation.prototype.build = function(attributes) {
      var _this = this;
      if (attributes == null) {
        attributes = {};
      }
      if (_.isArray(attributes)) {
        return ActiveResource.prototype.Collection.build(attributes).map(function(attr) {
          return _this.build(attr);
        });
      } else {
        return this.__concatResources(ActiveResource.prototype.Collection.build(this.__buildResource(attributes))).first();
      }
    };

    CollectionAssociation.prototype.create = function(attributes, queryParams, callback) {
      if (attributes == null) {
        attributes = {};
      }
      if (queryParams == null) {
        queryParams = {};
      }
      if (callback == null) {
        callback = _.noop();
      }
      return this.__createResource(attributes, queryParams, callback);
    };

    CollectionAssociation.prototype.__findTarget = function() {
      var _this;
      _this = this;
      return this["interface"]().get(this.links()['related'], this.owner.queryParamsForReflection(this.reflection)).then(function(resources) {
        resources.each(function(r) {
          return _this.setInverseInstance(r);
        });
        return resources;
      });
    };

    CollectionAssociation.prototype.replace = function(other) {
      this.__removeResources(this.target);
      return this.__concatResources(other);
    };

    CollectionAssociation.prototype.__concatResources = function(resources) {
      var _this = this;
      resources.each(function(resource) {
        _this.addToTarget(resource);
        return _this.insertResource(resource);
      });
      return resources;
    };

    CollectionAssociation.prototype.__removeResources = function(resources) {
      return this.__deleteResources(resources);
    };

    CollectionAssociation.prototype.__deleteResources = function(resources) {
      throw '__deleteResources not implemented on CollectionAssociation';
    };

    CollectionAssociation.prototype.__persistAssignment = function(resources) {
      return this["interface"]().patch(this.links()['self'], resources, {
        onlyResourceIdentifiers: true
      });
    };

    CollectionAssociation.prototype.__persistConcat = function(resources) {
      return this["interface"]().post(this.links()['self'], resources, {
        onlyResourceIdentifiers: true
      });
    };

    CollectionAssociation.prototype.__persistDelete = function(resources) {
      return this["interface"]()["delete"](this.links()['self'], resources, {
        onlyResourceIdentifiers: true
      });
    };

    CollectionAssociation.prototype.__createResource = function(attributes, queryParams, callback) {
      var resource, _base, _this;
      if (!(typeof (_base = this.owner).persisted === "function" ? _base.persisted() : void 0)) {
        throw 'You cannot call create on an association unless the parent is saved';
      }
      resource = this.__buildResource(attributes);
      resource.assignQueryParams(queryParams);
      this.insertResource(resource);
      _this = this;
      return resource.save(callback).then(function() {
        _this.addToTarget(resource);
        return resource;
      });
    };

    return CollectionAssociation;

  })(ActiveResource.prototype.Associations.prototype.Association);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.CollectionProxy = (function(_super) {
    __extends(CollectionProxy, _super);

    function CollectionProxy() {
      _ref = CollectionProxy.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CollectionProxy.__excludeFromExtend = true;

    CollectionProxy.prototype.target = function() {
      return this.base.target;
    };

    CollectionProxy.prototype.queryParams = function() {
      var _this = this;
      return this.__queryParams || (this.__queryParams = (function() {
        var klassQueryParams, queryParams, _base;
        queryParams = _.clone(_this.base.owner.queryParamsForReflection(_this.base.reflection));
        if (!(typeof (_base = _this.base.reflection).polymorphic === "function" ? _base.polymorphic() : void 0)) {
          klassQueryParams = _.clone(_this.base.klass().queryParams());
          if (klassQueryParams['include'] != null) {
            queryParams = _this.__extendArrayParam('include', klassQueryParams['include'], queryParams);
          }
          if (klassQueryParams['fields'] != null) {
            _.each(klassQueryParams['fields'], function(v, k) {
              var v2;
              if ((v2 = queryParams['fields'][k])) {
                return v2.push.apply(v2, v);
              } else {
                return queryParams['fields'][k] = v;
              }
            });
          }
        }
        return queryParams;
      })());
    };

    CollectionProxy.prototype.all = function(options) {
      if (options == null) {
        options = {};
      }
      if (options['cached']) {
        return this.target();
      } else {
        return CollectionProxy.__super__.all.apply(this, arguments);
      }
    };

    CollectionProxy.prototype.load = function() {
      var _this = this;
      return this.all().then(function(collection) {
        return _this.base.writer(collection, false);
      });
    };

    CollectionProxy.prototype.toArray = function() {
      return this.all({
        cached: true
      }).toArray();
    };

    CollectionProxy.prototype.size = function() {
      return this.target().size();
    };

    CollectionProxy.prototype.empty = function() {
      return this.target().empty();
    };

    CollectionProxy.prototype.assign = function(other, save) {
      if (save == null) {
        save = true;
      }
      return this.base.writer(other, save);
    };

    CollectionProxy.prototype.push = function(resources) {
      return this.base.concat(resources);
    };

    CollectionProxy.prototype.build = function(attributes) {
      var resources,
        _this = this;
      if (attributes == null) {
        attributes = {};
      }
      attributes = _.isArray(attributes) ? _.map(attributes, function(attr) {
        return _.extend(attr, _this.queryParams()['filter']);
      }) : _.extend(attributes, this.queryParams()['filter']);
      resources = ActiveResource.prototype.Collection.build(this.base.build(attributes));
      resources.each(function(r) {
        return r.assignResourceRelatedQueryParams(_this.queryParams());
      });
      if (resources.size() > 1) {
        return resources;
      } else {
        return resources.first();
      }
    };

    CollectionProxy.prototype.create = function(attributes, callback) {
      if (attributes == null) {
        attributes = {};
      }
      attributes = _.extend(attributes, this.queryParams()['filter']);
      return this.base.create(attributes, this.__resourceRelatedParams(), callback);
    };

    CollectionProxy.prototype.reload = function() {
      return this.base.reload();
    };

    CollectionProxy.prototype["delete"] = function(resources) {
      return this.base["delete"](resources);
    };

    CollectionProxy.prototype.deleteAll = function() {
      return this.base["delete"](this.target());
    };

    return CollectionProxy;

  })(ActiveResource.prototype.Relation);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.HasManyAssociation = (function(_super) {
    __extends(HasManyAssociation, _super);

    function HasManyAssociation() {
      _ref = HasManyAssociation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    HasManyAssociation.prototype.insertResource = function(resource) {
      this.__setOwnerAttributes(resource);
      return this.setInverseInstance(resource);
    };

    HasManyAssociation.prototype.__deleteResources = function(resources) {
      var _this = this;
      resources.each(function(resource) {
        var inverse;
        if ((inverse = _this.reflection.inverseOf()) != null) {
          return resource.association(inverse.name).replace(null);
        } else {
          return resource[_this.reflection.foreignKey()] = null;
        }
      });
      return this.target = ActiveResource.prototype.Collection.build(_.difference(this.target.toArray(), resources.toArray()));
    };

    return HasManyAssociation;

  })(ActiveResource.prototype.Associations.prototype.CollectionAssociation);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.SingularAssociation = (function(_super) {
    __extends(SingularAssociation, _super);

    function SingularAssociation() {
      _ref = SingularAssociation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SingularAssociation.prototype.reader = function() {
      return this.target;
    };

    SingularAssociation.prototype.writer = function(resource, save) {
      var localAssignment, _base, _this;
      if (save == null) {
        save = true;
      }
      if (resource != null) {
        this.__raiseOnTypeMismatch(resource);
      }
      _this = this;
      localAssignment = function() {
        if (save) {
          _this.loaded(true);
        }
        return _this.replace(resource);
      };
      if (save && !(typeof (_base = this.owner).newResource === "function" ? _base.newResource() : void 0)) {
        return this.__persistAssignment(resource).then(localAssignment);
      } else {
        return localAssignment();
      }
    };

    SingularAssociation.prototype.build = function(attributes) {
      var resource;
      if (attributes == null) {
        attributes = {};
      }
      resource = this.__buildResource(attributes);
      this.replace(resource);
      return resource;
    };

    SingularAssociation.prototype.create = function(attributes, queryParams, callback) {
      if (attributes == null) {
        attributes = {};
      }
      if (queryParams == null) {
        queryParams = {};
      }
      return this.__createResource(attributes, queryParams, callback);
    };

    SingularAssociation.prototype.replace = function(resource) {
      return raise('Subclasses must implement a replace(resource) method');
    };

    SingularAssociation.prototype.__persistAssignment = function(resource) {
      return this["interface"]().patch(this.links()['self'], resource, {
        onlyResourceIdentifiers: true
      });
    };

    SingularAssociation.prototype.__getResource = function() {
      return this["interface"]().get(this.links()['related'], this.owner.queryParamsForReflection(this.reflection));
    };

    SingularAssociation.prototype.__findTarget = function() {
      var _this;
      _this = this;
      return this.__getResource().then(function(resource) {
        return _this.setInverseInstance(resource);
      });
    };

    SingularAssociation.prototype.__createResource = function(attributes, queryParams, callback) {
      var resource, _base, _this;
      if (!(typeof (_base = this.owner).persisted === "function" ? _base.persisted() : void 0)) {
        throw 'You cannot call create on an association unless the parent is saved';
      }
      resource = this.__buildResource(attributes);
      resource.assignQueryParams(queryParams);
      this.replace(resource);
      _this = this;
      return resource.save(callback).then(function() {
        _this.loaded(true);
        return resource;
      });
    };

    return SingularAssociation;

  })(ActiveResource.prototype.Associations.prototype.Association);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.HasOneAssociation = (function(_super) {
    __extends(HasOneAssociation, _super);

    function HasOneAssociation() {
      _ref = HasOneAssociation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    HasOneAssociation.prototype.replace = function(resource) {
      this.__removeTarget();
      if (resource) {
        this.__setOwnerAttributes(resource);
        this.setInverseInstance(resource);
        return this.target = resource;
      }
    };

    HasOneAssociation.prototype.__removeTarget = function() {
      if (this.target) {
        this.__nullifyOwnerAttributes(this.target);
      }
      return this.target = null;
    };

    HasOneAssociation.prototype.__nullifyOwnerAttributes = function(resource) {
      return resource[this.reflection.foreignKey()] = null;
    };

    return HasOneAssociation;

  })(ActiveResource.prototype.Associations.prototype.SingularAssociation);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.BelongsToAssociation = (function(_super) {
    __extends(BelongsToAssociation, _super);

    function BelongsToAssociation() {
      _ref = BelongsToAssociation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BelongsToAssociation.prototype.reset = function() {
      BelongsToAssociation.__super__.reset.apply(this, arguments);
      return this.updated = false;
    };

    BelongsToAssociation.prototype.replace = function(resource) {
      if (resource) {
        this.__replaceKeys(resource);
        this.setInverseInstance(resource);
        this.updated = true;
      } else {
        this.__removeKeys();
      }
      return this.target = resource;
    };

    BelongsToAssociation.prototype.__getResource = function() {
      if (!this.owner.newResource()) {
        return BelongsToAssociation.__super__.__getResource.apply(this, arguments);
      } else {
        return this["interface"]().get(this.links()['related'] + this.owner[this.reflection.foreignKey()], this.owner.queryParamsForReflection(this.reflection));
      }
    };

    BelongsToAssociation.prototype.__replaceKeys = function(resource) {
      return this.owner[this.reflection.foreignKey()] = resource.__readAttribute(this.reflection.associationPrimaryKey(resource.klass()));
    };

    BelongsToAssociation.prototype.__removeKeys = function() {
      return this.owner[this.reflection.foreignKey()] = null;
    };

    BelongsToAssociation.prototype.__foreignKeyPresent = function() {
      return this.owner.__readAttribute(this.reflection.foreignKey()) != null;
    };

    return BelongsToAssociation;

  })(ActiveResource.prototype.Associations.prototype.SingularAssociation);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.BelongsToPolymorphicAssociation = (function(_super) {
    __extends(BelongsToPolymorphicAssociation, _super);

    function BelongsToPolymorphicAssociation() {
      _ref = BelongsToPolymorphicAssociation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BelongsToPolymorphicAssociation.prototype.klass = function() {
      var type;
      type = this.owner[this.reflection.foreignType()];
      try {
        return this.owner.klass().resourceLibrary.constantize(type);
      } catch (_error) {
        return void 0;
      }
    };

    BelongsToPolymorphicAssociation.prototype.links = function() {
      if (this.klass()) {
        return BelongsToPolymorphicAssociation.__super__.links.apply(this, arguments);
      } else {
        return {};
      }
    };

    BelongsToPolymorphicAssociation.prototype.__replaceKeys = function(resource) {
      BelongsToPolymorphicAssociation.__super__.__replaceKeys.apply(this, arguments);
      return this.owner[this.reflection.foreignType()] = resource.klass().className;
    };

    BelongsToPolymorphicAssociation.prototype.__removeKeys = function() {
      BelongsToPolymorphicAssociation.__super__.__removeKeys.apply(this, arguments);
      return this.owner[this.reflection.foreignType()] = null;
    };

    BelongsToPolymorphicAssociation.prototype.__inverseReflectionFor = function(resource) {
      return this.reflection.polymorphicInverseOf(resource.klass());
    };

    BelongsToPolymorphicAssociation.prototype.__raiseOnTypeMismatch = function(resource) {};

    return BelongsToPolymorphicAssociation;

  })(ActiveResource.prototype.Associations.prototype.BelongsToAssociation);

}).call(this);

(function() {
  ActiveResource.prototype.Associations.prototype.Builder = (function() {
    function Builder() {}

    Builder.__excludeFromExtend = true;

    Builder.prototype.Association = (function() {
      function Association() {}

      Association.build = function(model, name, options) {
        var reflection;
        reflection = ActiveResource.prototype.Reflection.create(this.macro, name, options, model);
        this.defineAccessors(model, reflection);
        return reflection;
      };

      Association.defineAccessors = function(model, reflection) {
        var name;
        name = reflection.name;
        this.defineReaders(model, name);
        return this.defineWriters(model, name);
      };

      Association.defineReaders = function(mixin, name) {
        mixin.prototype[name] = function() {
          return this.association(name).reader();
        };
        return mixin.prototype["load" + (s.capitalize(name))] = function() {
          return this.association(name).loadTarget();
        };
      };

      Association.defineWriters = function(mixin, name) {
        return _.noop();
      };

      return Association;

    })();

    return Builder;

  }).call(this);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.Builder.prototype.CollectionAssociation = (function(_super) {
    __extends(CollectionAssociation, _super);

    function CollectionAssociation() {
      _ref = CollectionAssociation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return CollectionAssociation;

  })(ActiveResource.prototype.Associations.prototype.Builder.prototype.Association);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.Builder.prototype.HasMany = (function(_super) {
    __extends(HasMany, _super);

    function HasMany() {
      _ref = HasMany.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    HasMany.macro = 'hasMany';

    return HasMany;

  })(ActiveResource.prototype.Associations.prototype.Builder.prototype.CollectionAssociation);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.Builder.prototype.SingularAssociation = (function(_super) {
    __extends(SingularAssociation, _super);

    function SingularAssociation() {
      _ref = SingularAssociation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SingularAssociation.defineAccessors = function(model, reflection) {
      SingularAssociation.__super__.constructor.defineAccessors.apply(this, arguments);
      if (typeof reflection.constructable === "function" ? reflection.constructable() : void 0) {
        return this.defineConstructors(model, reflection.name);
      }
    };

    SingularAssociation.defineWriters = function(mixin, name) {
      mixin.prototype["assign" + (s.capitalize(name))] = function(value) {
        return this.association(name).writer(value, false);
      };
      return mixin.prototype["update" + (s.capitalize(name))] = function(value) {
        return this.association(name).writer(value);
      };
    };

    SingularAssociation.defineConstructors = function(mixin, name) {
      mixin.prototype["build" + (s.capitalize(name))] = function(attributes) {
        return this.association(name).build(attributes);
      };
      return mixin.prototype["create" + (s.capitalize(name))] = function(attributes, callback) {
        return this.association(name).create(attributes, callback);
      };
    };

    return SingularAssociation;

  })(ActiveResource.prototype.Associations.prototype.Builder.prototype.Association);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.Builder.prototype.BelongsTo = (function(_super) {
    __extends(BelongsTo, _super);

    function BelongsTo() {
      _ref = BelongsTo.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BelongsTo.macro = 'belongsTo';

    return BelongsTo;

  })(ActiveResource.prototype.Associations.prototype.Builder.prototype.SingularAssociation);

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Associations.prototype.Builder.prototype.HasOne = (function(_super) {
    __extends(HasOne, _super);

    function HasOne() {
      _ref = HasOne.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    HasOne.macro = 'hasOne';

    return HasOne;

  })(ActiveResource.prototype.Associations.prototype.Builder.prototype.SingularAssociation);

}).call(this);

(function() {
  ActiveResource.prototype.Immutable = (function() {
    function Immutable() {}

    return Immutable;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Immutable.prototype.Attributes = (function() {
    function Attributes() {}

    Attributes.assignAttributes = function(attributes) {
      var clone;
      clone = this.clone();
      clone.__assignAttributes(attributes);
      return clone;
    };

    return Attributes;

  })();

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  ActiveResource.prototype.Immutable.prototype.Errors = (function(_super) {
    __extends(Errors, _super);

    function Errors() {
      _ref = Errors.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Errors.errors = function() {
      return this.__errors || (this.__errors = new ActiveResource.prototype.Immutable.prototype.Errors(this));
    };

    Errors.prototype.add = function(field, code, detail) {
      var clone;
      if (detail == null) {
        detail = '';
      }
      clone = this.base.clone();
      clone.errors().__add(field, code, detail);
      return clone;
    };

    Errors.prototype.addAll = function() {
      var clone, errors,
        _this = this;
      errors = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      clone = this.base.clone();
      _.map(errors, function(error) {
        var _ref1;
        return (_ref1 = clone.errors()).__add.apply(_ref1, error);
      });
      return clone;
    };

    Errors.prototype.propagate = function(errors) {
      var errorsByTarget,
        _this = this;
      errorsByTarget = errors.inject({}, function(targetObject, error) {
        var association, field, nestedError, nestedField;
        nestedField = error.field.split('.');
        field = nestedField.shift();
        nestedError = _.clone(error);
        if (targetObject[field] == null) {
          try {
            association = _this.base.association(field);
          } catch (_error) {
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
      return _.each(errorsByTarget, function(errorsForTarget, k) {
        var association, baseErrors, clone, relationshipResource, _ref1;
        if (errorsForTarget.association != null) {
          association = errorsForTarget.association;
          if (association.reflection.collection()) {
            baseErrors = errorsForTarget.errors.select(function(e) {
              return e.field === 'base';
            });
            baseErrors.each(function(e) {
              e.field = k;
              return errorsForTarget.errors["delete"](e);
            });
            baseErrors.each(function(e) {
              return _this.push(e);
            });
            relationshipResource = association.target.first();
            if (clone = relationshipResource != null ? relationshipResource.__createClone({
              cloner: _this.base
            }) : void 0) {
              _this.base.__fields[association.reflection.name].replace(relationshipResource, clone);
              association.target.replace(relationshipResource, clone);
              clone.errors().clear();
              return clone.errors().propagate(errorsForTarget.errors);
            }
          } else {
            if (clone = (_ref1 = association.target) != null ? _ref1.__createClone({
              cloner: _this.base
            }) : void 0) {
              clone.errors().clear();
              return clone.errors().propagate(errorsForTarget.errors);
            }
          }
        } else {
          return errorsForTarget.errors.each(function(e) {
            return _this.push(e);
          });
        }
      });
    };

    return Errors;

  })(ActiveResource.prototype.Errors);

}).call(this);

(function() {
  ActiveResource.prototype.Immutable.prototype.Persistence = (function() {
    function Persistence() {}

    Persistence.update = function(attributes, callback) {
      var attributesKeys, oldAttributes,
        _this = this;
      attributesKeys = ActiveResource.prototype.Collection.build(_.keys(attributes));
      oldAttributes = _.pick(this.attributes(), attributesKeys.toArray());
      oldAttributes = _.defaults(oldAttributes, attributesKeys.inject({}, function(obj, k) {
        obj[k] = null;
        return obj;
      }));
      return this.__createOrUpdate(this.assignAttributes(attributes)).then(null, function(resource) {
        resource.__assignAttributes(oldAttributes);
        return resource;
      }).then(callback, callback);
    };

    Persistence.__createOrUpdate = function(clone) {
      if (clone == null) {
        clone = this.clone();
      }
      clone.errors().reset();
      if (clone.persisted()) {
        return this.klass().resourceLibrary["interface"].patch(this.links()['self'], clone);
      } else {
        return this.klass().resourceLibrary["interface"].post(this.links()['related'], clone);
      }
    };

    return Persistence;

  })();

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.prototype.Immutable.prototype.Base = (function(_super) {
    __extends(Base, _super);

    ActiveResource.include(Base, ActiveResource.prototype.Immutable.prototype.Attributes);

    ActiveResource.include(Base, ActiveResource.prototype.Immutable.prototype.Errors);

    ActiveResource.include(Base, ActiveResource.prototype.Immutable.prototype.Persistence);

    function Base() {
      Base.__super__.constructor.apply(this, arguments);
    }

    return Base;

  })(ActiveResource.prototype.Base);

}).call(this);

return ActiveResource;

}));
