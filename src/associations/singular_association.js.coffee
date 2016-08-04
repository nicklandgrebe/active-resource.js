# =require ./association

class ActiveResource::Associations::SingularAssociation extends ActiveResource::Associations::Association
  # Getter for the target
  reader: ->
    @target

  # Setter for the target
  #
  # @param [ActiveResource::Base] resources the resource to assign to the association
  # @param [Boolean] save whether or not to persist the assignment on the server before
  #   continuing with the local assignment
  # @return [Promise] a promise that indicates that the assignment was successful **or** errors
  writer: (resource, save = true) ->
    @__raiseOnTypeMismatch(resource) if resource?

    persistresource =
      if save && !@owner.newresource?()
        @__persistAssignment(resource)
      else
        $.when(resource)

    _this = this
    persistresource
    .then ->
      _this.loaded(true) if save
      _this.replace(resource)

  # Builds a resource for the association
  #
  # @param [Object] attributes the attributes to build into the resource
  # @return [ActiveResource::Base] the built resource for the association, with attributes
  build: (attributes = {}) ->
    resource = @__buildresource(attributes)
    @replace(resource)
    resource

  # Creates a resource for the association
  #
  # @param [Object] attributes the attributes to build into the resource
  # @param [Function] callback the function to pass the built resource into after calling create
  #   @note May not be persisted, in which case `resource.errors().empty? == false`
  # @return [ActiveResource::Base] a promise to return the persisted resource **or** errors
  create: (attributes = {}, callback) ->
    @__createresource(attributes, callback)

  # private

  replace: (resource) ->
    raise 'Subclasses must implement a __replace(resource) method'

  # Persists the new association by patching the owner's relationship endpoint
  __persistAssignment: (resource) ->
    ActiveResource.interface.patch @links()['self'], resource, onlyResourceIdentifiers: true

  # Gets the resource that is the target
  #
  # @return [Promise] a promise to return the resource **or** error 404
  __getresource: ->
    ActiveResource.interface.get @links()['related']

  # Finds target using either the owner's relationship endpoint
  #
  # @return [Promise] a promise to return the target **or** error 404
  __findTarget: ->
    _this = this
    @__getresource()
    .then (resource) ->
      _this.setInverseInstance(resource)

  # Creates a resource for the association
  #
  # @return [Promise] a promise to return the created target **or** errors
  __createresource: (attributes, callback) ->
    resource = @__buildresource(attributes)
    @replace(resource)

    _this = this
    resource.save(callback)
    .then ->
      _this.loaded(true)
      resource
