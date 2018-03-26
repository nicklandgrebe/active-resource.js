# ActiveResource methods for managing attributes of immutable resources
class ActiveResource::Immutable::Errors extends ActiveResource::Errors

  # Override ActiveResource::Errors#errors so that errors on resources are managed immutably
  @errors: ->
    @__errors ||= new ActiveResource::Immutable::Errors(this)

  # Adds an error with code and message to a new immutable resource's error object for a field
  #
  # @param [String] field the field the error applies to
  #   Or 'base' if it applies to the base object
  # @param [String] code the code for the error
  # @param [String] detail the message for the error
  # @return [ActiveResource::Base] the new resource with the error added
  add: (field, code, detail = '') ->
    clone = @base.clone()
    clone.errors().__add(field, code, detail)
    clone

  # Adds an array of errors in a new immutable resource and returns the resource
  #
  # @see #add for individual error params
  #
  # @param [Array<Array>] errors error objects to add
  # @return [ActiveResource::Base] the new resource with the errors added
  addAll: (errors...) ->
    clone = @base.clone()
    _.map(errors, (error) =>
      clone.errors().__add(error...)
    )

    clone

  # Propagates errors with nested fields down through relationships to their appropriate resources
  #
  # @note Clones any resource that has errors added to it and replaces it on the owner's association target
  #
  # @param [ActiveResource.Collection<Object>] errors the errors to propagate down the resource
  propagate: (errors) ->
    errorsByTarget = errors.inject({}, (targetObject, error) =>
      nestedField = error.field.split('.')
      field = nestedField.shift()

      nestedError = _.clone(error)

      if !targetObject[field]?
        try
          association = @base.association(field)
        catch
          association = null

        targetObject[field] = {
          association: association,
          errors: ActiveResource.Collection.build()
        }

      if targetObject[field].association?
        nestedError.field = nestedField.length == 0 && 'base' || nestedField.join('.')

      targetObject[field].errors.push(nestedError)
      targetObject
    )

    _.each(errorsByTarget, (errorsForTarget, k) =>
      if errorsForTarget.association?
        association = errorsForTarget.association

        if association.reflection.collection()
          baseErrors = errorsForTarget.errors.select((e) => e.field == 'base')
          baseErrors.each((e) =>
            e.field = k
            errorsForTarget.errors.delete(e)
          )
          baseErrors.each((e) => @push(e))

          relationshipResource = association.target.first()
          if clone = relationshipResource?.__createClone(cloner: @base)
            clone.errors().propagate(errorsForTarget.errors)
            association.target.replace(relationshipResource, clone)
            @base.__fields[association.reflection.name].replace(relationshipResource, clone)
        else
          association.target?.__createClone(cloner: @base).errors().propagate(errorsForTarget.errors)
      else
        errorsForTarget.errors.each((e) => @push(e))
    )
