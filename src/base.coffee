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
  # @option [ActiveResource::Base] cloner the resource cloning this resource (always a related resource)
  # @option [ActiveResource::Base] newCloner the clone of cloner to reassign fields to
  # @return [ActiveResource::Base] the cloned resource
  __createClone: ({ cloner, newCloner }) ->
    clone = @klass().build()

    @errors().each (attribute, e) => clone.errors().push(_.clone(e))
    clone.__links = _.clone(@links())

    clone.__queryParams = _.clone(@queryParams())

    clone.__assignAttributes(@attributes())

    @klass().fields().each (f) =>
      clone.__fields[f] =
        if @__fields[f]?.toArray?
          @__fields[f].clone()
        else
          @__fields[f]

      try
        oldAssociation = @association(f)
        newAssociation = clone.association(f)

        newAssociation.__links = _.clone(oldAssociation.links())

        reflection = oldAssociation.reflection

        target =
          if reflection.collection()
            if reflection.autosave() && oldAssociation.target.include(cloner)
              c = oldAssociation.target.clone()

              c.replace(cloner, newCloner)

              if(inverse = reflection.inverseOf())?
                c.each((t) =>
                  if t.__fields[inverse.name] == this
                    t.__fields[inverse.name] = clone

                  t.association(inverse.name).writer(clone)
                )

              clone.__fields[f].replace(cloner, newCloner)

              c
            else if reflection.inverseOf()?.autosave()
              oldAssociation.target.map((t) =>
                if cloner? && cloner == t
                  cloner
                else
                  c = t.__createClone(cloner: this, newCloner: clone)

                  clone.__fields[f].replace(t, c)

                  c
              )
            else
              oldAssociation.target
          else
            if reflection.autosave() && oldAssociation.target == cloner
              clone.__fields[f] = newCloner

              newCloner
            else if reflection.inverseOf()?.autosave()
              if oldAssociation.target?
                if oldAssociation.target == cloner
                  cloner
                else
                  c = oldAssociation.target.__createClone(cloner: this, newCloner: clone)

                  if clone.__fields[f] == oldAssociation.target
                    clone.__fields[f] = c

                  c
            else
              if(inverse = reflection.inverseOf())?.collection()
                oldAssociation.target.association(inverse.name).target.replace(this, clone)

              oldAssociation.target

        newAssociation.writer(target, false)
      catch
        true

    clone

  # Creates a new ActiveResource::Relation with the extended queryParams passed in
  #
  # @param [Object] queryParams the extended query params for the relation
  # @return [ActiveResource::Relation] the new Relation for the extended query
  @__newRelation: (queryParams) ->
    new ActiveResource::Relation(this, queryParams)
