# Base class for interfacing with ActiveResources
#
# @example
#   class window.Order extends ActiveResource::Base
#     this.className = 'Order'
#     this.queryName = 'orders'
#
#     @belongsTo('product')
#
#     @hasMany('comments', as: 'resource')
#
class ActiveResource::Base
  ActiveResource.extend(@, ActiveResource::Associations)
  ActiveResource.extend(@, ActiveResource::Attributes.prototype)
  ActiveResource.extend(@, ActiveResource::Callbacks.prototype)
  ActiveResource.extend(@, ActiveResource::Fields.prototype)
  ActiveResource.extend(@, ActiveResource::Reflection.prototype)
  ActiveResource.extend(@, ActiveResource::Relation.prototype)
  # Add Links after Relation since Relation also contains a `links` prototype method extended to Base, but it should
  # only be used for instances of Relation, not static Base itself
  ActiveResource.extend(@, ActiveResource::Links)
  ActiveResource.include(@, ActiveResource::Associations.prototype)
  ActiveResource.include(@, ActiveResource::Attributes)
  ActiveResource.include(@, ActiveResource::Callbacks)
  ActiveResource.include(@, ActiveResource::Errors)
  ActiveResource.include(@, ActiveResource::Fields)
  ActiveResource.include(@, ActiveResource::Links.prototype)
  ActiveResource.include(@, ActiveResource::Persistence)
  ActiveResource.include(@, ActiveResource::QueryParams)
  ActiveResource.include(@, ActiveResource::Typing)

  # The name to use when querying the server for this resource
  # @example 'products'
  @queryName = ''

  # The name to use when constantizing on the client
  # @example 'Product'
  #
  # @note On a production server where minification occurs, the actual name of classes
  #   `@constructor.name` will change from `Product` to perhaps `p`. But, since a class
  #   is added as a variable to its resource library (or its prototype), we can use this
  #   method to determine the name of the variable in the resource library scope
  @className = ''

  # The primary key by which to index this resource
  @primaryKey = 'id'

  constructor: ->
    @__initializeFields()

  # The interface to use when querying the server for this class
  @interface: ->
    @resourceLibrary.interface

  # The interface to use when querying the server for this resource
  interface: ->
    @klass().interface()

  # Clones the resource and its relationship resources recursively
  clone: ->
    @__createClone({})

  # private

  # Clones a resource recursively, taking in a cloner argument to protect against circular cloning
  #   of relationships
  #
  # @param [ActiveResource::Base] oldCloner the resource cloning this resource (always a related resource)
  # @param [ActiveResource::Base] newCloner the clone of oldCloner to reassign fields to
  # @return [ActiveResource::Base] the cloned resource
  __createClone: ({ oldCloner, newCloner }) ->
    clone = @klass().build()

    @errors().each (attribute, e) => clone.errors().push(_.clone(e))
    clone.__links = _.clone(@links())

    changedFields = @changedFields()
    newFields = @attributes()
    @klass().fields().each (f) =>
      try
        oldAssociation = @association(f)
        newAssociation = clone.association(f)

        newAssociation.__links = _.clone(oldAssociation.links())

        reflection = oldAssociation.reflection

        newTarget =
          if reflection.collection()
            associationClones = oldAssociation.target.map (resource) =>
              resource.__createClone(oldCloner: this, newCloner: clone)

            if @__fields[f]?
              clone.__fields[f] = @__fields[f].map (resource) =>
                associationIndex = oldAssociation.target.indexOf(resource)

                if associationIndex >= 0
                  associationClones.get(associationIndex)
                else
                  resource.__createClone(oldCloner: this, newCloner: clone)

            associationClones
          else
            if @__fields[f]?
              clone.__fields[f] =
                if @__fields[f] == oldCloner
                  newCloner
                else
                  @__fields[f].__createClone(
                    oldCloner: this,
                    newCloner: clone
                  )

            if changedFields.include(f) && oldAssociation.target != oldCloner
              oldAssociation.target.__createClone?(
                oldCloner: this,
                newCloner: clone
              )
            else
              clone.__fields[f]

        if newTarget
          newFields[reflection.name] = newTarget

      catch
        clone.__fields[f] = @__fields[f]

    clone.__assignAttributes(newFields)

    clone

  # Creates a new ActiveResource::Relation with the extended queryParams passed in
  #
  # @param [Object] queryParams the extended query params for the relation
  # @return [ActiveResource::Relation] the new Relation for the extended query
  @__newRelation: (queryParams) ->
    new ActiveResource::Relation(this, queryParams)
