(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'underscore', 'underscore.string', 'underscore.inflection'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        require('underscore.inflection');
        module.exports = factory(require('jquery'), require('underscore'), require('underscore.string'));
    } else {
        // Browser globals (root is window)
        root.ActiveResource = factory(root.jQuery, root._, root.s);
    }
}(this, function(jQuery, _, s) {

var ActiveResource = function(){};

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
      var Base, resourceLibrary, _ref;

      function ResourceLibrary() {}

      ResourceLibrary.baseUrl = baseUrl.charAt(baseUrl.length - 1) === '/' ? baseUrl : "" + baseUrl + "/";

      ResourceLibrary.headers = options.headers;

      ResourceLibrary["interface"] = new (options["interface"] || ActiveResource.Interfaces.JsonApi)(ResourceLibrary);

      ResourceLibrary.constantizeScope = options['constantizeScope'];

      resourceLibrary = ResourceLibrary;

      ResourceLibrary.Base = Base = (function(_super) {
        __extends(Base, _super);

        function Base() {
          _ref = Base.__super__.constructor.apply(this, arguments);
          return _ref;
        }

        Base.resourceLibrary = resourceLibrary;

        return Base;

      })(ActiveResource.prototype.Base);

      ResourceLibrary.constantize = function(className) {
        var klass, scope, v, _i, _len;
        klass = null;
        scope = this.constantizeScope && _.values(this.constantizeScope) || _.flatten([_.values(this), _.values(this.prototype)]);
        for (_i = 0, _len = scope.length; _i < _len; _i++) {
          v = scope[_i];
          if (_.isObject(v) && v.className === className) {
            klass = v;
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
      function Base(resourceLibrary) {
        this.resourceLibrary = resourceLibrary;
      }

      Base.prototype.request = function(url, method, data) {
        var options;
        options = {
          contentType: 'application/json',
          dataType: 'json',
          headers: this.resourceLibrary.headers,
          method: method,
          url: url
        };
        options['data'] = method === 'GET' ? data : JSON.stringify(data);
        return jQuery.ajax(options);
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

  })();

}).call(this);

(function() {
  var _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ActiveResource.Interfaces.JsonApi = ActiveResource.prototype.Interfaces.prototype.JsonApi = (function(_super) {
    var buildIncludeTree, buildResourceDocument, buildResourceIdentifier, buildResourceRelationships, buildSortList, buildSparseFieldset, toCamelCase, toUnderscored;

    __extends(JsonApi, _super);

    function JsonApi() {
      _ref = JsonApi.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    JsonApi.prototype.request = function(url, method, data) {
      return JsonApi.__super__.request.apply(this, arguments).then(function(response, textStatus, xhr) {
        if (!(((response != null ? response.data : void 0) != null) || xhr.status === 204)) {
          throw "Response from " + url + " was not in JSON API format";
        }
        return response;
      });
    };

    toUnderscored = function(object) {
      var k, underscored, v;
      underscored = {};
      for (k in object) {
        v = object[k];
        underscored[s.underscored(k)] = _.isArray(v) ? _.map(v, function(i) {
          return toUnderscored(i);
        }) : _.isObject(v) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Base) : void 0) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Collection) : void 0) && !_.isDate(v) ? toUnderscored(v) : v;
      }
      return underscored;
    };

    toCamelCase = function(object) {
      var camelized, k, v;
      camelized = {};
      for (k in object) {
        v = object[k];
        camelized[s.camelize(k)] = _.isArray(v) ? _.map(v, function(i) {
          return toCamelCase(i);
        }) : _.isObject(v) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Base) : void 0) && !(typeof v.isA === "function" ? v.isA(ActiveResource.prototype.Collection) : void 0) ? toCamelCase(v) : v;
      }
      return camelized;
    };

    buildSparseFieldset = function(fields) {
      return _.mapObject(fields, function(fieldArray) {
        return _.map(fieldArray, function(f) {
          return s.underscored(f);
        }).join();
      });
    };

    buildIncludeTree = function(includes) {
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

    buildSortList = function(sortObject) {
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

    buildResourceIdentifier = function(resource) {
      var identifier, primaryKeyValue;
      identifier = {
        type: resource.klass().queryName
      };
      if ((primaryKeyValue = resource[resource.klass().primaryKey])) {
        identifier[resource.klass().primaryKey] = primaryKeyValue.toString();
      }
      return identifier;
    };

    buildResourceRelationships = function(resource) {
      var relationships;
      relationships = {};
      resource.klass().reflectOnAllAssociations().each(function(reflection) {
        var output, target;
        if (reflection.collection()) {
          if (!resource.association(reflection.name).empty()) {
            return relationships[s.underscored(reflection.name)] = {
              data: resource.association(reflection.name).reader().all({
                cached: true
              }).map(function(target) {
                var output;
                output = buildResourceIdentifier(target);
                if (typeof reflection.autosave === "function" ? reflection.autosave() : void 0) {
                  output['attributes'] = toUnderscored(_.omit(target.attributes(), resource.klass().primaryKey));
                  output['relationships'] = buildResourceRelationships(target);
                }
                return output;
              }).toArray()
            };
          }
        } else {
          if (resource.association(reflection.name).reader() != null) {
            target = resource.association(reflection.name).reader();
            output = buildResourceIdentifier(target);
            if (typeof reflection.autosave === "function" ? reflection.autosave() : void 0) {
              output['attributes'] = toUnderscored(_.omit(target.attributes(), resource.klass().primaryKey));
              output['relationships'] = buildResourceRelationships(target);
            }
            return relationships[s.underscored(reflection.name)] = {
              data: output
            };
          }
        }
      });
      return relationships;
    };

    buildResourceDocument = function(resourceData, onlyResourceIdentifiers) {
      var data;
      if (onlyResourceIdentifiers == null) {
        onlyResourceIdentifiers = false;
      }
      data = ActiveResource.prototype.Collection.build(resourceData).compact().map(function(resource) {
        var documentResource;
        documentResource = buildResourceIdentifier(resource);
        if (!onlyResourceIdentifiers) {
          documentResource['attributes'] = toUnderscored(_.omit(resource.attributes(), resource.klass().primaryKey));
          documentResource['relationships'] = buildResourceRelationships(resource);
        }
        return documentResource;
      });
      if (_.isArray(resourceData)) {
        return data.toArray();
      } else {
        return data.first();
      }
    };

    JsonApi.prototype.buildResource = function(data, includes, existingResource) {
      var attributes, resource;
      resource = existingResource || this.resourceLibrary.constantize(_.singularize(s.classify(data['type']))).build();
      attributes = data['attributes'];
      attributes[resource.klass().primaryKey] = data[resource.klass().primaryKey].toString();
      attributes = this.addRelationshipsToAttributes(attributes, data['relationships'], includes, resource);
      resource.assignAttributes(toCamelCase(attributes));
      resource.__links = _.pick(data['links'], 'self');
      resource.klass().reflectOnAllAssociations().each(function(reflection) {
        var association, relationship, relationshipEmpty, _ref1, _ref2, _ref3, _ref4;
        association = resource.association(reflection.name);
        association.__links = (_ref1 = data['relationships']) != null ? (_ref2 = _ref1[s.underscored(reflection.name)]) != null ? _ref2['links'] : void 0 : void 0;
        relationshipEmpty = _.isObject(relationship = (_ref3 = data['relationships']) != null ? (_ref4 = _ref3[s.underscored(reflection.name)]) != null ? _ref4['data'] : void 0 : void 0) ? _.keys(relationship).length === 0 : relationship != null ? relationship.length === 0 : true;
        if (_.has(attributes, reflection.name) || relationshipEmpty) {
          return association.loaded(true);
        }
      });
      return resource;
    };

    JsonApi.prototype.addRelationshipsToAttributes = function(attributes, relationships, includes, resource) {
      var _this = this;
      _.each(relationships, function(relationship, relationshipName) {
        var include, relationshipItems;
        if (_.isArray(relationship['data'])) {
          relationshipItems = ActiveResource.prototype.Collection.build(relationship['data']).map(function(relationshipMember) {
            return _this.findIncludeFromRelationship(relationshipMember, includes, resource);
          }).compact();
          if (!(typeof relationshipItems.empty === "function" ? relationshipItems.empty() : void 0)) {
            return attributes[relationshipName] = relationshipItems;
          }
        } else if (relationship['data'] != null) {
          include = _this.findIncludeFromRelationship(relationship['data'], includes, resource);
          if (include != null) {
            return attributes[relationshipName] = include;
          }
        }
      });
      return attributes;
    };

    JsonApi.prototype.findIncludeFromRelationship = function(relationshipData, includes, resource) {
      var findConditions, include;
      findConditions = {
        type: relationshipData.type
      };
      findConditions[resource.klass().primaryKey] = relationshipData[resource.klass().primaryKey];
      if ((include = _.findWhere(includes, findConditions)) != null) {
        include = this.buildResource(include, includes);
      }
      return include;
    };

    JsonApi.prototype.mergePersistedChanges = function(response, resource) {
      return this.buildResource(response['data'], response['included'], resource);
    };

    JsonApi.prototype.resourceErrors = function(resource, errors) {
      _.each(errors, function(error) {
        var attribute;
        attribute = [];
        if (error['source']['pointer'] === '/data') {
          attribute.push('base');
        } else {
          _.each(error['source']['pointer'].split('/data'), function(i) {
            var m;
            if ((m = i.match(/\/(attributes|relationships|)\/(\w+)/)) != null) {
              return attribute.push(s.camelize(m[2]));
            }
          });
        }
        return resource.errors().add(attribute.join('.'), s.camelize(error['code']), error['detail']);
      });
      return resource;
    };

    JsonApi.prototype.parameterErrors = function(errors) {
      return ActiveResource.prototype.Collection.build(errors).map(function(error) {
        var out, _ref1;
        out = {
          details: error['detail']
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
        data['filter'] = toUnderscored(queryParams['filter']);
      }
      if (queryParams['fields'] != null) {
        data['fields'] = buildSparseFieldset(queryParams['fields']);
      }
      if (queryParams['include'] != null) {
        data['include'] = buildIncludeTree(queryParams['include']);
      }
      if (queryParams['sort'] != null) {
        data['sort'] = buildSortList(queryParams['sort']);
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
        built = ActiveResource.prototype.Collection.build(_.flatten([response.data])).map(function(object) {
          object = _this.buildResource(object, response.included);
          object.assignResourceRelatedQueryParams(queryParams);
          return object;
        });
        if (_.isArray(response.data)) {
          return built;
        } else {
          return built.first();
        }
      }, function(errors) {
        return _this.parameterErrors(errors.responseJSON['errors']);
      });
    };

    JsonApi.prototype.post = function(url, resourceData, options) {
      var data, queryParams, _this;
      if (options == null) {
        options = {};
      }
      data = {
        data: buildResourceDocument(resourceData, options['onlyResourceIdentifiers'])
      };
      if (!options['onlyResourceIdentifiers']) {
        queryParams = resourceData.queryParams();
        if (queryParams['fields'] != null) {
          data['fields'] = buildSparseFieldset(queryParams['fields']);
        }
        if (queryParams['include'] != null) {
          data['include'] = buildIncludeTree(queryParams['include']);
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
          return errors;
        } else {
          return _this.resourceErrors(resourceData, errors.responseJSON['errors']);
        }
      });
    };

    JsonApi.prototype.patch = function(url, resourceData, options) {
      var data, queryParams, _this;
      if (options == null) {
        options = {};
      }
      data = {
        data: buildResourceDocument(resourceData, options['onlyResourceIdentifiers'])
      };
      if (!options['onlyResourceIdentifiers']) {
        queryParams = resourceData.queryParams();
        if (queryParams['fields'] != null) {
          data['fields'] = buildSparseFieldset(queryParams['fields']);
        }
        if (queryParams['include'] != null) {
          data['include'] = buildIncludeTree(queryParams['include']);
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
          return errors;
        } else {
          return _this.resourceErrors(resourceData, errors.responseJSON['errors']);
        }
      });
    };

    JsonApi.prototype.put = function(url, resourceData, options) {
      var data, queryParams, _this;
      if (options == null) {
        options = {};
      }
      data = {
        data: buildResourceDocument(resourceData, options['onlyResourceIdentifiers'])
      };
      if (!options['onlyResourceIdentifiers']) {
        queryParams = resourceData.queryParams();
        if (queryParams['fields'] != null) {
          data['fields'] = buildSparseFieldset(queryParams['fields']);
        }
        if (queryParams['include'] != null) {
          data['include'] = buildIncludeTree(queryParams['include']);
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
          return errors;
        } else {
          return _this.resourceErrors(resourceData, errors.responseJSON['errors']);
        }
      });
    };

    JsonApi.prototype["delete"] = function(url, resourceData, options) {
      var data, _this;
      if (options == null) {
        options = {};
      }
      data = resourceData != null ? {
        data: buildResourceDocument(resourceData, true)
      } : {};
      _this = this;
      return this.request(url, 'DELETE', data).then(null, function(errors) {
        if (errors.responseJSON) {
          return _this.parameterErrors(errors.responseJSON['errors']);
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
  ActiveResource.prototype.Attributes = (function() {
    function Attributes() {}

    Attributes.hasAttribute = function(attribute) {
      return this.__readAttribute(attribute) != null;
    };

    Attributes.assignAttributes = function(attributes) {
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

    Attributes.attributes = function() {
      var k, output, reserved, v, validOutput;
      reserved = ['__associations', '__errors', '__links', '__queryParams'];
      validOutput = function(k, v) {
        var e;
        return !_.isFunction(v) && !_.contains(reserved, k) && (function() {
          try {
            return this.association(k) == null;
          } catch (_error) {
            e = _error;
            return true;
          }
        }).call(this);
      };
      output = {};
      for (k in this) {
        v = this[k];
        if (validOutput(k, v)) {
          output[k] = v;
        }
      }
      return output;
    };

    Attributes.reload = function() {
      var link, resource, _ref;
      if (!(this.persisted() || ((_ref = this.id) != null ? _ref.toString().length : void 0) > 0)) {
        throw 'Cannot reload a resource that is not persisted or has an ID';
      }
      resource = this;
      link = this.links()['self'] || (this.links()['related'] + this.id.toString());
      return this["interface"]().get(link, this.queryParams()).then(function(reloaded) {
        resource.assignAttributes(reloaded.attributes());
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

    Attributes.__readAttribute = function(attribute) {
      return this.attributes()[attribute];
    };

    return Attributes;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Callbacks = (function() {
    function Callbacks() {}

    Callbacks.prototype.callbacks = function() {
      return this.__callbacks || (this.__callbacks = {
        afterBuild: ActiveResource.prototype.Collection.build()
      });
    };

    Callbacks.prototype.afterBuild = function(func) {
      return this.callbacks()['afterBuild'].push(func);
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

  ActiveResource.prototype.Collection = (function() {
    ActiveResource.include(Collection, ActiveResource.prototype.Typing);

    Collection.build = function(array) {
      if (array == null) {
        array = [];
      }
      if (typeof array.isA === "function" ? array.isA(this) : void 0) {
        return array;
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
      return _.indexOf(this.__collection, item) >= 0;
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
      return ActiveResource.prototype.Collection.build(_.map(this.__collection, iteratee));
    };

    Collection.prototype.compact = function(iteratee) {
      return ActiveResource.prototype.Collection.build(_.without(this.__collection, null, void 0));
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
      return ActiveResource.prototype.Collection.build(_.flatten(this.__collection));
    };

    Collection.prototype.push = function() {
      var objs, _ref;
      objs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (_ref = this.__collection).push.apply(_ref, objs);
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
      return ActiveResource.prototype.Collection.build(_.filter(this.__collection, predicate));
    };

    Collection.prototype.detect = function(predicate) {
      return _.detect(this.__collection, predicate);
    };

    return Collection;

  })();

}).call(this);

(function() {
  ActiveResource.prototype.Errors = (function() {
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

    Errors.prototype.add = function(attribute, code, detail) {
      var error, _base;
      if (detail == null) {
        detail = '';
      }
      (_base = this.__errors)[attribute] || (_base[attribute] = []);
      this.__errors[attribute].push(error = {
        attribute: attribute,
        code: code,
        detail: detail,
        message: detail
      });
      return error;
    };

    Errors.prototype.push = function(error) {
      var _base, _name;
      (_base = this.__errors)[_name = error.attribute] || (_base[_name] = []);
      this.__errors[error.attribute].push(error);
      return error;
    };

    Errors.prototype.added = function(attribute, code) {
      return ActiveResource.prototype.Collection.build(this.__errors[attribute]).detect(function(e) {
        return e.code === code;
      }) != null;
    };

    Errors.prototype.include = function(attribute) {
      return (this.__errors[attribute] != null) && _.size(this.__errors[attribute]) > 0;
    };

    Errors.prototype.empty = function() {
      return this.size() === 0;
    };

    Errors.prototype.size = function() {
      return _.size(this.toArray());
    };

    Errors.prototype["delete"] = function(attribute) {
      return this.__errors[attribute] = [];
    };

    Errors.prototype.each = function(iterator) {
      return _.each(this.__errors, function(errors, attribute) {
        var error, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = errors.length; _i < _len; _i++) {
          error = errors[_i];
          _results.push(iterator(attribute, error));
        }
        return _results;
      });
    };

    Errors.prototype.forAttribute = function(attribute) {
      return ActiveResource.prototype.Collection.build(this.__errors[attribute]).inject({}, function(out, error) {
        out[error.code] = error.message;
        return out;
      });
    };

    Errors.prototype.forBase = function() {
      return this.forAttribute('base');
    };

    Errors.prototype.toArray = function() {
      var attribute, errors, output, _ref;
      output = [];
      _ref = this.__errors;
      for (attribute in _ref) {
        errors = _ref[attribute];
        output.push.apply(output, errors);
      }
      return output;
    };

    Errors.prototype.toCollection = function() {
      return ActiveResource.prototype.Collection.build(this.toArray());
    };

    return Errors;

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
      return this.__createOrUpdate().always(callback);
    };

    Persistence.update = function(attributes, callback) {
      var oldAttributes;
      oldAttributes = _.pick(this.attributes(), _.keys(attributes));
      this.assignAttributes(attributes);
      return this.__createOrUpdate().then(null, function(resource) {
        resource.assignAttributes(oldAttributes);
        return resource;
      }).always(callback);
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
        return this.klass().resourceLibrary["interface"].put(this.links()['self'], this);
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

  ActiveResource.prototype.Reflection = (function() {
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
        return this.options['polymorphic'];
      };

      AbstractReflection.prototype.autosave = function() {
        return this.options['autosave'];
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

  ActiveResource.prototype.Relation = (function() {
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
      resource.assignAttributes(_.extend(attributes, this.queryParams()['filter']));
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
      if (primaryKey == null) {
        return;
      }
      return this["interface"]().get(this.links()['related'] + primaryKey.toString(), this.queryParams());
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

    ActiveResource.extend(Base, ActiveResource.prototype.Callbacks.prototype);

    ActiveResource.extend(Base, ActiveResource.prototype.Reflection.prototype);

    ActiveResource.extend(Base, ActiveResource.prototype.Relation.prototype);

    ActiveResource.include(Base, ActiveResource.prototype.Associations.prototype);

    ActiveResource.include(Base, ActiveResource.prototype.Attributes);

    ActiveResource.include(Base, ActiveResource.prototype.Callbacks);

    ActiveResource.include(Base, ActiveResource.prototype.Errors);

    ActiveResource.include(Base, ActiveResource.prototype.Persistence);

    ActiveResource.include(Base, ActiveResource.prototype.QueryParams);

    ActiveResource.include(Base, ActiveResource.prototype.Typing);

    Base.queryName = '';

    Base.className = '';

    Base.primaryKey = 'id';

    function Base() {}

    Base.links = function() {
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

    Base.prototype.links = function() {
      return this.__links || (this.__links = this.klass().links());
    };

    Base["interface"] = function() {
      return this.resourceLibrary["interface"];
    };

    Base.prototype["interface"] = function() {
      return this.klass()["interface"]();
    };

    Base.prototype.clone = function() {
      return this.__createClone();
    };

    Base.prototype.__createClone = function(cloner) {
      var clone,
        _this = this;
      clone = this.klass().build(this.attributes());
      clone.__links = this.links();
      this.errors().each(function(attribute, e) {
        return clone.errors().push(_.clone(e));
      });
      this.klass().reflectOnAllAssociations().each(function(reflection) {
        var new_association, new_target, old_association;
        old_association = _this.association(reflection.name);
        new_association = clone.association(reflection.name);
        new_association.__links = old_association.links();
        if (reflection.collection()) {
          return old_association.target.each(function(resource) {
            var new_target;
            new_target = resource.__createClone(_this);
            new_association.setInverseInstance(new_target);
            return new_association.target.push(new_target);
          });
        } else if ((old_association.target != null) && old_association.target !== cloner) {
          new_target = old_association.target.__createClone(_this);
          new_association.setInverseInstance(new_target);
          return new_association.target = new_target;
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
      return this.__links || (this.__links = this.klass().links());
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
      var _this;
      if (this.__canFindTarget()) {
        _this = this;
        return this.__findTarget().then(function(loadedTarget) {
          _this.target = loadedTarget;
          _this.loaded(true);
          return loadedTarget;
        }).fail(function() {
          return _this.reset();
        });
      } else {
        this.reset();
        return $.when(null);
      }
    };

    Association.prototype.setInverseInstance = function(resource) {
      var inverse;
      if (this.__invertibleFor(resource)) {
        inverse = resource.association(this.__inverseReflectionFor(resource).name);
        inverse.target = this.owner;
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
      return this.__foreignKeyFor(resource) && this.__inverseReflectionFor(resource);
    };

    Association.prototype.__foreignKeyFor = function(resource) {
      return typeof resource.hasAttribute === "function" ? resource.hasAttribute(this.reflection.foreignKey()) : void 0;
    };

    Association.prototype.__buildResource = function(attributes) {
      var resource;
      resource = this.reflection.buildAssociation();
      resource.assignAttributes(attributes);
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

    BelongsToAssociation.prototype.__invertibleFor = function(resource) {
      var inverse;
      inverse = this.__inverseReflectionFor(resource);
      return inverse && (typeof inverse.hasOne === "function" ? inverse.hasOne() : void 0);
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
      return this.owner.klass().resourceLibrary.constantize(type);
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


return ActiveResource;

}));
