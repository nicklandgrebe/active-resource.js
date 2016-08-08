# Manages a hasMany association in the same form as a Relation, except all queries
# are made with association links and a lot of the methods make use of Association
# to accomplish their goal
class ActiveResource::Associations::CollectionProxy extends ActiveResource::Relation
  # Don't add this class when extending/include the parent
  @__excludeFromExtend = true

  target: -> @base.target

  # Gets all the items in the association
  #
  # @note This method will not set the target of the association to the response,
  #   it will only retrieve the target of the association and return it
  #   You must preload the association or call `load[Association]()` or
  #   `association(...).loadTarget()`
  #
  # @param [Object] options the options to use when getting the items
  # @option [Boolean] cached if true, uses items already cached locallys
  #
  # TODO: Add cached versions of first, last, find, where, empty etc.
  all: (options = {}) ->
    if options['cached']
      @target()
    else
      super

  # Checks whether or not the target is empty
  #
  # @note Does not take into consideration that the target may not be loaded,
  #   so if you want to truly know if the association is empty, check that
  #   `association(...).loaded() and association(...).empty()`
  #
  # @return [Boolean] whether or not the target is empty
  empty: ->
    @target().empty()

  # Assigns the association to `other`
  #
  # @param [Array,Collection] other the other collection to set the association to
  # @param [Boolean] save whether or not to persist the assignment on the server
  # @return [Promise] a promise to return a success indicator (204 No Content) **or**
  #   an error indicator (403 Forbidden)
  # @note A promise will be returned even if `save != true`, using `$.when()`
  assign: (other, save = true) ->
    @base.writer(other, save)

  # Pushes the resources onto the association
  #
  # @param [Array,Collection] resources the resources to push onto the association
  # @return [Promise] a promise to return a success indicator (204 No Content) **or**
  #   an error indicator (403 Forbidden)
  push: (resources) ->
    @base.concat(resources)

  # Builds resource(s) for the association
  #
  # @see CollectionAssociation#build
  #
  # @param [Object,Array<Object>] attributes the attributes to build into the resource
  # @return [ActiveResource::Base] the built resource(s) for the association, with attributes
  build: (attributes = {}) ->
    attributes =
      if _.isArray(attributes)
        _.map attributes, (attr) =>
          _.extend(attr, @__queryOptions?['filter'])
      else
        _.extend(attributes, @__queryOptions?['filter'])

    @base.build(attributes)

  # Create resource(s) for the association
  #
  # @see CollectionAssociation#create
  #
  # @param [Object,Array<Object>] attributes the attributes to build into the resource
  # @param [Function] callback the function to pass the built resource into after calling create
  #   @note May not be persisted, in which case `resource.errors().empty? == false`
  # @return [ActiveResource::Base] a promise to return the persisted resource(s) **or** errors
  create: (attributes = {}, callback) ->
    attributes =
      if _.isArray(attributes)
        _.map attributes, (attr) =>
          _.extend(attr, @__queryOptions?['filter'])
      else
        _.extend(attributes, @__queryOptions?['filter'])

    @base.create(attributes, callback)

  # Deletes the resources from the association
  #
  # @param [Array,Collection] resources the resources to delete from the association
  # @return [Promise] a promise to return a success indicator (204 No Content) **or**
  #   an error indicator (403 Forbidden)
  delete: (resources) ->
    @base.delete(resources)

  # Deletes all the resources in the association from the association
  #
  # @return [Promise] a promise to return a success indicator (204 No Content) **or**
  #   an error indicator (403 Forbidden)
  deleteAll: ->
    @base.delete(@target())
