# ActiveResource cloning
class ActiveResource::Cloning
  # Clones the resource and its relationship resources recursively
  @clone: ->
    @__createClone({})

  # private

  # Clones a resource recursively, taking in a cloner argument to protect against circular cloning
  #   of relationships
  #
  # @note This will clone:
  #   1. Resource errors
  #   2. Resource links
  #   3. Resource queryParams
  #   4. Resource attributes
  #   5. Resource relationships
  #     a. Relationship links
  #     b. Relationship loaded status
  #     c. Relationship resources, according to these principles:
  #       1. An autosave association is interpreted as part of the identity of a resource. If the resource
  #          is cloned, the autosave association target is cloned, and vice-versa.
  #       2. Only clone a related resource if it is part of the identity of the resource being cloned.
  #
  # @option [ActiveResource::Base] cloner the resource cloning this resource (always a related resource)
  # @option [ActiveResource::Base] newCloner the clone of cloner to reassign fields to
  # @return [ActiveResource::Base] the cloned resource
  @__createClone: ({ cloner, newCloner }) ->
    clone = @klass().build()

    @errors().each (attribute, e) => clone.errors().push(_.clone(e))
    clone.__links = _.clone(@links())

    clone.__queryParams = _.clone(@queryParams())

    attributes = {}
    attributes[@klass().primaryKey] = @[@klass().primaryKey]

    clone.__assignAttributes(_.extend(attributes, @attributes()));

    @klass().fields().each (f) =>
      clone.__fields[f] =
        if @__fields[f]?.toArray?
          @__fields[f].clone()
        else
          @__fields[f]

      try
        oldAssociation = @association(f)
        newAssociation = clone.association(f)

        newAssociation.__links = _.clone(oldAssociation.links())
        if oldAssociation.loaded()
          newAssociation.loaded(true)

        reflection = oldAssociation.reflection

        target =
          if reflection.collection()
            if reflection.autosave() && oldAssociation.target.include(cloner)
              @__createCollectionAutosaveAssociationClone(
                oldAssociation,
                {
                  parentClone: clone,
                  cloner: cloner,
                  newCloner: newCloner
                }
              )
            else if reflection.inverseOf()?.autosave()
              @__createCollectionInverseAutosaveAssociationClone(
                oldAssociation,
                {
                  parentClone: clone,
                  cloner: cloner
                }
              )
            else
              oldAssociation.target
          else
            if reflection.polymorphic()
              oldAssociation.target
            else if reflection.autosave() && oldAssociation.target == cloner
              @__createSingularAutosaveAssociationClone(
                oldAssociation,
                {
                  parentClone: clone,
                  newCloner: newCloner
                }
              )
            else if reflection.inverseOf()?.autosave() && oldAssociation.target?
              @__createSingularInverseAutosaveAssociationClone(
                oldAssociation,
                {
                  parentClone: clone,
                  cloner: cloner
                }
              )
            else
              if reflection.inverseOf()?.collection()
                @__replaceSingularInverseCollectionAssociationClone(
                  oldAssociation,
                  {
                    parentClone: clone
                  }
                )

              oldAssociation.target

        newAssociation.writer(target, false)
      catch
        true

    clone

  # Creates a clone of an autosave collection association on parentClone when cloner of
  #   parentClone is in the association's target
  #
  # @example
  #   An order has many orderItems that it autosaves. When an orderItem is cloned, clone the order
  #   and replace the cloned orderItem in its orderItems collection but skip cloning the other
  #   orderItems.
  #
  # @note The following changes are made:
  #   1. Replaces the cloner with the newCloner in the collection on parentClone
  #   2. Replaces the cloner with the newCloner in the parentClone fields cache so newCloner
  #        is not registered as a change in the collection
  #   3. Replaces the inverse belongsTo association on each member of the collection with parentClone
  #
  # @param [Association] association the association that is being cloned
  # @param [ActiveResource] parentClone the cloned owner that is cloning the association
  # @param [ActiveResource] cloner the original related resource that initiated parentClone to be cloned
  # @param [ActiveResource] newCloner the clone of cloner
  # @return [Collection] the clone of the collection association
  @__createCollectionAutosaveAssociationClone: (association, { parentClone, cloner, newCloner }) ->
    clone = association.target.clone()

    clone.replace(cloner, newCloner)
    parentClone.__fields[association.reflection.name].replace(cloner, newCloner)

    if(inverse = association.reflection.inverseOf())?
      clone.each((t) =>
        if t.__fields[inverse.name] == this
          t.__fields[inverse.name] = parentClone

        t.association(inverse.name).writer(parentClone, false)
      )

    clone

  # Clones each item in a collection association on parentClone when the inverse of the association
  #   is autosaving
  #
  # @example
  #   A customer has many orders, and each order autosaves the customer so that customer information
  #   can be updated with each new order. When the order is cloned, clone the customer and since the
  #   customer is cloned, clone each order that it has but skip cloning the order that initiated
  #   cloning.
  #
  # @note The following changes are made:
  #   1. Clones each item in the association
  #   2. Replaces each item in the parentClone fields cache with the clone of each item
  #   3. Skips cloning the item that is the cloner of parentClone
  #
  # @param [Association] association the association that is being cloned
  # @param [ActiveResource] parentClone the cloned owner that is cloning the association
  # @param [ActiveResource] cloner the original related resource that initiated parentClone to be cloned
  # @return [Collection] the original collection association
  @__createCollectionInverseAutosaveAssociationClone: (association, { parentClone, cloner }) ->
    association.target.map((t) =>
      if cloner? && cloner == t
        cloner
      else
        clone = t.__createClone(cloner: this, newCloner: parentClone)

        parentClone.__fields[association.reflection.name].replace(t, clone)

        clone
    )

  # Clones an autosaving singular association on parentClone when cloner is the association's target
  #
  # @example
  #   A customer has many orders, and each order autosaves the customer so that customer information
  #   can be updated with each new order. When the customer is cloned, it will clone its orders,
  #   and each order should replace the customer on its belongsTo association with the cloned one.
  #
  # @note The following changes are made:
  #   1. Replaces the association target with newCloner
  #   2. Replaces the parentClone fields cache with newCloner so newCloner is not registered as a change
  #
  # @param [Association] association the association that is being cloned
  # @param [ActiveResource] parentClone the cloned owner that is cloning the association
  # @param [ActiveResource] newCloner the clone of cloner
  # @return [ActiveResource] the new association target, newCloner
  @__createSingularAutosaveAssociationClone: (association, { parentClone, newCloner }) ->
    parentClone.__fields[association.reflection.name] = newCloner

    newCloner

  # Clones a singular association on parentClone when the inverse of the association is autosaving and
  #   the association has a target that can be cloned
  #
  # @example
  #   An order has one rating that it autosaves. When the rating is cloned, clone the order it belongs to.
  #
  # @note
  #   1. If the association target is cloner, no changes are needed
  #   2. If association target is not cloner, clone the association target and replace parentClone field cache
  #        with the clone so that the clone is not registered as a change
  #
  # @param [Association] association the association that is being cloned
  # @param [ActiveResource] parentClone the cloned owner that is cloning the association
  # @param [ActiveResource] cloner the original related resource that initiated parentClone to be cloned
  # @return [ActiveResource] the new association target
  @__createSingularInverseAutosaveAssociationClone: (association, { parentClone, cloner }) ->
    if association.target == cloner
      cloner
    else
      clone = association.target.__createClone(cloner: this, newCloner: parentClone)

      if parentClone.__fields[association.reflection.name] == association.target
        parentClone.__fields[association.reflection.name] = clone

      clone

  # When parentClone has a belongsTo association that is inverse of a collection association, replace
  #   the original of parentClone with parentClone in the collection association
  #
  # @example
  #   An order has many orderItems. When an orderItem is cloned, replace it in the orderItems
  #   collection of the order that it belongs to.
  #
  # @param [Association] association the association that is being cloned
  # @param [ActiveResource] parentClone the cloned owner that is cloning the association
  @__replaceSingularInverseCollectionAssociationClone: (association, { parentClone }) ->
    inverse  = association.reflection.inverseOf()
    association.target.association(inverse.name).target.replace(this, parentClone)
