# CollectionAssociation is an abstract class that provides common stuff to ease the implementation
# of association proxies that represent collections.
class ActiveResource::Associations::CollectionAssociation extends ActiveResource::Associations::Association
  # @note Adds @queryName so it can be used in CollectionProxy when making Relations
  #
  # @param [ActiveResource::Base] the resource that owners this association
  # @param [ActiveResource::Reflection] reflection the reflection of the association
  constructor: (@owner, @reflection) ->
    @queryName = @klass().queryName
    super

  # Getter for the proxy to the target
  reader: ->
    @proxy ||= new ActiveResource::Associations::CollectionProxy(this)

  # Setter for the target
  #
  # @param [Collection,Array] resources the resources to assign to the association
  # @param [Boolean] save whether or not to persist the assignment on the server before
  #   continuing with the local assignment
  # @return [Promise] a promise that indicates that the assignment was successful **or** errors
  writer: (resources, save = true) ->
    resources = ActiveResource::Collection.build(resources)

    resources.each (r) => @__raiseOnTypeMismatch(r)

    persistedResources = resources.select((r) -> r.persisted?())

    persistAssignment =
      if save && !@owner.newResource?() && (resources.empty() || !persistedResources.empty())
        @__persistAssignment(persistedResources.toArray())
      else
        $.when(resources)

    _this = this
    persistAssignment
    .then ->
      _this.loaded(true) if save
      _this.replace(resources)
      resources

  # Pushes resources onto the target
  #
  # @param [Collection,Array] resources the resources to push onto the association
  # @return [Promise] a promise that indicates that the concat was successful **or** errors
  concat: (resources) ->
    resources = ActiveResource::Collection.build(resources)
    resources.each (r) => @__raiseOnTypeMismatch(r)

    persistConcat =
      if !@owner.newResource?() && (persistedResources = resources.select((r) -> r.persisted?())).size()
        # TODO: Do something better with unpersisted resources, like saving them
        @__persistConcat(persistedResources.toArray())
      else
        $.when(resources)

    _this = this
    persistConcat
    .then ->
      _this.__concatResources(resources)

  # Deletes resources from the target
  #
  # @param [Collection,Array] resources the resources to delete from the association
  # @return [Promise] a promise that indicates that the delete was successful **or** errors
  delete: (resources) ->
    resources = ActiveResource::Collection.build(resources)
    resources.each (r) => @__raiseOnTypeMismatch(r)

    persistDelete =
      if !@owner.newResource?() && (persistedResources = resources.select((r) -> r.persisted?())).size()
        @__persistDelete(persistedResources.toArray())
      else
        $.when(resources)

    _this = this
    persistDelete
    .then ->
      _this.__removeResources(resources)

  reset: ->
    super
    @target = ActiveResource::Collection.build()

  # Adds the resource to the target
  #
  # @note Uses `replaceOnTarget` to replace the resource in the target if it is
  #   already in the target
  #
  # @param [ActiveResource::Base] resource the resource to add to the target
  addToTarget: (resource) ->
    index = _.indexOf(@target.toArray(), resource)
    index = null if index < 0
    @replaceOnTarget(resource, index)

  # Pushs the resource onto the target or replaces it if there is an index
  #
  # @param [ActiveResource::Base] resource the resource to add to/replace on the target
  # @param [Integer] index the index of the existing resource to replace
  replaceOnTarget: (resource, index) ->
    if index?
      @target.set(index, resource)
    else
      @target.push resource

    @setInverseInstance(resource)
    resource

  # Checks whether or not the target is empty
  #
  # @note Does not take into consideration that the target may not be loaded,
  #   so if you want to truly know if the association is empty, check that
  #   `association(...).loaded() and association(...).empty()`
  #
  # @return [Boolean] whether or not the target is empty
  empty: ->
    @target.empty()

  # Builds resource(s) for the association
  #
  # @param [Object,Array<Object>] attributes the attributes to build into the resource
  # @return [ActiveResource::Base] the built resource(s) for the association, with attributes
  build: (attributes = {}) ->
    if _.isArray(attributes)
      ActiveResource::Collection.build(attributes).map (attr) => @build(attr)
    else
      @__concatResources(ActiveResource::Collection.build(@__buildResource(attributes))).first()

  # Creates resource for the association
  #
  # @todo Add support for multiple resource creation when JSON API supports it
  #
  # @param [Object] attributes the attributes to build into the resource
  # @param [Object] queryParams the options to add to the query, like `fields` and `include`
  # @param [Function] callback the function to pass the built resource into after calling create
  #   @note May not be persisted, in which case `resource.errors().empty? == false`
  # @return [ActiveResource::Base] a promise to return the persisted resource **or** errors
  create: (attributes = {}, queryParams = {}, callback = _.noop()) ->
    @__createResource(attributes, queryParams, callback)

  # private

  __findTarget: ->
    _this = this
    @interface().get(@links()['related'], @owner.queryParamsForReflection(@reflection))
    .then (resources) ->
      resources.each (r) -> _this.setInverseInstance(r)
      resources

  # Replaces the target with `other`
  #
  # @param [Collection] other the array to replace on the target
  replace: (other) ->
    @__removeResources(@target)
    @__concatResources(other)

  # Concats resources onto the target
  #
  # @param [Collection] resources the resources to concat onto the target
  __concatResources: (resources) ->
    resources.each (resource) =>
      @addToTarget(resource)
      @insertResource(resource)
    resources

  # Removes the resources from the target
  #
  # @note Only calls @__deleteResources for now, but can implement callbacks when
  #   the library gets to that point
  #
  # @param [Collection] the resources to remove from the association
  __removeResources: (resources) ->
    @__deleteResources(resources)

  # Deletes the resources from the target
  # @note Expected to be defined by descendants
  #
  # @param [Collection] resources the resource to delete from the association
  __deleteResources: (resources) ->
    throw '__deleteResources not implemented on CollectionAssociation'

  # Persists the new association by patching the owner's relationship endpoint
  #
  # @param [Array] resources the resource to delete from the association
  __persistAssignment: (resources) ->
    @interface().patch @links()['self'], resources, onlyResourceIdentifiers: true

  # Persists a concat to the association by posting to the owner's relationship endpoint
  #
  # @param [Array] resources the resource to delete from the association
  __persistConcat: (resources) ->
    @interface().post @links()['self'], resources, onlyResourceIdentifiers: true

  # Persists deleting resources from the association by deleting it on the owner's relationship endpoint
  #
  # @param [Array] resources the resource to delete from the association
  __persistDelete: (resources) ->
    @interface().delete @links()['self'], resources, onlyResourceIdentifiers: true

  # @see #create
  __createResource: (attributes, queryParams, callback) ->
    throw 'You cannot call create on an association unless the parent is saved' unless @owner.persisted?()

    resource = @__buildResource(attributes)
    resource.assignQueryParams(queryParams)
    @insertResource(resource)

    _this = this
    resource.save(callback)
    .then ->
      _this.addToTarget(resource)
      resource
