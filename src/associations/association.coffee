# The instantiated class that manages an association for an ActiveResource
class ActiveResource::Associations::Association
  ActiveResource.include(@, ActiveResource::Typing)

  # Don't add this class when extending/include the parent
  @__excludeFromExtend = true

  # @param [ActiveResource::Base] the resource that owners this association
  # @param [ActiveResource::Reflection] reflection the reflection of the association
  constructor: (@owner, @reflection) ->
    @reset()

  # Delegate the klass of the association to its reflection
  # @return [Class] the ActiveResource class for the association
  klass: -> @reflection.klass()

  # Delegate the options of the association to its reflection
  # @return [Object] the options for the association
  options: -> @reflection.options

  # Retrieves the links for the association
  #
  # @note Two types of links:
  #   {
  #     links: {
  #       self:    '/products/1/relationships/orders',  # Called when modifying relationships
  #       related: '/products/1/orders'                 # Called when creating/finding target
  #     }
  #   }
  #
  # @return [Object] the links for the association
  links: ->
    @__links ||= _.clone(@klass().links())

  # The interface that the owner of this association uses
  interface: ->
    @owner.klass().interface()

  # Resets the loaded flag to `false` and the target to `nil`
  reset: ->
    @__loaded = false
    @target = null

  # Reloads the target and returns `this` on success
  #
  # @return [Promise] a promise to return the reloaded association **or** errors
  reload: ->
    @reset()

    _this = this
    @loadTarget()
    .then ->
      _this

  # A setter and getter for the loaded flag
  # @note @loaded() is the getter
  # @note @loaded(true) is the setter
  #
  # @param [Boolean] set whether or not to set loaded flag to true
  # @return [Boolean] the loaded flag
  loaded: (set = false) ->
    if set
      @__loaded = true
    @__loaded

  # Loads the target if needed and returns it
  #
  # This method is abstract in the sense that it relies on `__findTarget`,
  # which is expected to be provided by descendants
  #
  # If the target is already loaded it is just returned. Thus, you can call
  # loadTarget unconditionally to get the target
  #
  # @return [Promise] a promise to return the loaded target **or** 404 error
  loadTarget: ->
    if @__canFindTarget()
      @__findTarget()
      .then (loadedTarget) =>
        this.target = loadedTarget
        this.loaded(true)
        loadedTarget
      .catch =>
        this.reset()
    else
      @reset()
      null

  # Sets the inverse association of the resource to the owner of the association
  #
  # @example
  #   GiftCard.hasOne('order')
  #   Order.belongsTo('giftCard')
  #
  #   g = GiftCard.build()
  #   o = Order.build()
  #
  #   g.association('order').setInverseInstance(o)
  #   o.association('giftCard').target == g
  #
  # @param [ActiveResource::Base] the resource to set the inverse association of
  # @return [ActiveResource::Base] the resource, possibly with an inversed association
  setInverseInstance: (resource) ->
    if @__invertibleFor(resource)
      inverse = resource.association(@__inverseReflectionFor(resource).name)
      if inverse.reflection.collection()
        inverse.addToTarget(@owner)
      else
        inverse.target = @owner
    resource

  # private

  # Throws error if we try to assign resource of one type to an association that requires another type
  #
  # @param [Object] resource the value/resource being assigned to the association
  __raiseOnTypeMismatch: (resource) ->
    unless resource.isA?(@reflection.klass())
      throw "#{@reflection.className()} expected, got #{resource} which is an instance of #{resource.constructor}"

  # Whether or not we can find the target
  #
  # We can find the target if:
  # 1. The owner resource is not a new resource, or we have a foreign key to query with
  # 2. The target klass exists (so we can build the target)
  #
  # @return [Boolean] whether or not we can find the target
  __canFindTarget: ->
    (!@owner.newResource() || @__foreignKeyPresent()) && @klass()

  # Defines attributes to create new resources with this association
  #
  # @return [Object] the attributes to create new resources with this association with
  __creationAttributes: ->
    attributes = {}

    if @reflection.hasOne?() || @reflection.collection?()
      attributes[@reflection.foreignKey()] = @owner[@reflection.activeResourcePrimaryKey()]

      if @reflection.options['as']
        attributes[@reflection.type()] = @owner.klass().className

    attributes

  # Used by hasOne and hasMany to set their owner attributes on belongsTo resources
  __setOwnerAttributes: (resource) ->
    for key, value of @__creationAttributes()
      resource[key] = value

  # Returns true if there is a foreign key present on the owner which
  # references the target. This is used to determine whether we can load
  # the target if the owner is currently a new resource (and therefore
  # without a key). If the owner is a new resource then foreign_key must
  # be present in order to load target.
  #
  # Currently implemented by belongsTo (vanilla and polymorphic)
  __foreignKeyPresent: ->
    false

  # Can be redefined by subclasses, notably polymorphic belongs_to
  # The resource parameter is necessary to support polymorphic inverses as we must check for
  # the association in the specific class of the resource.
  #
  # @param [ActiveResource::Base] the resource with reflection to find an inverseOf()
  # @return [ActiveResource::Reflection] the inverse reflection for the resource's reflection
  __inverseReflectionFor: (resource) ->
    @reflection.inverseOf()

  # Returns true if inverse association on the given resource needs to be set.
  # This method is redefined by subclasses.
  #
  # @param [ActiveResource::Base] the resource to determine if we need to set the inverse association for
  # @return [Boolean] whether or not the inverse association needs to be set
  __invertibleFor: (resource) ->
    @__inverseReflectionFor(resource)?

  # @return [Boolean] returns true if the resource contains the foreignKey
  __foreignKeyFor: (resource) ->
    resource.hasAttribute?(@reflection.foreignKey())

  # Builds a resource in the association with the given attributes
  #
  # @param [Object] attributes the attributes to build the resource with
  # @return [ActiveResource::Base] the built resource in the association
  __buildResource: (attributes) ->
    resource = @reflection.buildAssociation()
    resource.__assignAttributes(attributes)
    resource
