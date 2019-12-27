# ActiveResource methods for persisting local resources with the server
class ActiveResource::Persistence
  # Whether or not this resource is persisted on the server
  #
  # @note If the resource has a `self` link, that means it has a link to itself on the server,
  #   thus, it is persisted. Before a resource has a `self` link, it will have a `related` link
  #   that belongs to its @klass()
  #
  # @example
  #   @klass().links() == { related: '/api/v1/orders' }
  #   @links() == { self: '/api/v1/orders/1' }
  #   return true
  #
  # @example
  #   @klass().links() == { related: '/api/v1/orders' }
  #   @links() == { related: '/api/v1/orders' }
  #   return false
  #
  # @return [Boolean] whether or not the resource is persisted on the server
  @persisted: ->
    @links()['self']?

  # Whether or not this resource is a new resource
  # @note Is the opposite of persisted()
  #
  # @return [Boolean] whether or not the resource is a new resource
  @newResource: ->
    !@persisted()

  # Save any changes to the resource, and inserts the resource into callback after
  #
  # @note
  #   If !resource.persisted(), then create it
  #   If resource.persisted(), then update it
  #
  # @note
  #   Callback will be called regardless if the resource is successfully saved
  #   This is useful because ActiveResource builds regardless if it is valid or not,
  #   and one can read the errors on a resource in the same function as success
  #
  # @example
  #   Order.build(...).save (savedresource) ->
  #     if savedresource.valid()
  #       ...
  #     else
  #       savedresource.errors.each (e) ->
  #         ...
  #
  # @example
  #   resource.save ->
  #     if resource.valid()
  #       ...
  #     else
  #       resource.errors()
  #
  # @param [Function] callback the callback to pass the ActiveResource into
  # @return [Promise] a promise to return the ActiveResource, valid or invalid
  @save: (callback) ->
    @__createOrUpdate()
    .then callback, callback

  # Update specific attributes of the resource, save it, and insert resource into callback after
  #
  # @note
  #   If !resource.persisted(), then create it
  #   If resource.persisted(), then update it
  #
  # @note
  #   Callback will be called regardless if the resource is successfully saved
  #   This is useful because ActiveResource builds regardless if it is valid or not,
  #   and one can read the errors on a resource in the same function as success
  #
  # @example
  #   resource.update { title: '...', price: '...' }, ->
  #     if resource.valid()
  #       ...
  #     else
  #       resource.errors()
  #
  # @param [Object] attributes the attributes to update in the resource
  # @param [Function] callback the callback to pass the ActiveResource into
  # @return [Promise] a promise to return the ActiveResource, valid or invalid
  @update: (attributes, callback) ->
    attributesKeys = ActiveResource::Collection.build(_.keys(attributes))
    oldAttributes = _.pick(@attributes(), attributesKeys.toArray())
    oldAttributes = _.defaults(oldAttributes, attributesKeys.inject({}, (obj, k) =>
      obj[k] = null
      obj
    ))

    @__assignAttributes(attributes)
    @__createOrUpdate()
    .then null, (resource) ->
      resource.__assignAttributes(oldAttributes)
      resource
    .then callback, callback

  # Deletes the resource from the server, assuming callbacks pass
  # TODO: Remove the resource from all associations as well
  #
  # @example
  # Order.last().then (order) ->
  #   order.destroy()
  #   .then (destroyedresource) ->
  #     ...
  #   .catch ->
  #     ...
  @destroy: ->
    @klass().resourceLibrary.interface.delete(@links()['self'], (resource = this))
    .then ->
      resource.__links = {}
      resource

  # private

  # Called by `save` and `update` to determine if we should create a new resource with attributes
  # on the server, or simply update a persisted resource with the attributes
  #
  # @note This uses the `related` link of the resource (example: `/api/v1/orders`) if it is not persisted,
  #   since that is the create endpoint. If the resource is persisted, it uses the `self` link of the resource,
  #   which would be `/api/v1/orders/:id`, so we can make changes to the persisted resource
  #
  # @note This uses `PUT` for update instead of `PATCH` because until we implement dirty attributes
  #   we have to send the entire resource to the server, warranting use of the `PUT` verb
  #
  # @return [Promise] a promise to return the persisted ActiveResource **or** ActiveResource with errors
  @__createOrUpdate: ->
    @errors().reset()

    @__trackChanges()
    if @persisted()
      @klass().resourceLibrary.interface.patch @links()['self'], this
    else
      @klass().resourceLibrary.interface.post @links()['related'], this
