# Extends a klass with a mixin's members, so the klass itself will have those members
#
# @param [Class] klass the object to extend the mixin into
# @param [Class,Object] mixin the methods/members to extend into the obj
# @param [Boolean] overwrite overwrite the methods in mixin already on klass
ActiveResource.extend = (klass, mixin, overwrite = false) ->
  Object.getOwnPropertyNames(mixin)
  .filter((name) => ['arguments', 'caller', 'length', 'name', 'prototype'].indexOf(name) < 0)
  .forEach((name) =>
    method = mixin[name]
    unless (!overwrite && klass[name]) || method.__excludeFromExtend
      klass[name] = method
  )

# Adds a mixin's members to a klass prototype, so instances of that klass will
# have those members
#
# @param [Class] klass the klass to include mixin members in when instantiated
# @param [Class,Object] mixin the methods/members to include into the klass instances
# @param [Boolean] overwrite overwrite the methods in mixin already on klass
ActiveResource.include = (klass, mixin, overwrite = false) ->
  @extend klass.prototype, mixin, overwrite
