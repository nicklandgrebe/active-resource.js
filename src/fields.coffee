# ActiveResource methods for managing changes in tracked fields
class ActiveResource::Fields
  # Returns all of the fields of the klass (attributes + relationships)
  # @return [Collection<String>] the names of all the fields of the klass
  fields: ->
    output = ActiveResource::Collection.build(@attributes())
    output.push _.keys(@reflections())...
    output

  # Called in Base constructor to initialize tracking for each field by creating the `__field` object and storing
  #   either blank Collection or null for each field
  @__initializeFields: ->
    @__fields = {}
    @klass().fields().each (field) =>
      if @klass().reflectOnAssociation(field)?.collection()
        @__fields[field] = ActiveResource::Collection.build()
      else
        @__fields[field] = null

  # Called after requests, used to assign the values for fields according to the server's response and
  #   update the control for field tracking
  #
  # @note Each time `changedFields()` is run, the current value of each field is compared against the fields last assigned
  #   using this method.
  #
  # @param [Object] fields the fields to assign and use as the control for field change tracking
  @__assignFields: (fields) ->
    _.each fields, (v, k) =>
      return unless _.has(@__fields, k)

      try
        if @association(k).reflection.collection()
          @__fields[k] = ActiveResource::Collection.build(v)
        else
          @__fields[k] = v
      catch
        @__fields[k] = v

    @assignAttributes(fields)

  # If true, at least one field on the resource has changed
  # @return [Boolean] whether or not the resource has changed
  @changed: ->
    !@changedFields().empty()

  # Returns all of the fields that have been changed since the last server response
  # @return [Collection<String>] the changed fields for the resource
  @changedFields: () ->
    @klass().fields().select((field) =>
      oldField = @__fields[field]
      newField = @[field]

      try
        # Relationship field if association found
        association = @association(field)

        newField = @[field]()

        if association.reflection.collection()
          return true if oldField.size() != newField.size()

          newTargets = (newField.target().select (t) =>
            !oldField.include(t) || (association.reflection.autosave() && t.changed())
          )

          return !newTargets.empty()
        else
          oldField != newField ||
            association.reflection.autosave() && newField.changed()
      catch
        # Attribute field if association not found
        # Check that they are not equal, and that its not a case of undefined !== null
        oldField != newField && !_.isUndefined(newField)
    )
