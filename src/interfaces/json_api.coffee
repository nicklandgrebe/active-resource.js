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
class ActiveResource::Interfaces::JsonApi extends ActiveResource::Interfaces::Base
  # Makes an HTTP request to a url with data
  #
  # @note Uses base request, but checks to make sure response is in JSON API format
  #
  # @param [String] url the url to query
  # @param [String] method the HTTP verb to use for the request
  # @param [Object] data the data to send to the server
  @request: (url, method, data) ->
    super
    .then (response, textStatus, xhr) ->
      throw "Response from #{url} was not in JSON API format" unless response?.data? || xhr.status == 204
      response

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
  toUnderscored = (object) ->
    underscored = {}
    for k, v of object
      underscored[s.underscored(k)] =
        if _.isArray(v)
          _.map v, (i) ->
            toUnderscored(i)
        else if _.isObject(v) && !v.isA?(ActiveResource::Base) && !v.isA?(ActiveResource::Collection)
          toUnderscored(v)
        else
          v

    underscored

  # Converts an object's attributes to camelCase format
  #
  # @note Usually the attributes are in underscore format, the standard for data
  #   from a Rails server
  #
  # @param [Object] the object to convert the attributes of to camelCase format
  # @return [Object] the object with attributes in camelCase format
  toCamelCase = (object) ->
    camelized = {}
    for k, v of object
      camelized[s.camelize(k)] =
        if _.isArray(v)
          _.map v, (i) ->
            toCamelCase(i)
        else if _.isObject(v) && !v.isA?(ActiveResource::Base) && !v.isA?(ActiveResource::Collection)
          toCamelCase(v)
        else
          v

    camelized

  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------
  #                 JSONAPI GET REQUEST FORMATTING FUNCTIONS
  #                 (build sparse fieldsets, include trees)
  #---------------------------------------------------------------------------
  #---------------------------------------------------------------------------

  # Takes in an object of modelName/fieldArray pairs and joins the fieldArray into a string
  #
  # @note Used in constructing queryParams of GET queries
  #
  # @example
  #   { order: ['id', 'updatedAt'] } # => { order: 'id,updated_at' }
  #
  # @param [Object] fields the object containing field data to be built into a fieldSet
  # @return [Object] the built field set
  #
  # 1. Go through each key of the object, map its array of fields to underscored fields
  # 2. Take the mapped array of fields and join them, replacing the value of the key with the joined string
  buildSparseFieldset = (fields) ->
    _.mapObject fields, (fieldArray) ->
      _.map(fieldArray, (f) -> s.underscored(f)).join()

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
  buildIncludeTree = (includes) ->
    buildNestedIncludes = (object) ->
      modelName = s.underscored(_.keys(object)[0])
      value = _.values(object)[0]

      includeCollection =
        ActiveResource::Collection.build([value]).flatten().map((item) ->
          if _.isString(item)
            _.map(item.split(','), (i) -> s.underscored(i))
          else if _.isObject(item)
            buildNestedIncludes(item)
        ).flatten()

      includeCollection.map((i) -> "#{modelName}.#{i}").toArray()

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
  buildSortList = (sortObject) ->
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
  buildResourceIdentifier = (resource) ->
    identifier = { type: resource.klass().queryName }
    if (primaryKeyValue = resource[resource.klass().primaryKey])
      identifier[resource.klass().primaryKey] = primaryKeyValue
    identifier

  # Builds a relationship object for a resource, given a resource
  #
  # @param [ActiveResource::Base] resource the resource to get relationship data from
  # @return [Object] the built relationship object for the resource
  #
  # 1. Iterate over every reflection (a relationship definition) for the resource klass
  # 2. If the reflection is a collection, ensure the association target is not empty, then map the
  #    association to relationships[reflection.name] = { data: [...] }
  # 3. If the reflection is not a collection, ensure the association target is present, then render
  #    the association to relationships[reflection.name] = { data: { ... } }
  # 4. Each association target is rendered first as a resource identifier ({ id: '...', type: '...' }),
  #    then attributes are rendered with it, but ONLY if the association is autosaving (this is how
  #    we save the object to the server)
  # 5. Return the built relationship object
  buildResourceRelationships = (resource) ->
    relationships = {}
    autosaveReflections = resource.klass().reflectOnAllAutosaveAssociations()

    resource.klass().reflectOnAllAssociations().each (reflection) ->
      autosaving = autosaveReflections.include(reflection)

      if reflection.collection()
        unless resource.association(reflection.name).empty()
          relationships[s.underscored(reflection.name)] =
            data:
              resource.association(reflection.name).reader()
              .all(cached: true).map((target) ->
                output = buildResourceIdentifier(target)
                if autosaving
                  output['attributes'] = _.omit(target.attributes(), resource.klass().primaryKey)
                output
              ).toArray()
      else
        if resource.association(reflection.name).reader()?
          target = resource.association(reflection.name).reader()
          output = buildResourceIdentifier(target)
          if autosaving
            output['attributes'] = _.omit(target.attributes(), resource.klass().primaryKey)

          relationships[s.underscored(reflection.name)] = { data: output }

    relationships

  # Builds a resource document in JSON API format to be sent to the server in persistence calls
  #
  # @param [ActiveResource::Base,Array<ActiveResource::Base>] resourceData the resourceData to convert to a resource document
  # @param [Boolean] onlyResourceIdentifiers if true, only renders the primary key/type (a resource identifier)
  #   if false, also renders attributes and relationships
  # @return [Array] an array of resource identifiers, possibly with attributes/relationships
  #
  # 1. Iterate over each resource to be built into the resource document
  # 2. Create a `documentResource` representation of form: { id: ..., type: ... } for the resource
  # 3. Unless `onlyResourceIdentifiers`, add { attributes: { ... } } to the resource
  # 4. Unless `onlyResourceIdentifiers`, add { relationships: { ... } } to the resource in form:
  #    { relationships: { relationship_name: { data: [resource identifier(s)] } } }
  # 5. Return built resource document, either as an object (singular resource), or array (collection of resources)
  buildResourceDocument = (resourceData, onlyResourceIdentifiers = false) ->
    data =
      ActiveResource::Collection.build(resourceData).compact().map (resource) ->
        documentResource = buildResourceIdentifier(resource)

        unless onlyResourceIdentifiers
          documentResource['attributes'] = toUnderscored(_.omit(resource.attributes(), resource.klass().primaryKey))
          documentResource['relationships'] = buildResourceRelationships(resource)

        documentResource

    if _.isArray(resourceData)
      data.toArray()
    else
      data.first()

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
  # @return [ActiveResource] the built ActiveResource
  #
  # 1. If an existingResource was provided, build everything into that resource
  # 2. If an existingResource was not provided, build a resource of type `type` and build everything into that
  # 3. Construct an object `attributes` that is made up of the resource primary key, plus its attributes
  # 4. Add all the relationships "included" in the response to the `attributes` object (product, order, etc.)
  # 5. Convert the attributes object toCamelCase (Javascript format)
  # 6. Assign the attributes to the resource
  # 7. Assign the links provided in the response to the resource
  # 8. Assign the relationship links provided in the response to the resource
  # 9. Return the built resource
  buildResource = (data, includes, existingResource) ->
    resource = existingResource || ActiveResource.constantize(_.singularize(s.classify(data['type']))).build()

    # If primaryKey is `id`, we want it as an int. If it were, say, `token`, we leave it alone
    if resource.klass().primaryKey == 'id'
      data['id'] = parseInt(data['id'])

    attributes = _.extend(_.omit(data, 'type', 'attributes', 'links', 'relationships'), data['attributes'])
    attributes = addRelationshipsToAttributes(attributes, data['relationships'], includes, resource)

    resource.assignAttributes(toCamelCase(attributes))

    resource.__links = _.pick(data['links'], 'self')
    resource.klass().reflectOnAllAssociations().each (reflection) ->
      association = resource.association(reflection.name)
      association.__links = data['relationships']?[s.underscored(reflection.name)]?['links']

      relationshipEmpty =
        if _.isObject(relationship = data['relationships']?[s.underscored(reflection.name)]?['data'])
          _.keys(relationship).length == 0
        else if relationship?
          relationship.length == 0
        else
          true

      association.loaded(true) if _.has(attributes, reflection.name) || relationshipEmpty

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
  # @param [ActiveResource::Base] resource the resource to get the primary key of
  # @return [Object] the attributes with all relationships built into it
  #
  # 1. Iterate over each relationship defined in the resource's `relationships` member
  # 2. If the relationship is a collection, go through each item of the collection and find it
  #    in the `includes`, compacting it to remove null values
  # 3. If the relationship is singular, find it in `includes`
  # 4. Only assign the relationship to the attributes if it is not null/empty
  # 5. Return the attributes with all existing relationships built into it
  addRelationshipsToAttributes = (attributes, relationships, includes, resource) ->
    _.each relationships, (relationship, relationshipName) ->
      if _.isArray(relationship['data']) # plural association
        relationshipItems =
          ActiveResource::Collection.build(relationship['data'])
          .map((relationshipMember) ->
            findIncludeFromRelationship(relationshipMember, includes, resource)
          ).compact()

        attributes[relationshipName] = relationshipItems unless relationshipItems.empty?()
      else if relationship['data']? # singular association
        include = findIncludeFromRelationship(relationship['data'], includes, resource)
        attributes[relationshipName] = include if include?

    attributes

  # Finds a resource in the 'included' collection of the response, based on relationship data taken from another
  #   resource, and builds it into an ActiveResource
  #
  # @example
  #   relationshipData = { id: '1202', type: 'products' }
  #   includes = [{ id: '102', type: 'orders', attributes: { ... }, { id: '1202', type: 'products', attributes: { ... } }]
  #   returns { id: '1202', type: 'products', ... }
  #
  # @param [Object] relationshipData the data defining the relationship to match an include to
  # @param [Array] includes the array of includes to search for relationships in
  # @param [ActiveResource::Base] resource the resource to get the primary key of
  # @return [ActiveResource::Base] the include built into an ActiveResource::Base
  #
  # 1. Build a resource identnfier from the relationship data type and primary key
  # 2. Find the include in `includes` using the resource identifier
  # 3. Build the include into an ActiveResource if it exists
  # 4. Return the built include or null
  findIncludeFromRelationship = (relationshipData, includes, resource) ->
    findConditions = { type: relationshipData.type }
    findConditions[resource.klass().primaryKey] = relationshipData[resource.klass().primaryKey]

    if(include = _.findWhere(includes, findConditions))?
      include = buildResource(include, includes)
    include

  # Merges the changes made from a POST/PUT/PATCH call into the resource that called it
  #
  # @param [Object] response The response to pull persisted changes from
  # @param [ActiveResource::Base] the resource to merge persisted changes into
  # @return [ActiveResource::Base] the resource, now persisted, with updated changes
  #
  # 1. Use buildresource to build the changed attributes, relationships, and links into the existing resource
  # 2. Return the built resource
  mergePersistedChanges = (response, resource) ->
    buildResource(response['data'], response['included'], resource)

  # Adds errors in making a POST/PUT/PATCH call into the resource that called it
  #
  # @param [Object] response The response to pull errors from
  # @param [ActiveResource::Base] the resource to add errors onto
  # @return [ActiveResource::Base] the unpersisted resource, now with errors
  #
  # 1. Iterate over each error
  # 2. If error has a field, add it to that field, otherwise add it to base
  # 3. Add error to resource
  addErrorsFromPersistenceAttempt = (errors, resource) ->
    _.each errors, (error) ->
      resource.errors().add(s.camelize(error.field) || 'base', s.camelize(error.key), error.message)
    resource

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
  #
  # 1. Convert all filter params to underscored format for server
  # 2. Convert fields params to a JSON API sparse fieldset
  # 3. Convert include params to a JSON API include tree
  # 4. Convert sort params defined with `'asc'`, `'desc'` to JSON API format
  # 5. Make a GET request to the specified URL
  # 6. Iterate over each resource in the response and build it into an ActiveResource
  # 7. If `include` or `fields` params were included in request, add them to resources so the
  #    resources can reload themselves accurately using the same query params
  @get: (url, queryParams = {}) ->
    data = {}
    data['filter']  = toUnderscored(queryParams['filter'])       if queryParams['filter']?
    data['fields']  = buildSparseFieldset(queryParams['fields']) if queryParams['fields']?
    data['include'] = buildIncludeTree(queryParams['include'])   if queryParams['include']?
    if queryParams['sort']?
      data['sort']    = buildSortList(queryParams['sort'])
    data['page']    = queryParams['page']                        if queryParams['page']?

    @request(url, 'GET', data)
    .then (response) ->
      built =
        ActiveResource::Collection.build(_.flatten([response.data]))
        .map (object) ->
          object = buildResource(object, response.included)
          object.__queryOptions = _.pick(queryParams, 'include', 'fields')
          object

      if _.isArray(response.data) then built else built.first()
    , (errors) ->
      ActiveResource::Collection.build(errors.responseJSON).map((error) ->
        error['field'] = s.camelize(error['field'])
        error['key'] = s.camelize(error['key'])
        error
      )

  # Make POST request
  #
  # @param [String] url the url to query
  # @param [Object] resourceData the resourceData to send to the server
  # @param [Object] options options that may modify the data sent to the server
  # @option [Boolean] onlyResourceIdentifiers if false, render the attributes and relationships
  #   of each resource into the resource document
  #
  # 1. Build a resource document out of the resources passed in
  # 2. Add queryOptions (only `fields` and `include`) so the response will contain those fields
  # 3. Make POST request with the resource document
  # 4. If request was successful, and a full document was returned (true unless `onlyResourceIdentifiers`),
  #    merge the changes in attributes/relationships made on the server to the persisted resource
  # 5. If request failed, add the errors in the persistence attempt to the errors object of the resource
  @post: (url, resourceData, options = {}) ->
    data = { data: buildResourceDocument(resourceData, options['onlyResourceIdentifiers']) }

    unless options['onlyResourceIdentifiers']
      data = _.extend(data, ActiveResource::Collection.build(resourceData).first().__queryOptions)

    @request(url, 'POST', data)
    .then (response) ->
      if options['onlyResourceIdentifiers']
        response
      else
        mergePersistedChanges(response, resourceData)
    , (errors) ->
      if options['onlyResourceIdentifiers']
        errors
      else
        addErrorsFromPersistenceAttempt(errors.responseJSON, resourceData)

  # Make PATCH request
  #
  # @param [String] url the url to query
  # @param [Object] resourceData the resourceData to send to the server
  # @param [Object] options options that may modify the data sent to the server
  #   @see #post
  @patch: (url, resourceData, options = {}) ->
    data = { data: buildResourceDocument(resourceData, options['onlyResourceIdentifiers']) }

    unless options['onlyResourceIdentifiers']
      data = _.extend(data, ActiveResource::Collection.build(resourceData).first().__queryOptions)

    @request(url, 'PATCH', data)
    .then (response) ->
      if options['onlyResourceIdentifiers']
        response
      else
        mergePersistedChanges(response, resourceData)
    , (errors) ->
      if options['onlyResourceIdentifiers']
        errors
      else
        addErrorsFromPersistenceAttempt(errors.responseJSON, resourceData)

  # Make PUT request
  #
  # @param [String] url the url to query
  # @param [Object] resourceData the resourceData to send to the server
  # @param [Object] options options that may modify the data sent to the server
  #   @see #post
  @put: (url, resourceData, options = {}) ->
    data = { data: buildResourceDocument(resourceData, options['onlyResourceIdentifiers']) }

    unless options['onlyResourceIdentifiers']
      data = _.extend(data, ActiveResource::Collection.build(resourceData).first().__queryOptions)

    @request(url, 'PUT', data)
    .then (response) ->
      if options['onlyResourceIdentifiers']
        response
      else
        mergePersistedChanges(response, resourceData)
    , (errors) ->
      if options['onlyResourceIdentifiers']
        errors
      else
        addErrorsFromPersistenceAttempt(errors.responseJSON, resourceData)

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
  #
  # 1. If resourceData was provided, build a resource document out of it using only resource identifiers
  # 2. If resourceData was not provided, send nothing as data to the server
  # 3. Make DELETE request
  @delete: (url, resourceData, options = {}) ->
    data =
      if resourceData?
        { data: buildResourceDocument(resourceData, true) }
      else
        {}

    @request(url, 'DELETE', data)
