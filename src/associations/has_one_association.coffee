class ActiveResource::Associations::HasOneAssociation extends ActiveResource::Associations::SingularAssociation
  # private
  replace: (resource) ->
    @__removeTarget()

    if resource
      @__setOwnerAttributes(resource)
      @setInverseInstance(resource)

      @target = resource

  # TODO: Add delete/destroy dependency processing
  __removeTarget: ->
    @__nullifyOwnerAttributes(@target) if @target
    @target = null

  __nullifyOwnerAttributes: (resource) ->
    resource[@reflection.foreignKey()] = null
