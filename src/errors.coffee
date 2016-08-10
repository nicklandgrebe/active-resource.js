# A class for managing errors associated with persisting an ActiveResource
# Also adds instance methods to ActiveResource::Base to manage the class itself
#
# @example
#   product = Product{ title: '' }
#   product.save ->
#     unless product.valid?()
#       product.errors()
#
class ActiveResource::Errors
  # Caches an instance of this class on ActiveResource::Base#errors in order to manage
  # that resource's errors
  #
  # @return [ActiveResource::Errors] the errors class for the resource
  @errors: ->
    @__errors ||= new ActiveResource::Errors(this)

  # Indicates whether or not the resource is valid?
  #
  # @note A resource is valid if it does not have any errors
  #
  # @return [Boolean] whether or not the resource is valid
  @valid: ->
    @errors().empty()

  # Instantiates with a @base resource and @__errors storage object
  #
  # @param [ActiveResource::Base] the resource that these errors apply to
  constructor: (@base) ->
    @reset()

  reset: ->
    @__errors = {}

  # Adds an error with code and message to the error object for an attribute
  #
  # @param [String] attribute the attribute the error applies to
  #   Or 'base' if it applies to the base object
  # @param [String] code the code for the error
  # @param [String] message the message for the error
  # @return [Object] the error object created and added to storage
  add: (attribute, code, message = '') ->
    @__errors[attribute] ||= []
    @__errors[attribute].push(error = { code: code, message: message })
    error

  # Indicates whether or not the errors object is empty
  #
  # @return [Boolean] whether or not the errors object is empty
  empty: ->
    empty = true
    for k,v of @__errors
      empty = empty && !v.length
    empty

  # Returns the error object for an attribute
  #
  # @param [String] attribute the attribute to get errors for
  # @return [Object] the error object for the attribute
  forAttribute: (attribute) ->
    @__errors[attribute]
