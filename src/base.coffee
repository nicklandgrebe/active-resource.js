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
  ActiveResource.include(@, ActiveResource::Cloning)
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

  # Creates a new ActiveResource::Relation with the extended queryParams passed in
  #
  # @param [Object] queryParams the extended query params for the relation
  # @return [ActiveResource::Relation] the new Relation for the extended query
  @__newRelation: (queryParams) ->
    new ActiveResource::Relation(this, queryParams)
