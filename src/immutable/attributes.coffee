# ActiveResource methods for managing attributes of immutable resources
class ActiveResource::Immutable::Attributes
  # Assigns `attributes` to a new resource cloned from this immutable resource
  #
  # @param [Object] attributes the attributes to assign
  @assignAttributes: (attributes) ->
    clone = @clone()
    clone.__assignAttributes(attributes)
    clone