class ActiveResource::QueryParams
  # private

  RESOURCE_RELATED = ['fields', 'include']
  COLLECTION_RELATED = ['filter', 'sort', 'page']

  # Gets a queryParams object for `this`
  #
  # If `this` is an instance of a class, instantiate its queryParams with that of its classes,
  # which will have built-in queryParams from autosave associations and `fields` declarations
  #
  # TODO: Add autosave associations to default klass().queryParams (returns {} right now)
  # @return [Object] the queryParams for `this`
  @queryParams: ->
    @__queryParams ||=
      if @isA?(ActiveResource::Base)
        _.clone(@klass().queryParams())
      else
        {}

  # Gets the queryParams for a given reflection of a resource's class
  #
  # @note This is used by associations when doing any queries (reload, etc) to get the
  #   includes/fields that the association was initially created with in their owner's call,
  #   thus maintaining their fields/includes instead of getting all fields & no includes:
  #
  # @example
  #   Product.includes(orders: 'customer').select('title', orders: ['price']).first()
  #   .then (resource) ->
  #     resource.queryParamsForReflection(resource.klass().reflectOnAssociation('orders'))
  #     => { includes: ['customer'], fields: { orders: ['price'] } }
  #
  # @param [Reflection] reflection the reflection to get queryParams for
  # @return [Object] the queryParams for the reflections
  @queryParamsForReflection: (reflection) ->
    queryParams = {}

    if @queryParams()['include']?
      includes =
        ActiveResource::Collection.build(@queryParams()['include']).inject [], (out, i) ->
          if _.isObject(i)
            _.each _.keys(i), (i2) ->
              if i2 == reflection.name
                out.push _.flatten([i[i2]])...
          out

      queryParams['include'] = includes unless includes.length == 0

    if !reflection.polymorphic?() && @queryParams()['fields']?[reflection.klass().queryName]?
      queryParams['fields'] = _.pick(@queryParams()['fields'], reflection.klass().queryName)

    queryParams

  @assignQueryParams: (queryParams) ->
    @__queryParams = queryParams

  # Used to assign only resource related queryParams like `fields` and `include` to an object
  #
  # @param [Object] queryParams the queryParams to pick resource related params out of and assign
  #   to `this`
  @assignResourceRelatedQueryParams: (queryParams) ->
    @assignQueryParams(_.pick(queryParams, RESOURCE_RELATED...))

  @resetQueryParams: ->
    @__queryParams = {}

  @__resourceRelatedParams: ->
    _.pick(@queryParams(), RESOURCE_RELATED...)

  @__collectionRelatedParams: ->
    _.pick(@queryParams(), COLLECTION_RELATED...)

  # Extends a value param of queryParams with the new value passed in
  #
  # @example
  #   @__queryParams = { limit: 2 }
  #   param = 'limit'
  #   value = 5
  #
  #   return { limit: 5 }
  #
  # @note queryParams defaults to @__queryParams, but this function can be used
  #   to modify any object
  #
  # @param [String] param the name of the param to extend
  # @param [Object] value the value to replace on the param
  # @param [Object] queryParams the object to modify instead of @__queryParams
  # @return [Object] the extended queryParams
  @__extendValueParam: (param, value, queryParams) ->
    queryParams ||= _.clone(@queryParams())
    queryParams[param] = value
    queryParams

  # Extends an object param of queryParams with the options passed in
  #
  # @example
  #   @__queryParams = { fields: { order: '...' } }
  #   param = 'fields'
  #   options = { transactions: 'id,amount' }
  #
  #   return { fields: { order: '...', transactions: 'id,amount' } }
  #
  # @note queryParams defaults to @__queryParams, but this function can be used
  #   to modify any object
  #
  # @param [String] param the name of the param to extend
  # @param [Object] options the options to add to the param
  # @param [Object] queryParams the object to modify instead of @__queryParams
  # @return [Object] the extended queryParams
  @__extendObjectParam: (param, options, queryParams) ->
    queryParams ||= _.clone(@queryParams())
    queryParams[param] = _.extend(queryParams[param] || {}, options)
    queryParams

  # Push items onto an array param of queryParams
  #
  # @example
  #   @__queryParams = { sort: ['id'] }
  #   param = 'sort'
  #   value = 'updatedAt'
  #
  #   return { sort: ['id', 'updatedAt'] }
  #
  # @note queryParams defaults to @__queryParams, but this function can be used
  #   to modify any object
  #
  # @param [String] param the name of the param to extend
  # @param [Array<String,Object>] items items to push onto the collection param
  # @param [Object] queryParams the object to modify instead of @__queryParams
  # @return [Object] the extended queryParams
  @__extendArrayParam: (param, items, queryParams) ->
    queryParams ||= _.clone(@queryParams()) # shallow clone
    queryParams[param] =
      if queryParams[param]
        queryParams[param].slice(0) # clone array
      else
        []
    queryParams[param].push items... if items?
    queryParams
