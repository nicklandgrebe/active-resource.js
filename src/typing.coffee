# Provides support methods for determing the type (also known as klass) of different objects in
# the ActiveResource framework
class ActiveResource::Typing
  # Returns the class of the object
  #
  # @return [Class] the class for the oject
  @klass: ->
    @constructor

  # Determines if this object is of type `klass`
  #
  # @return [Boolean] whether or not the object is of type klass
  @isA: (klass) ->
    object = this
    match = (object.constructor == klass)
    match = (object.constructor == klass) until match || !(object = object.constructor.__super__)?
    match
