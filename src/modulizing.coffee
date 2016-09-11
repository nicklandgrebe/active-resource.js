((moduleHandler) ->
  # Constantizes a className string into an actual ActiveResource::Base class
  #
  # @note By default, is scoped to the window object, so all lookups are
  #   window[klassName]. Thus, by default, all subclasses of ActiveResource::Base
  #   should be added to the window object
  #
  # @note Throws exception if klass cannot be found
  #
  # @param [String] className the class name to look for a constant with
  # @return [Class] the class constant corresponding to the name provided
  moduleHandler.constantize = (className) ->
    unless (klass = ActiveResource.constantizeScope[className])?
      throw "NameError: klass #{className} does not exist"
    klass

  # Extends a klass with a mixin's members, so the klass itself will have those members
  #
  # @param [Class] klass the object to extend the mixin into
  # @param [Class,Object] mixin the methods/members to extend into the obj
  moduleHandler.extend = (klass, mixin) ->
    for name, method of mixin
      unless method.__excludeFromExtend
        klass[name] = method

  # Adds a mixin's members to a klass prototype, so instances of that klass will
  # have those members
  #
  # @param [Class] klass the klass to include mixin members in when instantiated
  # @param [Class,Object] mixin the methods/members to include into the klass instances
  moduleHandler.include = (klass, mixin) ->
    @extend klass.prototype, mixin
)(ActiveResource)
