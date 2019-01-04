# A class for managing errors associated with persisting an ActiveResource
# Also adds instance methods to ActiveResource::Base to manage the class itself
#
# @example
#   product = Product{ title: '' }
#   product.save ->
#     unless product.valid?()
#       product.errors()
#
ActiveResource.Errors = class ActiveResource::Errors
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

  # Adds an error with code and message to the error object for an field
  #
  # @param [String] field the field the error applies to
  #   Or 'base' if it applies to the base object
  # @param [String] code the code for the error
  # @param [String] detail the message for the error
  # @return [Object] the error object created and added to storage
  add: (field, code, detail = '') ->
    @__add(field, code, detail)

  # Adds an array of errors
  #
  # @see #add for individual error params
  #
  # @param [Array<Array>] errors error objects to add
  addAll: (errors...) ->
    _.map(errors, (error) =>
      @__add(error...)
    )

  # Propagates errors with nested fields down through relationships to their appropriate resources
  # TODO: Propagate errors to appropriate collection item instead of just first
  #
  # @param [ActiveResource.Collection<Object>] errors the errors to propagate down the resource
  propagate: (errors) ->
    errors.each((error) =>
      nestedField = error.field.split('.')
      field = nestedField.shift()

      @push(error);

      try
        association = @base.association(field)

        nestedError = _.clone(error)
        nestedError.field = nestedField.length == 0 && 'base' || nestedField.join('.')

        nestedErrors = ActiveResource.Collection.build([nestedError])

        if association.reflection.collection()
          association.target.first()?.errors().propagate(nestedErrors)
        else
          association.target?.errors().propagate(nestedErrors)
    )

  # Adds an existing error with field to this errors object
  #
  # @param [Object] error the error to push onto this errors object
  # @return [Object] the error object
  push: (error) ->
    @__errors[error.field] ||= []
    @__errors[error.field].push(error)
    error

  # Indicates whether or not the error with code `code` is on the `field`
  #
  # @param [String] field the field to check if the error exists on
  # @param [String] code the code to check for on the field
  # @return [Boolean] whether or not the error with code is on the field
  added: (field, code) ->
    ActiveResource::Collection.build(@__errors[field]).detect((e) -> e.code == code)?

  # Indicates whether or not there are errors for a specific field
  #
  # @param [String] field the field to see if there are errors for
  # @return [Boolean] whether or not the field has errors
  include: (field) ->
    @__errors[field]? && _.size(@__errors[field]) > 0

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

  # Delete the errors for a specific field
  #
  # @param [String] field the field to delete errors for
  delete: (field) ->
    @__errors[field] = []

  # Iterates over each error key, value pair in the errors object
  # using a provided iterator that takes in two arguments (field, error)
  #
  # @example
  #   resource.errors().each (field, error) ->
  #     # Will yield 'name' and { code: '...', message: '...' }
  #     # Then, will yield 'name' and { code: '...', message: '...' }
  #
  # @param [Function] iterator the function to use to iterate over errors
  each: (iterator) ->
    _.each @__errors, (errors, field) ->
      iterator(field, error) for error in errors

  # Returns the error object for an field
  #
  # @param [String] field the name of field to get errors for
  # @return [Object] the error object for the field
  forField: (field) ->
    ActiveResource::Collection
    .build(_.keys(@__errors))
    .select((k) => s.startsWith(k, field))
    .map((k) => @__errors[k]).flatten()

  # Returns the error object for an field
  #
  # @param [String] field the field to get errors for
  # @return [Object] the error object for the field
  detailsForField: (field) ->
    @forField(field).inject {}, (out, error) ->
      out[error.code] = error.detail
      out

  # Returns the error object for base
  #
  # @return [Object] the error object for base
  forBase: ->
    @forField('base')

  # Converts the errors object to an array of errors
  #
  # @return [Array] the errors object converted to an array of errors
  toArray: ->
    output = []
    for field, errors of @__errors
      output.push errors...

    output

  # Convert the errors object to a collection of errors
  #
  # @return [Collection] the errors object converted to a collection of errors
  toCollection: ->
    ActiveResource::Collection.build(@toArray())

  # private

  # Adds an error with code and message to the error object for an field
  #
  # @param [String] field the field the error applies to
  #   Or 'base' if it applies to the base object
  # @param [String] code the code for the error
  # @param [String] detail the message for the error
  # @return [Object] the error object created and added to storage
  __add: (field, code, detail = '') ->
    @__errors[field] ||= []
    @__errors[field].push(error = @__buildError(field, code, detail))
    error

  # @param [String] field the field the error applies to
  #   Or 'base' if it applies to the base object
  # @param [String] code the code for the error
  # @param [String] detail the message for the error
  # @return [Object] a mapped object that represents an error
  __buildError: (field, code, detail) ->
    { field: field, code: code, detail: detail, message: detail }
