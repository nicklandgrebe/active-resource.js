# Relation constructs queries based on a chained series of functions that extend the chain
# or execute the built query, then building the result and returning it as either an
# ActiveResource::Base or Collection of ActiveResource::Base
#
# ActiveResource::Base extends Relation and Relation.prototype in order to add class level and instance level
# Relation functions to its class level. Relation instances build extended Relation instances, but
# ActiveResource::Base subclasses can build extended Relation instances much like Rails
#
# @example
#   Order.where(price: 5.0).all()
#
# @example
#   Order.where(price: 5.0).order('updatedAt').page(2).perPage(5).all()
#
# @example
#   Order.includes('transactions').select('id','price',transactions: ['id','amount']).first(5)
#
# @example
#   Order.find(token: 'as8h2nW')
#
# @example
#   Order.includes('transactions').findBy(token: 'as8h2nW')
#
ActiveResource.Relation = class ActiveResource::Relation
  ActiveResource.include(@, ActiveResource::QueryParams)
  ActiveResource.include(@, ActiveResource::Typing)

  # @param [ActiveResource::Base] base the resource class this relation is for
  # @param [Object] __queryParams the __queryParams already built by previous links in
  #   the Relation chain
  constructor: (@base, @__queryParams) ->
    @queryName = @base.queryName

    if @base.isA(Function)
      INTERNAL_METHODS = [
        'arguments','caller','length','name',
        'prototype','__super__',
        'className','queryName','resourceLibrary',
        '__attributes','__callbacks','__links','__reflections','__queryParams'
      ];

      classMethods = _.difference(Object.getOwnPropertyNames(@base), _.keys(ActiveResource::Base))
      customClassMethods = _.difference(classMethods, INTERNAL_METHODS)
      mixin = ActiveResource.Collection.build(customClassMethods).inject({}, (obj, method) =>
        obj[method] = @base[method]
        obj
      )
      ActiveResource.extend(@, mixin)

  # Returns links to the server for the resource that this relation is for
  #
  # This will always be { related: baseUrl + '/[@base.queryName]' }
  # @return [Object] string URLs for the resource
  links: ->
    @base.links()

  # Returns the interface for the resource, taken from its klass's resourceLibrary
  #
  # @return [Interface] the interface to use for this resource
  interface: ->
    @base.interface()

  # Adds filters to the query
  #
  # @example
  #  .where(price: 5.0) = { filter: { price: 5.0 } }
  #
  # @param [Object] options the hash of filters to add the query
  # @return [ActiveResource::Relation] the extended relation with added `filter` params
  #
  # 1. Extend __queryParams['filter'] with the additional options
  # 2. Create new relation with the extended __queryParams
  where: (options) ->
    @__newRelation(@__extendObjectParam('filter', options))

  # Sorts the query based on columns
  #
  # @example
  #  .order(updatedAt: 'asc') = { sort: 'updatedAt' }
  #
  # @example
  #  .order(price: 'desc') = { sort: '-price' }
  #
  # @example
  #  .order(price: 'desc', updatedAt: 'asc') = { sort: '-price,updatedAt' }
  #
  # @param [Array<String>] args a list of columns to order the query by
  # @return [ActiveResource::Relation] the extended relation with added `sort` params
  #
  # 1. Add sorting key/value pairs to __queryParams['sort'] object
  # 2. Create new relation with the extended __queryParams
  order: (args) ->
    @__newRelation(@__extendObjectParam('sort', args))

  # Selects the fields to return from the query
  #
  # @example
  #  Order.select('id', 'updatedAt') = { fields: { orders: 'id,updatedAt' } }
  #
  # @example
  #  Order.includes('transactions').select('id', 'updatedAt', transactions: 'amount') =
  #    { fields: { orders: 'id,updatedAt', transactions: 'amount' } }
  #
  # @example
  #  Order.includes(transactions: 'merchant')
  #  .select('id', 'updatedAt', transactions: 'amount', merchant: ['id', 'name']) =
  #    { fields: { orders: 'id,updatedAt', transactions: 'amount', merchant: 'id,name' } }
  # @note Just because the merchant include is nested, does not mean we nest the merchant fields definition
  #
  # @param [Array<String,Object>] args an array of field representations to cull the query by
  # @return [ActiveResource::Relation] the extended relation with added `sort` params
  #
  # 1. Build new queryParams so we don't persist across relation constructions
  # 2. Flatten the field arguments into an array of strings/objects and iterate over it
  # 3. Determine the model name for each field
  #   * If object: model name is the key (Order.select({ transactions: [...] }) # => transactions)
  #   * If string: model name is @base.queryName (Order.select('id') # => orders)
  # 4. Append the list of fields to the array of fields for that model
  #   * If object: first value of arg is array to append (Order.select({ transactions: ['id'] }) => ['id'])
  #   * If string: arg itself is item to append to array (Order.select('id') => ['id'])
  # 5. Create new relation with the extended queryParams
  select: (args...) ->
    queryParams = _.clone(@queryParams())
    queryParams['fields'] ||= {}

    ActiveResource::Collection.build(args)
    .map((a) ->
      if _.isObject(a)
        (_.pick(a, key) for key in _.keys(a))
      else
        a
    )
    .flatten().each (arg) =>
      modelName =
        if _.isObject(arg)
          _.keys(arg)[0]
        else
          @queryName

      queryParams['fields'] =
        @__extendArrayParam(
          modelName,
          if _.isObject(arg)
            [_.values(arg)[0]]
          else
            [arg]
          ,
          queryParams['fields']
        )

    @__newRelation(queryParams)

  # Defines the page number of the query
  #
  # @example
  #  .page(2) = { page: { number: 2 } }
  #
  # @param [Integer] value the page number to define for the query
  # @return [ActiveResource::Relation] the extended relation with added `page.number` param
  page: (value) ->
    @__newRelation(@__extendObjectParam('page', { number: value }))

  # Defines the page size of the query
  #
  # @example
  #  .perPage(5) = { page: { size: 5 } }
  #
  # @param [Integer] value the page size to define for the query
  # @return [ActiveResource::Relation] the extended relation with added `page.size` param
  perPage: (value) ->
    @__newRelation(@__extendObjectParam('page', { size: value }))

  # Defines the limit on the number of resources to query
  #
  # @example
  #  .limit(2) = { limit: 2 }
  #
  # @param [Integer] value the limit on the number of resources to query
  # @return [ActiveResource::Relation] the extended relation with added `limit` param
  limit: (value) ->
    @__newRelation(@__extendValueParam('limit', value))

  # Defines the offset to start querying resources at
  #
  # @example
  #  .offset(2) = { offset: 2 }
  #
  # @param [Integer] value the offset to start querying resources at
  # @return [ActiveResource::Relation] the extended relation with added `offset` param
  offset: (value) ->
    @__newRelation(@__extendValueParam('offset', value))

  # Adds association includes to the query
  #
  # @example
  #   .includes('merchant','product') = { include: ['merchant','product'] }
  #
  # @example
  #   .includes('merchant','product',transactions: ['paymentMethod','paymentGateway']) =
  #     { ['merchant','product',{ transactions: ['paymentMethod','paymentGateway'] }] }
  #
  # @example
  #   .includes('merchant','product',transactions: { paymentMethod: 'customer' }]) =
  #     { ['merchant','product',{ transactions: { paymentMethod: 'customer' } }] }
  #
  # @param [Array<String,Object>] args the representations of includes to add to the query
  # @return [ActiveResource::Relation] the extended relation with added `include` params
  #
  # 1. Go through array of args and separate objects with multiple keys in arrays of single key objects so
  #    the array does this: ['1', '2', { 3: 'a', 4: 'b' }] => ['1', '2', { 3: 'a' }, { 4: 'b' }]
  # 1. Append flattened array args to __queryParams['include'] collection
  # 2. Create new relation with extended __queryParams
  includes: (args...) ->
    args =
      ActiveResource::Collection.build(args)
      .map((a) ->
        if _.isObject(a)
          (_.pick(a, key) for key in _.keys(a))
        else
          a
      )
      .flatten().toArray()
    @__newRelation(@__extendArrayParam('include', args))

  # Builds a new ActiveResource of the type for this relation
  #
  # @example
  #   Order.build(price: 5.0, merchant: merchant)
  #
  # @example
  #   Order.where(price: 5.0).build(merchant: merchant)
  #
  # @param [Object] attributes the attributes to build the resource with
  # @return [ActiveResource::Base] the built resource
  #
  # 1. If @base exists (class is Relation), then build base()
  # 2. If @base does not exist (class is Base), then build this()
  # 3. Assign attributes passed in to built resource
  # 4. Assign the filters of the Relation to the built resource
  # 5. Return the built resource
  build: (attributes = {}) ->
    resource =
      if @base?
        new @base()
      else
        new this()

    resource.__assignAttributes(_.extend(attributes, @queryParams()['filter']))
    resource.assignResourceRelatedQueryParams(@queryParams())

    resource.__executeCallbacks('afterBuild')

    resource

  # Builds a new ActiveResource of the type for this relation and persists it on the server
  #
  # @example
  #   Order.create(price: 5.0, merchant: merchant)
  #
  # @example
  #   Order.where(price: 5.0).create(merchant: merchant)
  #
  # @param [Object] attributes the attributes to build the resource with
  # @param [Function] callback the callback to pass the ActiveResource into on completion
  # @return [Promise] a promise to return the ActiveResource, valid or invalid
  create: (attributes = {}, callback) ->
    @build(attributes).save(callback)

  # TODO: Add `updateAll` and `destroyAll` when JSON API supports mass updating/destroying
  # https://github.com/json-api/json-api/issues/795

  # Retrieves an ActiveResource in the relation corresponding to an ID
  #
  # @param [Integer,String] primaryKey the primary key of the resource to query the server for
  # @return [Promise] a promise to return the ActiveResource **or** errors
  find: (primaryKey) ->
    return unless primaryKey?

    url = ActiveResource::Links.__constructLink(@links()['related'], primaryKey.toString())
    @interface().get url, @queryParams()

  # Retrieves the first ActiveResource in the relation corresponding to conditions
  #
  # @param [Object] conditions the conditions to filter by
  # @return [Promise] a promise to return the ActiveResource **or** errors
  findBy: (conditions) ->
    @where(conditions).first()

  # Retrieves all resources in the relation
  #
  # @return [Promise] a promise to return a Collection of ActiveResources **or** errors
  all: ->
    @interface().get @links()['related'], @queryParams()

  # Retrieves all resources in the relation and calls a function with each one of them
  #
  # @param [Function] iteratee the function to call with each item of the relation
  # @return [Promise] a promise that returns the collection **or** errors
  each: (iteratee) ->
    @all()
    .then (collection) ->
      collection.each(iteratee)
      collection

  # Retrieves the first n ActiveResource in the relation
  #
  # @param [Integer] n the number of resources to retrieve
  # @return [Promise] a promise to return an Array of n ActiveResources **or** errors
  #
  # 1. If there are no page params set, we can apply limit n to optimize the query
  # => * If page params are set, we risk retrieving the "first" resource incorrectly
  # 2. Query all resources in the relation and then return the first N resources from the resulting collection
  first: (n) ->
    relation =
      if @queryParams()['page']?
        this
      else
        @limit(n || 1)

    relation.all()
    .then (collection) ->
      collection.first(n)

  # Retrieves the last n ActiveResource in the relation
  #
  # @param [Integer] n the number of resources to retrieve
  # @return [Promise] a promise to return an Array of n ActiveResources **or** errors
  #
  # 1. If there are no page params set, we can apply limit and offset to optimize the query
  # => * If page params are set, we risk retrieving the "last" resource incorrectly
  # 2. Query all resources in the relation and then return the last N resources from the resulting collection
  last: (n) ->
    relation =
      if @queryParams()['page']?
        this
      else
        @offset(-(n || 1)).limit(n || 1)

    relation.all()
    .then (collection) ->
      collection.last(n)

  # private

  # Creates a new ActiveResource::Relation with the extended __queryParams passed in
  # @param [Object] queryParams the extended query params for the relation
  # @return [ActiveResource::Relation] the new Relation for the extended query
  __newRelation: (queryParams) ->
    new @constructor(@base, queryParams)
