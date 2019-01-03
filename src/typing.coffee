# Provides support methods for determing the type (also known as klass) of different objects in
# the ActiveResource framework
class ActiveResource::Typing
  # Returns the class of the object
  #
  # @return [Class] the class for the object
  @klass: ->
    @constructor

  getPrototypeOf = (o) =>
    _getPrototypeOf = if Object.setPrototypeOf then Object.getPrototypeOf else (o) =>
      o.__proto__ || Object.getPrototypeOf(o)

    _getPrototypeOf(o)

  # Determines if this object is of type `klass`
  #
  # @return [Boolean] whether or not the object is of type klass
  @isA: (klass) ->
    object = this.constructor
    match = (object == klass)
    match = (object == klass) until match || !(object = getPrototypeOf(object))?
    match
