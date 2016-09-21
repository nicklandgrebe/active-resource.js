class ActiveResource::QueryParams
  # private

  RESOURCE_RELATED = ['fields', 'include']
  COLLECTION_RELATED = ['filter', 'sort', 'page']

  queryParams: ->
    @__queryParams ||= {}

  @queryParams: ->
    @__queryParams ||= {}

  queryParamsForReflection: (reflection) ->
    queryParams = {}
    ActiveResource::Collection.build(@queryParams()['include']).inject [], (out, i) ->
      if _.isObject(i)
        _.each _.keys(i), (i2) ->
          if i2 == reflection.name
            out.push i[i2]...

    unless reflection.polymorphic?()
      queryParams['fields'] = _.pick(@queryParams()['fields'], reflection.klass().queryName)

    queryParams

  assignQueryParams: (queryParams) ->
    @__queryParams = queryParams

  assignResourceRelatedQueryParams: (queryParams) ->
    @assignQueryParams(_.pick(queryParams, RESOURCE_RELATED...))

  resetQueryParams: ->
    @__queryParams = {}

  @__resourceRelatedParams: ->
    _.pick(@queryParams(), RESOURCE_RELATED...)

  @__collectionRelatedParams: ->
    _.pick(@queryParams(), COLLECTION_RELATED...)

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
    queryParams ||= _.clone(@queryParams())
    queryParams[param] ||= []
    queryParams[param].push items... if items?
    queryParams
