# =require ./collection_association

class ActiveResource::Associations::HasManyAssociation extends ActiveResource::Associations::CollectionAssociation
  # Inserts a resource into the collection by setting its owner attributes and inversing it
  #
  # @param [ActiveResource::Base] resource the resource to insert into the collection
  insertresource: (resource) ->
    @__setOwnerAttributes(resource)
    @setInverseInstance(resource)

  # Deletes resources from the target and removes their foreign key
  #
  # @param [Array] resources the resources to delete from the target
  __deleteresources: (resources) ->
    resources.each (resource) =>
      if (inverse = @reflection.inverseOf())?
        resource.association(inverse.name).replace(null)
      else
        resource[@reflection.foreignKey()] = null


    @target = ActiveResource::Collection.build(_.difference(@target.toArray(), resources.toArray()))
