# =require ./global

# Adds methods for managing associations, which are built at the instance level
# based on reflections stored at the class level of ActiveResources
class ActiveResource::Associations
  # Finds an association on a resource, and creates it if it was not built yet
  # @note Throws error if association does not exist
  #
  # @param [String] name the name of the association
  # @return [Association] the association for the resource
  association: (name) ->
    @__associations ||= {}

    unless (association = @__associations[name])?
      unless (reflection = @klass().reflectOnAssociation(name))?
        throw "Association #{name} does not exist"

      association = new (reflection.associationClass())(this, reflection)
      @__associations[name] = association

    association

  # Builds a one-to-many relationship between an ActiveResource and another collection of ActiveResources
  #
  # @param [String] name the name of the association
  # @param [Object] options the options to build the association with
  @hasMany: (name, options = {}) ->
    reflection = ActiveResource::Associations::Builder::HasMany.build(this, name, options)
    ActiveResource::Reflection.addReflection this, name, reflection

  # Builds a one-to-one relationship between one ActiveResource and another. This should be used
  # if the class does not contain the foreign_key. If this class contains the foreign_key, you should
  # use #belongsTo() instead
  #
  # @param [String] name the name of the association
  # @param [Object] options the options to build the association with
  @hasOne: (name, options = {}) ->
    reflection = ActiveResource::Associations::Builder::HasOne.build(this, name, options)
    ActiveResource::Reflection.addReflection this, name, reflection

  # Builds a one-to-one relationship between one ActiveResource and another. This should be used
  # if the class contains the foreign_key. If the other class contains the foreign_key, you should
  # use #hasOne() instead
  #
  # @param [String] name the name of the association
  # @param [Object] options the options to build the association with
  @belongsTo: (name, options = {}) ->
    reflection = ActiveResource::Associations::Builder::BelongsTo.build(this, name, options)
    ActiveResource::Reflection.addReflection this, name, reflection
