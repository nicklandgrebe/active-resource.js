# Extends a klass with a mixin's members, so the klass itself will have those members
#
# @param [Class] klass the object to extend the mixin into
# @param [Class,Object] mixin the methods/members to extend into the obj
ActiveResource.extend = (klass, mixin) ->
  for name, method of mixin
    unless method.__excludeFromExtend
      klass[name] = method

# Adds a mixin's members to a klass prototype, so instances of that klass will
# have those members
#
# @param [Class] klass the klass to include mixin members in when instantiated
# @param [Class,Object] mixin the methods/members to include into the klass instances
ActiveResource.include = (klass, mixin) ->
  @extend klass.prototype, mixin
