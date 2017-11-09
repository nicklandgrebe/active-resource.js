# ActiveResource methods for managing persistence of immutable resources to the server
class ActiveResource::Immutable::Persistence
  # Update specific attributes of the resource, save it, and insert resource into callback after
  #
  # @param [Object] attributes the attributes to update in the resource
  # @param [Function] callback the callback to pass the ActiveResource into
  # @return [Promise] a promise to return the ActiveResource, valid or invalid
  @update: (attributes, callback) ->
    attributesKeys = ActiveResource::Collection.build(_.keys(attributes))
    oldAttributes = _.pick(@attributes(), attributesKeys.toArray())
    oldAttributes = _.defaults(oldAttributes, attributesKeys.inject({}, (obj, k) =>
      obj[k] = null
      obj
    ))
    @__createOrUpdate(@assignAttributes(attributes))
      .then null, (resource) ->
        resource.__assignAttributes(oldAttributes)
        resource
      .then callback, callback

  # Override default __createOrUpdate so it will use a clone in persisting the record
  @__createOrUpdate: (clone = this.clone()) ->
    clone.errors().reset()

    if clone.persisted()
      @klass().resourceLibrary.interface.patch @links()['self'], clone
    else
      @klass().resourceLibrary.interface.post @links()['related'], clone