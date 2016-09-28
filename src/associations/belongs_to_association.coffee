class ActiveResource::Associations::BelongsToAssociation extends ActiveResource::Associations::SingularAssociation
  reset: ->
    super
    @updated = false

  # private
  replace: (resource) ->
    if resource
      @__replaceKeys(resource)
      @setInverseInstance(resource)
      @updated = true
    else
      @__removeKeys()

    @target = resource

  # Gets the resource that is the target of this association, using either the
  # owner's relationship data endpoint, or the foreign key to query the resource's root URL
  #
  # @return [Promise] a promise to return the resource **or** error 404
  __getResource: ->
    unless @owner.newResource()
      # @example Uses @links()['related'] == '/orders/1/product'
      super
    else
      # @example Uses @links()['related'] == '/products/:product_id'
      @interface().get(
        @links()['related'] + @owner[@reflection.foreignKey()],
        @owner.queryParamsForReflection(@reflection)
      )

  # Replaces the foreign key of the owner with the primary key of the resource (the new target)
  #
  # @param [ActiveResource::Base] resource the resource with a primaryKey to replace the foreignKey of the owner
  __replaceKeys: (resource) ->
    @owner[@reflection.foreignKey()] = resource.__readAttribute(@reflection.associationPrimaryKey(resource.klass()))

  # Removes the foreign key of the owner
  __removeKeys: ->
    @owner[@reflection.foreignKey()] = null

  __foreignKeyPresent: ->
    @owner.__readAttribute(@reflection.foreignKey())?

  # @note For now, we're only supporting inverse setting from belongs_to back onto has_one associations
  __invertibleFor: (resource) ->
    inverse = @__inverseReflectionFor(resource)
    inverse && inverse.hasOne?()
