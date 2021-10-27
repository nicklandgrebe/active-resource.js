# Implements an interface according the JSON API standard defined by (http://jsonapi.org/format/)
#
# @example JSON API format
#   response = {
#     data: {
#       id: "10",
#       type: "merchants", # plural type name
#       attributes: {
#         name: "...",
#         balance: "...",
#       },
#       links: {
#         self: "https://app.getoccasion.com/api/v1/merchants/10"
#       },
#       relationships: {
#         products: [
#           { id: "1202", type: "products" },
#           { id: "1203", type: "products" }
#         ]
#       }
#     },
#     included: [
#       { id: "1202", type: "products", attributes: { title: "..." } },
#       { id: "1203", type: "products", attributes: { title: "..." } }
#     ]
#   }
#
ActiveResource.Interfaces.JsonApi = class ActiveResource::Interfaces::JsonApi extends ActiveResource::Interfaces::Base
  @contentType = 'application/vnd.api+json'

  # Makes an HTTP request to a url with data
  #
  # @note Uses base request, but checks to make sure response is in JSON API format
  #
  # @param [String] url the url to query
  # @param [String] method the HTTP verb to use for the request
  # @param [Object] data the data to send to the server
  request: (url, method, data) ->
    super(url, method, data)
    .then (response) ->
      throw "Response from #{url} was not in JSON API format" unless response.data?.data? || response.status == 204
      response.data

  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------
  #                        FORMAT CONVERSION FUNCTIONS
  #                  (convert to/from underscored/camelcase)
  #               JSON format / Javascript format respectively
  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------

  # Converts an object's attributes to underscore format
  #
  # @note Usually the attributes are in camelCase format, the standard for Javascript
  #
  # @param [Object] the object to convert the attributes of to underscore format
  # @return [Object] the object with attributes in underscore format
  toUnderscored: (object) ->
    underscored = {}

    underscorize = (value) =>
      if _.isObject(value) && !value.isA?(ActiveResource::Base) && !value.isA?(ActiveResource::Collection) && !_.isDate(value)
        this.toUnderscored(value)
      else
        value

    for k, v of object
      underscored[s.underscored(k)] =
        if _.isArray(v)
          _.map v, underscorize
        else
          underscorize(v)

    underscored

  # Converts an object's attributes to camelCase format
  #
  # @note Usually the attributes are in underscore format, the standard for data
  #   from a Rails server
  #
  # @param [Object] the object to convert the attributes of to camelCase format
  # @return [Object] the object with attributes in camelCase format
  toCamelCase: (object) ->
    camelized = {}

    camelize = (value) =>
      if _.isObject(value) && !value.isA?(ActiveResource::Base) && !value.isA?(ActiveResource::Collection)
        this.toCamelCase(value)
      else
        value

    for k, v of object
      camelized[s.camelize(k)] =
        if _.isArray(v)
          _.map v, camelize
        else
          camelize(v)

    camelized

  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------
  #                 JSONAPI GET REQUEST FORMATTING FUNCTIONS
  #                 (build sparse fieldsets, include trees)
  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------

  # Takes in an object of filter key/value pairs and builds them into a JSON API filter object
  #
  # @note Used in constructing queryParams of GET queries
  # @note If value is an ActiveResource, it will be transformed to use the resource's primaryKey
  #
  # @param [Object] filters the object containing filter data to be transformed
  # @return [Object] the transformed filters
  buildFilters: (filters) ->
    this.toUnderscored(
      _.mapObject filters, (value) ->
        transformValue = (v) ->
          if v?.isA?(ActiveResource::Base)
            v[v.klass().primaryKey]
          else if _.isNull(v)
            '%00'
          else
            v

        if _.isArray(value) || value?.isA?(ActiveResource.Collection)
          ActiveResource.Collection.build(value).map((v) => transformValue(v)).join()
        else
          transformValue(value)
    )

  # Takes in an object of modelName/fieldArray pairs and joins the fieldArray into a string
  #
  # @note Used in constructing queryParams of GET queries
  # @note Will merge include queryParams into fields
  #
  # @example
  #   { order: ['id', 'updatedAt'] } # => { order: 'id,updated_at' }
  #
  # @param [Object] fields the object containing field data to be built into a fieldSet
  # @param [Object] queryParams the object containing include and __root data to be built into a fieldSet
  # @return [Object] the built field set
  #
  # 1. If queryParams.include, merge those into fields
  #   1. Iterate over of array of includes from queryParams.includes or array of objects/values from nested includes
  #   2. If string, add to keyForString, which is either queryParams.__root or the key for the nested include
  #   3. If object, split into individual keys as objects and add value to appropriate field for key
  #   4. If value of object is an array or object, split that and iterate over it until a singular value is reached
  # 2. Then, go through each key of the object, map its array of fields to underscored fields
  # 3. Take the mapped array of fields and join them, replacing the value of the key with the joined string
  buildSparseFieldset: (fields, queryParams) ->
    fields = _.clone(fields)
    if(queryParams.include)
      mergeNestedIncludes = (includes, keyForString = queryParams.__root) =>
        ActiveResource.Collection.build(includes)
        .each((include) =>
          if _.isString(include)
            fields[keyForString] ||= []
            fields[keyForString] = fields[keyForString].slice(0)
            fields[keyForString].push(include)
          else if _.isObject(include)
            if _.keys(include).length > 1
              mergeNestedIncludes(_.pick(include, k) for k in _.keys(include))
            else
              key = _.keys(include)[0]
              value = _.values(include)[0]

              if _.isArray(value)
                mergeNestedIncludes(value, key)
                return
              else if _.isObject(value)
                mergeNestedIncludes(_.pick(value, k) for k in _.keys(value))
                value = _.keys(value)[0]

              fields[key] ||= []
              fields[key] = fields[key].slice(0)
              fields[key].push(value)
        )

      mergeNestedIncludes(queryParams.include)

    this.toUnderscored(
      _.mapObject fields, (fieldArray) ->
        _.map(fieldArray, (f) -> s.underscored(f)).join()
    )

  # Takes in an array of include objects (strings, nested strings in objects) and turns them into a
  # dotted include tree
  #
  # @note Used in constructing queryParams of GET queries
  #
  # @example
  #   ['merchant','products'] # => 'merchant,products'
  #
  # @example
  #   ['merchant',{ products: ['orders','venue'] }] # => 'merchant,products.orders,products.venue'
  #
  # @param [Object] includes the array containing includes to build into an include tree
  # @return [Object] the built include tree
  #
  # 1. Iterate over each include, adding each as a formatted string to includeStrArray
  # 2. If include is object, format it by passing it into function buildNestedIncludes that
  #    takes an object { transactions: ... } and recurses over it to produce an array of
  #    strings like ['transactions.X','transactions.Y']
  #    * The object can be of three forms:
  #      1. { transactions: 'include' }
  #      2. { transactions: ['includes','includes2'] }
  #      3. { transactions: { deeperInclude: ... } }
  #    * If of form 1 or 2, it returns an array of strings with the modelName followed by the include name
  #      ['transactions.includes','transactions.includes2']
  #    * If of form 3, it recurses, passing the value { deeperInclude: ... } into buildNestedIncludes and
  #      eventually returning an array of strings ['transactions.deeperInclude.X','transactions.deeperInclude.Y']
  # 3. If include is string, it is formatted
  # 4. Return the includeStrArray as a ',' joined string
  buildIncludeTree: (includes) ->
    buildNestedIncludes = (object) ->
      _.flatten(
        _.map(object, (value, key) ->
          modelName = s.underscored(key)

          includeCollection =
            ActiveResource::Collection.build([value]).flatten().map((item) ->
              if _.isString(item)
                _.map(item.split(','), (i) -> s.underscored(i))
              else if _.isObject(item)
                buildNestedIncludes(item)
            ).flatten()

          includeCollection.map((i) -> "#{modelName}.#{i}").toArray()
        )
      )

    ActiveResource::Collection.build(includes).inject([], (includeStrArray, include) ->
      if _.isObject(include)
        includeStrArray.push buildNestedIncludes(include)...
        includeStrArray
      else
        includeStrArray.push s.underscored(include)
        includeStrArray
    ).join()

  # Builds a list of sorting params based on an object that defines asc/desc ordering
  #
  # @example
  #   { updatedAt: 'asc' } # => 'updated_at'
  #
  # @example
  #   { createdAt: 'desc', updatedAt: 'asc' }
  #   # => '-created_at,updated_at'
  #
  # @param [Object] sortObject the object defining sorting columns
  # @return [String] a JSON API formatted string that defines sorting
  buildSortList: (sortObject) ->
    output = []
    for column, dir of sortObject
      if dir == 'asc'
        output.push s.underscored(column)
      else if dir == 'desc'
        output.push "-#{s.underscored(column)}"

    output.join(',')

  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------
  #                 JSONAPI POST REQUEST FORMATTING FUNCTIONS
  #          builds resources into a resource document to send in POST,
  #                     PATCH, PUT, and DELETE requests
  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------

  # Builds a resource identifier (id + type) from a resource
  #
  # @param [ActiveResource::Base] the resource to convert to a resource identifier
  # @return [Object] the resource identifier for the object
  buildResourceIdentifier: (resource) ->
    identifier = { type: resource.klass().queryName }
    if (primaryKeyValue = resource[resource.klass().primaryKey])
      identifier[resource.klass().primaryKey] = primaryKeyValue.toString()
    identifier

  # Builds a relationship object for a resource, given a resource
  #
  # @param [ActiveResource::Base] resource the resource to get relationship data from
  # @return [Object] the built relationship object for the resource
  buildResourceRelationships: (resource, relationships, onlyChanged = false) ->
    output = {}

    _.each relationships, (relationship) =>
      reflection = resource.klass().reflectOnAssociation(relationship)

      target = resource.association(reflection.name).target

      return if !onlyChanged && ((reflection.collection() && target.empty()) || !target?)

      output[s.underscored(reflection.name)] = {
        data: this.buildResourceDocument({
          resourceData: target,
          onlyResourceIdentifiers: !reflection.autosave(),
          onlyChanged: onlyChanged,
          parentReflection:
            if reflection.polymorphic()
              reflection.polymorphicInverseOf(target.klass())
            else
              reflection.inverseOf()
        })
      }

    output

  # Builds a resource document in JSON API format to be sent to the server in persistence calls
  #
  # @param [ActiveResource::Base,Array<ActiveResource::Base>] resourceData the resourceData to convert to a resource document
  # @param [Boolean] onlyResourceIdentifiers if true, only renders the primary key/type (a resource identifier)
  #   if false, also renders attributes and relationships
  # @return [Array] an array of resource identifiers, possibly with attributes/relationships
  buildResourceDocument: ({ resourceData, onlyResourceIdentifiers, onlyChanged, parentReflection }) ->
    onlyResourceIdentifiers = onlyResourceIdentifiers || false
    onlyChanged = onlyChanged || false

    data =
      ActiveResource::Collection.build(resourceData).compact().map (resource) =>
        documentResource = this.buildResourceIdentifier(resource)

        unless onlyResourceIdentifiers
          attributes = _.omit(resource.attributes({ readWrite: true }), resource.klass().primaryKey)
          relationships = _.keys(resource.klass().reflections())

          if parentReflection
            unless parentReflection.polymorphic() && @resourceLibrary.includePolymorphicRepeats
              relationships = _.without(relationships, parentReflection.name)

          if onlyChanged
            changedFields = resource.changedFields().toArray()
            attributes = _.pick(attributes, changedFields...)
            relationships = _.intersection(relationships, changedFields)

          documentResource['attributes'] = this.toUnderscored(attributes) if !_.isEmpty(attributes)
          documentResource['relationships'] = this.buildResourceRelationships(resource, relationships, onlyChanged) if !_.isEmpty(relationships)

        documentResource

    if _.isArray(resourceData) || (_.isObject(resourceData) && resourceData.isA?(ActiveResource::Collection))
      data.toArray()
    else
      data.first() || null

  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------
  #                 JSONAPI RESPONSE CONSTRUCTION FUNCTIONS
  #          (takes JSONAPI responses and builds them into resources)
  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------

  # Builds a "resource" from the JSON API into an ActiveResource of type `type`
  #
  # @example
  #   Before: Object{ id: '100', type: 'orders', attributes: { verification_code: '...' }, relationships: { ... } }
  #   After:  Order{ id: 100, verificationCode: '...' }
  #
  # @param [Object] data the data of the resource to instantiate
  # @param [Array] includes the array of includes to search for resource relationships in
  # @param [ActiveResource::Base] existingResource an existingResource to use instead of building a new one
  # @param [ActiveResource::Base] parentRelationship the owner relationship name/resource that is building this resource
  # @param [Object] resourceRegister cache of resources for the query that have already been created, to avoid duplicate creation
  # @return [ActiveResource] the built ActiveResource
  buildResource: (data, includes, { existingResource, parentRelationship, primaryData, resourceRegister }) ->
    resource = existingResource || @resourceLibrary.constantize(_.singularize(s.classify(data['type']))).build()
    justCreated = existingResource && existingResource.newResource()
    resourceRegister = resourceRegister || {}

    attributes = data['attributes'] || {}
    relationships = data['relationships'] || {}

    if data[resource.klass().primaryKey]
      id = data[resource.klass().primaryKey].toString()
      attributes[resource.klass().primaryKey] = id

      resourceRegister[resource.klass().queryName] = resourceRegister[resource.klass().queryName] || {}
      resourceRegister[resource.klass().queryName][id] = resource

    if parentRelationship?
      attributes = _.extend(attributes, parentRelationship)

      if !resource.association(_.keys(parentRelationship)[0]).reflection.collection()
        relationships = _.omit(relationships, _.keys(parentRelationship)[0])

    attributes = @addRelationshipsToFields(attributes, relationships, includes, primaryData, resource, resourceRegister)
    attributes = this.toCamelCase(attributes)

    resource.__assignFields(attributes)

    resource.__links = _.extend(resource.links(), data['links'])
    resource.klass().reflectOnAllAssociations().each (reflection) =>
      association = resource.association(reflection.name)

      if(relationshipLinks = data['relationships']?[s.underscored(reflection.name)]?['links'])?
        association.__links = _.extend(association.links(),
          _.mapObject(relationshipLinks, (l) =>
            ActiveResource::Links.__constructLink(l)
          )
        )
      else if (selfLink = resource.links()['self'])?
        url_safe_reflection_name = s.underscored(reflection.name)
        association.__links = {
          self: ActiveResource::Links.__constructLink(selfLink, 'relationships', url_safe_reflection_name),
          related: ActiveResource::Links.__constructLink(selfLink, url_safe_reflection_name)
        }

      relationshipEmpty =
        if _.isObject(relationship = data['relationships']?[s.underscored(reflection.name)]?['data'])
          _.keys(relationship).length == 0
        else if @resourceLibrary.immutable
          !_.isUndefined(relationship) && (_.isNull(relationship) || _.isEmpty(relationship) || _.has(attributes, reflection.name))
        else if relationship?
          relationship.length == 0
        else
          true

      association.loaded(true) if _.has(attributes, reflection.name) || relationshipEmpty

    if justCreated
      resource.__executeCallbacks('afterCreate')
    resource.__executeCallbacks('afterRequest')

    resource

  # Interprets all the relationships identified in a resource, searching the `included` part of the response
  #   for each object of each relationship and building it into the resource attributes
  #
  # @example singular relationship
  #   object = {
  #     id: '10', type: 'orders',
  #     attributes: { verification_code: '...' },
  #     relationships: {
  #       product: { data: { id: '1202', type: 'products' } }
  #     }
  #   }
  #  included = [
  #    { id: '1202', type: 'products', attributes: { title: '...' } }
  #  ]
  #
  #   sets attributes['product'] = Product{ id: 1202, title: '...' }
  #   @note (this is the instantiated ActiveResource class for the include)
  #
  # @example plural relationship
  #   object = {
  #     id: '10', type: 'merchants',
  #     attributes: { name: '...' },
  #     relationships: {
  #       products: { data: [{ id: '1202', type: 'products' },{ id: '1203', type: 'products' }] }
  #     }
  #   }
  #  included = [
  #    { id: '1202', type: 'products', attributes: { title: '...' } },
  #    { id: '1202', type: 'products', attributes: { title: '...' } }
  #  ]
  #
  #   sets attributes['products'] = [
  #     Product{ id: 1202, title: '...' },
  #     Product{ id: 1203, title: '...' }
  #   ]
  #
  # @param [Object] attributes the attribute object to build relationships into
  # @param [Object] relationships the object defining the relationships to be built into `attributes`
  # @param [Array] includes the array of includes to search for relationship resources in
  # @param [Array] primaryData the array of includes to search for relationship resources in after includes
  # @param [ActiveResource::Base] resource the resource to get the primary key of
  # @param [Object] resourceRegister cache of resources for the query that have already been created, to avoid duplicate creation
  # @return [Object] the attributes with all relationships built into it
  addRelationshipsToFields: (attributes, relationships, includes, primaryData, resource, resourceRegister) ->
    _.each relationships, (relationship, relationshipName) =>
      if(reflection = resource.klass().reflectOnAssociation(s.camelize(relationshipName)))
        if reflection.collection()
          relationshipItems =
            ActiveResource::Collection.build(relationship['data'])
            .map((relationshipMember, index) =>
              cachedResource = resourceRegister[relationshipMember['type']]?[relationshipMember[resource.klass().primaryKey]]
              cachedResource || @findResourceForRelationship(relationshipMember, includes, primaryData, resource, reflection, resourceRegister, index)
            ).compact()

          attributes[relationshipName] = relationshipItems unless relationshipItems.empty?()
        else if relationship['data']?
          cachedResource = resourceRegister[relationship['data']['type']]?[relationship['data'][resource.klass().primaryKey]]
          include = cachedResource || @findResourceForRelationship(relationship['data'], includes, primaryData, resource, reflection, resourceRegister)
          attributes[relationshipName] = include if include?

    attributes

  # Finds a resource in the 'included' collection of the response, based on relationship data taken from another
  #   resource, and builds it into an ActiveResource
  # @note If an include is not found, but relationship data is present, the resource identifiers are matched to
  #   resources already on the existing relationship so that these resources will be moved into __fields
  #
  # @example
  #   relationshipData = { id: '1202', type: 'products' }
  #   includes = [{ id: '102', type: 'orders', attributes: { ... }, { id: '1202', type: 'products', attributes: { ... } }]
  #   returns { id: '1202', type: 'products', ... }
  #
  # @param [Object] relationshipData the data defining the relationship to match an include to
  # @param [Array] includes the array of includes to search for relationships in
  # @param [Array] primaryData the array of primaryData to search for relationships in after includes
  # @param [ActiveResource::Base] resource the resource to get the primary key of
  # @param [Reflection] reflection the reflection for the relationship
  # @param [Object] resourceRegister cache of resources for the query that have already been created, to avoid duplicate creation
  # @param [Integer] index the index of the relationship data (only in collection relationships)
  # @return [ActiveResource::Base] the include built into an ActiveResource::Base
  findResourceForRelationship: (relationshipData, includes, primaryData, resource, reflection, resourceRegister, index) ->
    primaryKey = resource.klass().primaryKey

    findConditions = { type: relationshipData.type }
    findConditions[primaryKey] = relationshipData[primaryKey]

    include = _.findWhere(includes, findConditions)
    include = include || _.findWhere(primaryData, findConditions)

    if reflection.collection()
      target =
        resource.association(reflection.name).target.detect((t) => t[primaryKey] == findConditions[primaryKey]) ||
          resource.association(reflection.name).target.get(index)

    else if(potentialTarget = resource.association(reflection.name).target)?
      if !reflection.polymorphic() || potentialTarget.klass().queryName == findConditions['type']
        target = potentialTarget

    buildResourceOptions = { resourceRegister: resourceRegister }
    if reflection.polymorphic()
      parentReflection = reflection.polymorphicInverseOf(this.resourceLibrary.constantize(_.singularize(s.classify(relationshipData['type']))))
    else
      parentReflection = reflection.inverseOf()

    if parentReflection?
      buildResourceOptions.parentRelationship = {}
      buildResourceOptions.parentRelationship[parentReflection.name] =
        if parentReflection.collection()
          [resource]
        else
          resource

    if target?
      buildResourceOptions.existingResource = target

    if target? || include?
      @buildResource(include || {}, includes, buildResourceOptions)


  # Merges the changes made from a POST/PUT/PATCH call into the resource that called it
  #
  # @param [Object] response The response to pull persisted changes from
  # @param [ActiveResource::Base] the resource to merge persisted changes into
  # @return [ActiveResource::Base] the resource, now persisted, with updated changes
  mergePersistedChanges: (response, resource) ->
    resource.responseMeta(this.toCamelCase(response['meta'] || {}))
    @buildResource(response['data'], response['included'], existingResource: resource)

  # Adds errors in making a POST/PUT/PATCH call into the resource that called it
  #
  # @note The format for resource errors is as follows:
  #   {
  #     "errors": [
  #       {
  #         "source": { "pointer": "/data/attributes/title" },
  #         "code": "blank",
  #         "detail": "Title cannot be blank."
  #       },
  #       {
  #         "source": { "pointer": "/data/relationships/product" },
  #         "code": "blank",
  #         "detail": "Product cannot be blank."
  #       },
  #       {
  #         "source": { "pointer": "/data/relationships/product/data/attributes/title" },
  #         "code": "blank",
  #         "detail": "Title cannot be blank."
  #       }
  #     ]
  #   }
  #
  # @param [Object] response The response to pull errors from
  # @param [ActiveResource::Base] the resource to add errors onto
  # @return [ActiveResource::Base] the unpersisted resource, now with errors
  resourceErrors: (resource, errors) ->
    errorCollection =
      ActiveResource.Collection.build(errors).map((error) ->
        field = []
        if error['source']['pointer'] == '/data'
          field.push 'base'
        else
          _.each error['source']['pointer'].split('/data'), (i) ->
            if(m = i.match(/\/(attributes|relationships|)\/(\w+)/))?
              field.push s.camelize(m[2])

        resource.errors().__buildError(field.join('.'), s.camelize(error['code']), error['detail'])
      )

    resource.errors().propagate(errorCollection)
    resource

  # De-serializes errors from the error response to GET and DELETE requests,
  # which will be of the form: { source: { parameter: '...' } }
  #
  # @note The format for parameter errors is as follows:
  #   {
  #     "errors": [
  #       {
  #         "source": { "parameter": "a_parameter" },
  #         "code": "invalid",
  #         "detail": "a_parameter was invalid."
  #       }
  #     ]
  #   }
  #
  # @param [Array] errors the errors to de-serialize
  # @return [Collection] the collection of errors
  parameterErrors: (errors) ->
    ActiveResource::Collection.build(errors).map((error) ->
      out = { detail: error['detail'], message: error['detail'] }
      out['parameter'] = s.camelize(error['source']['parameter']) if error['source']?['parameter']?
      out['code'] = s.camelize(error['code'])
      out
    )

  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------
  #                          HTTP REQUEST METHODS
  #          (takes JSONAPI responses and builds them into resources)
  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------

  # Make GET request
  #
  # @param [String] url the url to query
  # @param [Object] queryParams query params to send to the server
  get: (url, queryParams = {}) ->
    data = {}
    data['filter']  = this.buildFilters(queryParams['filter'])        if queryParams['filter']?
    if queryParams['fields']?
      data['fields']  = this.buildSparseFieldset(queryParams['fields'], queryParams)
    data['include'] = this.buildIncludeTree(queryParams['include'])   if queryParams['include']?
    data['sort']    = this.buildSortList(queryParams['sort'])         if queryParams['sort']?

    data['page']    = queryParams['page']                        if queryParams['page']?
    data['limit']   = queryParams['limit']                       if queryParams['limit']?
    data['offset']  = queryParams['offset']                      if queryParams['offset']?

    _this = this
    @request(url, 'GET', data)
    .then (response) ->
      primaryData = ActiveResource::CollectionResponse.build(_.flatten([response.data]))
      built =
        primaryData
        .map (object) ->
          object = _this.buildResource(object, response.included, { primaryData: primaryData.toArray() })
          object.assignResourceRelatedQueryParams(queryParams)
          object

      built.links(response.links)
      built.meta(_this.toCamelCase(response.meta || {}))

      if _.isArray(response.data)
        output = built
      else
        output = built.first()
        output.responseMeta(built.meta())

      output
    , (errors) ->
      Promise.reject(_this.parameterErrors(errors.response.data['errors']))

  # Make POST request
  #
  # @param [String] url the url to query
  # @param [Object] resourceData the resourceData to send to the server
  # @param [Object] options options that may modify the data sent to the server
  # @option [Boolean] onlyResourceIdentifiers if false, render the attributes and relationships
  #   of each resource into the resource document
  post: (url, resourceData, options = {}) ->
    data = { data: this.buildResourceDocument(resourceData: resourceData, onlyResourceIdentifiers: options['onlyResourceIdentifiers']) }

    unless options['onlyResourceIdentifiers']
      queryParams = resourceData.queryParams()

      if queryParams['fields']?
        data['fields']  = this.buildSparseFieldset(queryParams['fields'], queryParams)
      data['include'] = this.buildIncludeTree(queryParams['include'])   if queryParams['include']?

    _this = this
    @request(url, 'POST', data)
    .then (response) ->
      if options['onlyResourceIdentifiers']
        response
      else
        _this.mergePersistedChanges(response, resourceData)
    , (errors) ->
      if options['onlyResourceIdentifiers']
        Promise.reject(errors)
      else
        Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']))

  # Make PATCH request
  #
  # @param [String] url the url to query
  # @param [Object] resourceData the resourceData to send to the server
  # @param [Object] options options that may modify the data sent to the server
  #   @see #post
  patch: (url, resourceData, options = {}) ->
    data = {
      data: this.buildResourceDocument({
        resourceData: resourceData,
        onlyResourceIdentifiers: options['onlyResourceIdentifiers'],
        onlyChanged: true
      })
    }

    unless options['onlyResourceIdentifiers']
      queryParams = resourceData.queryParams()

      if queryParams['fields']?
        data['fields']  = this.buildSparseFieldset(queryParams['fields'], queryParams)
      data['include'] = this.buildIncludeTree(queryParams['include'])   if queryParams['include']?

    _this = this
    @request(url, 'PATCH', data)
    .then (response) ->
      if options['onlyResourceIdentifiers']
        response
      else
        _this.mergePersistedChanges(response, resourceData)
    , (errors) ->
      if options['onlyResourceIdentifiers']
        Promise.reject(errors)
      else
        Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']))

  # Make PUT request
  #
  # @param [String] url the url to query
  # @param [Object] resourceData the resourceData to send to the server
  # @param [Object] options options that may modify the data sent to the server
  #   @see #post
  put: (url, resourceData, options = {}) ->
    data = { data: this.buildResourceDocument(resourceData: resourceData, onlyResourceIdentifiers: options['onlyResourceIdentifiers']) }

    unless options['onlyResourceIdentifiers']
      queryParams = resourceData.queryParams()

      if queryParams['fields']?
        data['fields']  = this.buildSparseFieldset(queryParams['fields'], queryParams)
      data['include'] = this.buildIncludeTree(queryParams['include'])   if queryParams['include']?

    _this = this
    @request(url, 'PUT', data)
    .then (response) ->
      if options['onlyResourceIdentifiers']
        response
      else
        _this.mergePersistedChanges(response, resourceData)
    , (errors) ->
      if options['onlyResourceIdentifiers']
        Promise.reject(errors)
      else
        Promise.reject(_this.resourceErrors(resourceData, errors.response.data['errors']))

  # Make DELETE request
  #
  # @note There are two instances where a DELETE request will be made
  #   1. A resource is to be deleted, by calling `DELETE /api/v1/:type/:id`
  #     * In this case, the data will simply be {}
  #   2. A relationship is to have members removed, by calling `DELETE /api/v1/:type/:id/relationships/:relationship`
  #     * In this case, the data will have to be resource identifiers
  #
  # @param [String] url the url to query
  # @param [Object] resourceData the resourceData to send to the server
  # @param [Object] options options that may modify the data sent to the server
  #   @see #post
  delete: (url, resourceData, options = {}) ->
    data =
      if resourceData?
        { data: this.buildResourceDocument(resourceData: resourceData, onlyResourceIdentifiers: true) }
      else
        {}

    _this = this
    @request(url, 'DELETE', data)
    .then null
    , (errors) ->
      if errors.response.data
        Promise.reject(_this.parameterErrors(errors.response.data['errors']))
      else
        Promise.reject(null)
