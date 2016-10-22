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

  clear: ->
    @reset()

  # Adds an error with code and message to the error object for an attribute
  #
  # @param [String] attribute the attribute the error applies to
  #   Or 'base' if it applies to the base object
  # @param [String] code the code for the error
  # @param [String] detail the message for the error
  # @return [Object] the error object created and added to storage
  add: (attribute, code, detail = '') ->
    @__errors[attribute] ||= []
    @__errors[attribute].push(error = { code: code, detail: detail, message: detail })
    error

  # Indicates whether or not the error with code `code` is on the `attribute`
  #
  # @param [String] attribute the attribute to check if the error exists on
  # @param [String] code the code to check for on the attribute
  # @return [Boolean] whether or not the error with code is on the attribute
  added: (attribute, code) ->
    ActiveResource::Collection.build(@__errors[attribute]).detect((e) -> e.code == code)?

  # Indicates whether or not there are errors for a specific attribute
  #
  # @param [String] attribute the attribute to see if there are errors for
  # @return [Boolean] whether or not the attribute has errors
  include: (attribute) ->
    @__errors[attribute]? && _.size(@__errors[attribute]) > 0

  # Indicates whether or not the errors object is empty
  #
  # @return [Boolean] whether or not the errors object is empty
  empty: ->
    @size() == 0

  # Indicates the size of the errors array
  #
  # @return [Integer] the number of errors
  size: ->
    _.size(@toArray())

  # Delete the errors for a specific attribute
  #
  # @param [String] attribute the attribute to delete errors for
  delete: (attribute) ->
    @__errors[attribute] = []

  # Iterates over each error key, value pair in the errors object
  # using a provided iterator that takes in two arguments (attribute, error)
  #
  # @example
  #   resource.errors().each (attribute, error) ->
  #     # Will yield 'name' and { code: '...', message: '...' }
  #     # Then, will yield 'name' and { code: '...', message: '...' }
  #
  # @param [Function] iterator the function to use to iterate over errors
  each: (iterator) ->
    _.each @__errors, (errors, attribute) ->
      iterator(attribute, error) for error in errors

  # Returns the error object for an attribute
  #
  # @param [String] attribute the attribute to get errors for
  # @return [Object] the error object for the attribute
  forAttribute: (attribute) ->
    ActiveResource::Collection.build(@__errors[attribute]).inject {}, (out, error) ->
      out[error.code] = error.message
      out

  # Returns the error object for base
  #
  # @return [Object] the error object for base
  forBase: ->
    @forAttribute('base')

  # Converts the errors object to an array of errors
  #
  # @return [Array] the errors object converted to an array of errors
  toArray: ->
    output = []
    for attribute, errors of @__errors
      output.push errors...

    output

  # Convert the errors object to a collection of errors
  #
  # @return [Collection] the errors object converted to a collection of errors
  toCollection: ->
    ActiveResource::Collection.build(@toArray())
