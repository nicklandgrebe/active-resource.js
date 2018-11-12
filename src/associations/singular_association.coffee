class ActiveResource::Associations::SingularAssociation extends ActiveResource::Associations::Association
  # Getter for the target
  reader: ->
    @target

  # Setter for the target
  #
  # @param [ActiveResource::Base] resources the resource to assign to the association
  # @param [Boolean] save whether or not to persist the assignment on the server before
  #   continuing with the local assignment
  # @param [Boolean] checkImmutable if true, check if immutable when applying changes
  # @return [Promise] a promise that indicates that the assignment was successful **or** errors
  writer: (resource, save = true, checkImmutable = false) ->
    @__executeOnCloneIfImmutable(checkImmutable, resource, (resource) ->
      @__raiseOnTypeMismatch(resource) if resource?

      localAssignment = =>
        this.loaded(true) if save
        this.replace(resource)

      if save && !@owner.newResource?()
        @__persistAssignment(resource)
          .then localAssignment
      else
        localAssignment()
    )

  # Builds a resource for the association
  #
  # @param [Object] attributes the attributes to build into the resource
  # @return [ActiveResource::Base] the built resource for the association, with attributes
  build: (attributes = {}) ->
    @__executeOnCloneIfImmutable(true, [], () ->
      resource = @__buildResource(attributes)
      @replace(resource)
      resource
    )

  # Creates a resource for the association
  #
  # @param [Object] attributes the attributes to build into the resource
  # @param [Object] queryParams the options to add to the query, like `fields` and `include`
  # @param [Function] callback the function to pass the built resource into after calling create
  #   @note May not be persisted, in which case `resource.errors().empty? == false`
  # @return [ActiveResource::Base] a promise to return the persisted resource **or** errors
  create: (attributes = {}, queryParams = {}, callback) ->
    @__executeOnCloneIfImmutable(true, [], () ->
      @__createResource(attributes, queryParams, callback)
    )

  # private

  replace: (resource) ->
    raise 'Subclasses must implement a replace(resource) method'

  # Persists the new association by patching the owner's relationship endpoint
  __persistAssignment: (resource) ->
    @interface().patch @links()['self'], resource, onlyResourceIdentifiers: true

  # Gets the resource that is the target
  #
  # @return [Promise] a promise to return the resource **or** error 404
  __getResource: ->
    @interface().get @links()['related'], @owner.queryParamsForReflection(@reflection)

  # Finds target using either the owner's relationship endpoint
  #
  # @return [Promise] a promise to return the target **or** error 404
  __findTarget: ->
    _this = this
    @__getResource()
    .then (resource) ->
      _this.setInverseInstance(resource)

  # Creates a resource for the association
  #
  # @see #create
  #
  # @return [Promise] a promise to return the created target **or** errors
  __createResource: (attributes, queryParams, callback) ->
    throw 'You cannot call create on an association unless the parent is saved' unless @owner.persisted?()

    resource = @__buildResource(attributes)
    resource.assignQueryParams(queryParams)
    @replace(resource)

    _this = this
    resource.save(callback)
    .then ->
      _this.loaded(true)
      resource
