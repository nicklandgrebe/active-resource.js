# Adds methods for managing reflections, which reflect on associations of ActiveResources
class ActiveResource::Reflection
  # Returns an object with the name of the reflection as the key and a Reflection as the value
  #
  # @example
  #   Order.reflections() == { transactions: HasManyReflection }
  #
  # @return [Object] the name/reflection pair object for all reflections of the ActiveResource
  reflections: ->
    @__reflections ||= {}

  # Returns all reflections of associations of the ActiveResource class
  #
  # @param [String] macro filters reflections by their macro
  # @return [Collection] a collection of reflections of all associations
  reflectOnAllAssociations: (macro = null) ->
    reflections = ActiveResource::Collection.build(_.values(@__reflections))
    reflections = reflections.select((r) -> r.macro == macro) if macro
    reflections

  # @return [Reflection] the reflection of a specific association
  reflectOnAssociation: (association) ->
    @reflections()[association]

  # TODO: Ensure that autosave associations are reloaded in the same persistence call that originally saved them
  #
  # Returns all reflections of autosaving associations of the ActiveResource class
  #
  # @return [Collection] a collection of reflections of all autosaving associations
  reflectOnAllAutosaveAssociations: ->
    reflections = ActiveResource::Collection.build(_.values(@__reflections))
    reflections.select((r) -> r.options['autosave'])

  # Creates a reflection of an association
  #
  # @param [String] macro the macro type for the reflection (hasMany, hasOne, belongsTo)
  # @param [String] name the name of the association to reflect on
  # @param [Object] options the options to build into the reflection
  # @param [Class] activeResource the ActiveResource class that owns this reflection
  # @return [Reflection] the built reflection of an association
  @create: (macro, name, options, activeResource) ->
    klass =
      switch macro
        when 'hasMany'   then Reflection::HasManyReflection
        when 'hasOne'    then Reflection::HasOneReflection
        when 'belongsTo' then Reflection::BelongsToReflection

    new klass(name, options, activeResource)

  # Adds a reflection to the ActiveResource's class
  #
  # @param [Class] ar the ActiveResource class to add the reflection to
  # @param [String] name the name of the reflection
  # @param [Reflection] reflection the reflection to add to the class
  @addReflection: (ar, name, reflection) ->
    r = {}
    r[name] = reflection
    ar.__reflections = _.extend(ar.__reflections || {}, r)

  # Reflects on associations between ActiveResources. This is stored at the class level,
  # and when an ActiveResource is instantiated the reflection is built into an appropriate
  # Association
  class @::AbstractReflection
    ActiveResource.include(@, ActiveResource::Typing)

    @__excludeFromExtend = true

    # @param [String] name the name of the association to reflect on
    # @param [Object] options the options to build into the reflection
    # @param [Class] activeResource the ActiveResource class that owns this reflection
    constructor: (@name, @options, @activeResource) ->

    # Returns the target klass that this reflection reflects on
    # @note Will throw error if called on polymorphic reflection
    #
    # @return [Class] The klass that this reflection reflects on
    klass: ->
      ActiveResource.constantize(@className())

    type: ->
      @__type ||= @options['as'] && (@options['foreignType'] || "#{@options['as']}Type")

    # @return [String] the className of the klass this reflection reflects on
    className: ->
      @__className ||= @options['className'] || @__deriveClassName()

    # @return [String] the foreignKey of the reflection
    foreignKey: ->
      @__foreignKey ||= @options['foreignKey'] || @__deriveForeignKey()

    # @return [String] the foreignType of the reflection
    foreignType: ->
      @__foreignType ||= @options['foreignType'] || "#{@name}Type"

    # @param [Class] the class to get the primary key of
    # @return [String] the primary key for the associated klass this reflects on
    associationPrimaryKey: (klass) ->
      @options['primaryKey'] || @__primaryKey(klass || @klass())

    # @return [String] the primaryKey for the owner ActiveResource of the reflection
    activeResourcePrimaryKey: ->
      @__activeResourcePrimaryKey ||= @options['primaryKey'] || @__primaryKey(@activeResource)

    # @return [Boolean] whether or not this reflection is for a collection of resources
    collection: ->
      false

    # @return [Boolean] whether or not this reflection is the hasOne side of a singular reflection
    hasOne: ->
      false

    # @return [Boolean] whether or not this reflection is the belongsTo side of a singular reflection
    belongsTo: ->
      false

    # @return [Boolean] whether or not the association can be constructed via a build/create method
    constructable: ->
      true

    # @return [Boolean] whether or not the association is polymorphic
    polymorphic: ->
      @options['polymorphic']

    buildAssociation: ->
      new (@klass())()

    # Whether or not the reflection has an inverse
    hasInverse: ->
      @__inverseName()?

    # The inverseOf this reflection on the target klass
    # @example
    #   Product.hasMany('orders')
    #   Order.belongsTo('product')
    #
    #   Product.reflectOnAssociation('orders').inverseOf()
    #     # => Order.reflectOnAssociation('product')
    #
    # @return [Reflection] the inverseOf this reflection
    inverseOf: ->
      return unless @hasInverse()

      @__inverseOf ||= @klass().reflectOnAssociation(@__inverseName())

    # Finds the inverseOf a polymorphic reflection, given a class to search the reflections of
    #
    # @note The child side of the relationship must define @options['inverseOf'] in order for
    #   this to work
    #
    # @example
    #   Order.hasMany('comments', as: 'resource')
    #   Comment.belongsTo('resource', polymorphic: true, inverseOf: 'comments')
    #
    #   Comment.reflectOnAssociation('resource').polymorphicInverseOf(Order)
    #   # => Order.reflectOnAssociation('comments')
    #
    # @param [Class] associatedClass the class to check for the inverseOf reflection on
    # @return [Reflection] the inverseOf this polymorphic reflection
    polymorphicInverseOf: (associatedClass) ->
      if @hasInverse()
        if (inverseRelationship = associatedClass.reflectOnAssociation(@options['inverseOf']))
          inverseRelationship

    # private

    # Derives the class name of the reflection from its name
    # @return [String] the class name of the reflection
    __deriveClassName: ->
      s.classify(_.singularize(@name))

    # Derives the foreign key of the reflection based on its type
    # @return [String] the foreign key of the reflection
    __deriveForeignKey: ->
      if @belongsTo()
        "#{@name}Id"
      else if @options['as']
        "#{@options['as']}Id"
      else
        "#{s.camelize(@activeResource.className, true)}Id"

    # Determines the primaryKey of a given class
    # @note Throws an error if the primaryKey could not be determined
    #
    # @param [Class] klass the klass to determine the primaryKey of
    # @return [String] the primaryKey of the class
    __primaryKey: (klass) ->
      klass.primaryKey || throw "Unknown primary key for #{klass.className}"

    # The name of the inverseOf this reflection
    # @example
    #   Product.has_many('orders')
    #   Product.reflectOnAssociation('orders').inverseName() # => 'product'
    #
    # @return [String] the name of the inverseOf this reflection
    __inverseName: ->
      @options['inverseOf'] ||
        if @__automaticInverseOf == false
          null
        else
          @__automaticInverseOf ||= automaticInverseOf(this)

    # Finds the inverseOf the reflection automatically, either because an inverseOf option
    # was specified or through using the name of the ActiveResource to find this reflection
    # on the target klass
    #
    # @note A belongsTo reflection will not have an automaticInverseOf if it belongsTo a
    #   one-to-many reflection
    #
    # @param [Reflection] the reflection to find the automaticInverseOf
    # @return [Reflection,Boolean] the automaticInverseOf reflection for this reflection
    automaticInverseOf = (reflection) ->
      if canFindInverseOfAutomatically(reflection)
        inverseName = s.camelize(reflection.options['as'] || reflection.activeResource.className,true)

        try inverseReflection = reflection.klass().reflectOnAssociation(inverseName)
        catch e then inverseReflection = false

        if validInverseReflection(reflection, inverseReflection)
          return inverseName

      false

    VALID_AUTOMATIC_INVERSE_MACROS = ['hasMany', 'hasOne', 'belongsTo']
    INVALID_AUTOMATIC_INVERSE_OPTIONS = ['polymorphic']

    # Check that reflection does not have any options that prevent us from being
    # able to guess its inverse automatically.
    #
    # @note
    #   1. The 'inverseOf' option cannot be false
    #   2. The reflection macro must be in the list of valid automatic inverse macros
    #   3. The reflection must not have any options like 'polymorphic' that prevent us
    #      from correctly guessing the inverse
    #
    # @param [Reflection] reflection the reflection to check if we can find the inverseOf automatically
    # @return [Boolean] whether or not we can find the inverseOf automatically
    canFindInverseOfAutomatically = (reflection) ->
      reflection.options['inverseOf'] != false &&
        _.include(VALID_AUTOMATIC_INVERSE_MACROS, reflection.macro) &&
        _.isEmpty(_.pick(reflection.options, INVALID_AUTOMATIC_INVERSE_OPTIONS...))

    # Checks if inverse reflection that is returned from `automaticInverseOf` method is a
    # valid reflection. We must make sure that the reflections ActiveResource className matches
    # up with the current reflections klass className
    #
    # @note klass() will always be valid because when theres an error from calling `klass()`,
    #   `reflection` will already be set to false
    #
    # @param [Reflection] reflection the reflection this inverseReflection will be for
    # @param [Reflection,Boolean] inverseReflection the inverse reflection to check the validity of
    # @return [Boolean] whether or not the inverse reflection is valid
    validInverseReflection = (reflection, inverseReflection) ->
      inverseReflection? &&
        reflection.klass().className == inverseReflection.activeResource.className &&
        canFindInverseOfAutomatically(inverseReflection)

  class @::HasManyReflection extends @::AbstractReflection
    @__excludeFromExtend = true

    macro: 'hasMany'

    collection: ->
      true

    associationClass: ->
      ActiveResource::Associations::HasManyAssociation

  class @::HasOneReflection extends @::AbstractReflection
    @__excludeFromExtend = true

    macro: 'hasOne'

    hasOne: ->
      true

    associationClass: ->
      ActiveResource::Associations::HasOneAssociation

  class @::BelongsToReflection extends @::AbstractReflection
    @__excludeFromExtend = true

    macro: 'belongsTo'

    belongsTo: ->
      true

    constructable: ->
      !@polymorphic()

    associationClass: ->
      if @polymorphic()
        ActiveResource::Associations::BelongsToPolymorphicAssociation
      else
        ActiveResource::Associations::BelongsToAssociation
