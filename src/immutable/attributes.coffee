# ActiveResource methods for managing attributes of immutable resources
class ActiveResource::Immutable::Attributes
  # Assigns `attributes` to a new resource cloned from this immutable resource
  #
  # @param [Object] attributes the attributes to assign
  @assignAttributes: (attributes) ->
    clone = @clone()
    clone.__assignAttributes(attributes)
    clone

  @reload: ->
    throw 'Cannot reload a resource that is not persisted or has an ID' unless @persisted() || @id?.toString().length > 0

    resource = this.clone()
    url = @links()['self'] || (ActiveResource::Links.__constructLink(@links()['related'], @id.toString()))

    @interface().get(url, @queryParams())
    .then (reloaded) ->
      fields = reloaded.attributes()

      resource.klass().reflectOnAllAssociations().each (reflection) ->
        association = reloaded.association(reflection.name)
        return if !association.loaded()

        target = association.reader()
        target = target.toArray() if reflection.collection?()
        fields[reflection.name] = target

      resource.__assignFields(fields)
      resource
