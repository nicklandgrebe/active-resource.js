# =require ../../global

# Defines accessors on ActiveResources for managing associations, handling
# foreign key reassignment, persistence, etc.
class ActiveResource::Associations::Builder
  # Don't add this class when extending/include the parent
  @__excludeFromExtend = true

  class @::Association
    # Builds a reflection of an association and defines accessor methods into instances of the model
    #
    # @param [Class] model the ActiveResource class to apply the association to
    # @param [String] name the name of the association
    # @param [Object] options options to apply to the association
    # @return [Reflection] the built reflection
    @build: (model, name, options) ->
      reflection = ActiveResource::Reflection.create @macro, name, options, model
      @defineAccessors model, reflection
      reflection

    # Defines getter/setter methods on the model for the association
    #
    # @param [Class] model the ActiveResource class to apply the association to
    # @param [Reflection] reflection the reflection of the association to build accessors for
    @defineAccessors: (model, reflection) ->
      name = reflection.name
      @defineReaders(model, name)
      @defineWriters(model, name)

    # Defines getter methods on the model for the association
    #
    # @param [Class] mixin the class to mix getter methods into
    # @param [String] name the name of the association
    @defineReaders: (mixin, name) ->
      mixin::[name] = -> @association(name).reader()
      mixin::["load#{s.capitalize(name)}"] = -> @association(name).loadTarget()

    # Defines setter methods on the model for the association
    #
    # @note In Rails, this method is defined much like `@define_readers` because
    #   operator overloading exists in Ruby. However, because operator overloading does
    #   not exist in Javascript, we must define `assign()` methods for associations. But,
    #   because singular association targets are assigned as variables to their owner model,
    #   whereas collection association targets are wrapped in a proxy, we must define the
    #   `assign()` methods in different ways. Singular association assignment is defined on
    #   the owner model as `assign_[target_klass]()`, whereas collection association
    #   assignment is defined on the proxy object, as `assign()`
    #
    # @param [Class] mixin the class to mix getter methods into
    # @param [String] name the name of the association
    @defineWriters: (mixin, name) ->
      _.noop()
