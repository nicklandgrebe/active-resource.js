class ActiveResource::Associations::BelongsToPolymorphicAssociation extends ActiveResource::Associations::BelongsToAssociation
  klass: ->
    type = @owner[@reflection.foreignType()]

    try
      @owner.klass().resourceLibrary.constantize(type)
    catch
      undefined

  links: ->
    if @klass() then super() else {}

  # private

  # Replaces the foreignKey && foreignType of the owner
  #
  # @see BelongsToAssociation#__replaceKeys
  __replaceKeys: (resource) ->
    super(resource)
    @owner[@reflection.foreignType()] = resource.klass().className

  # Removes the foreignKey && foreignType of the owner
  #
  # @see BelongsToAssociation#__removeKeys
  __removeKeys: ->
    super()
    @owner[@reflection.foreignType()] = null

  # Gets the inverse reflection of the polymorphic reflection
  __inverseReflectionFor: (resource) ->
    @reflection.polymorphicInverseOf(resource.klass())

  __raiseOnTypeMismatch: (resource) ->
    # A polymorphic association cannot have a type mismatch, by definition
