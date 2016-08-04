# =require ./belongs_to_association

class ActiveResource::Associations::BelongsToPolymorphicAssociation extends ActiveResource::Associations::BelongsToAssociation
  klass: ->
    type = @owner[@reflection.foreignType()]
    ActiveResource.constantize(type)

  # private

  # Replaces the foreignKey && foreignType of the owner
  #
  # @see BelongsToAssociation#__replaceKeys
  __replaceKeys: (resource) ->
    super
    @owner[@reflection.foreignType()] = resource.klass().className

  # Removes the foreignKey && foreignType of the owner
  #
  # @see BelongsToAssociation#__removeKeys
  __removeKeys: ->
    super
    @owner[@reflection.foreignType()] = null

  # Gets the inverse reflection of the polymorphic reflection
  __inverseReflectionFor: (resource) ->
    @reflection.polymorphicInverseOf(resource.klass())

  __raiseOnTypeMismatch: (resource) ->
    # A polymorphic association cannot have a type mismatch, by definition
