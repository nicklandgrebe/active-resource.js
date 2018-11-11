# Creates a library that holds resources classes
#
# @param [String] baseUrl the base url for the resource server
# @option [Object] headers the headers to send with each request made in this library
# @option [Interface] interface the interface to use when making requests and building responses
# @option [Object] constantizeScope the scope to use when calling #constantize
# @option [Boolean] immutable if true, resources will act as immutable structures
# @option [Boolean] includePolymorphicRepeats if true, primary data’s relationships will send polymorphic owner data to
#   the server despite that data also being the primary data (a repetition, some servers don't make the assumption)
# @option [Boolean] strictAttributes if true, only attributes defined in a class via the static attributes method will
#   be returned from resource.attributes()
# @return [ResourceLibrary] the created resource library
ActiveResource.createResourceLibrary = (baseUrl, options = {}) ->
  class ResourceLibrary
    @baseUrl:
      if baseUrl.charAt(baseUrl.length - 1) == '/'
        baseUrl
      else
        "#{baseUrl}/"

    @headers: options.headers
    @interface: new (options.interface || ActiveResource.Interfaces.JsonApi)(this)

    @constantizeScope: options['constantizeScope']
    @immutable: options.immutable
    @includePolymorphicRepeats: options.includePolymorphicRepeats
    @strictAttributes: options.strictAttributes

    base =
      if @immutable
        ActiveResource::Immutable::Base
      else
        ActiveResource::Base

    resourceLibrary = this
    @Base: class Base extends base
      this.resourceLibrary = resourceLibrary

    # Constantizes a className string into an actual ActiveResource::Base class
    #
    # @note If constantizeScope is null, checks the property on the resource library,
    #   then on its prototype
    #
    # @note Throws exception if klass cannot be found
    #
    # @param [String] className the class name to look for a constant with
    # @return [Class] the class constant corresponding to the name provided
    @constantize: (className) ->
      klass = null

      if !_.isUndefined(className) && !_.isNull(className)
        scope = @constantizeScope && _.values(@constantizeScope) || _.flatten([_.values(@), _.values(@::)])
        for v in scope
          klass = v if _.isObject(v) && v.className == className

      throw "NameError: klass #{className} does not exist" unless klass?
      klass

    # Creates an ActiveResource::Base class from klass provided
    #
    # @param [Class] klass the klass to create into an ActiveResource::Base class in the library
    # @return [Class] the klass now inheriting from ActiveResource::Base
    @createResource: (klass) ->
      extend = `
        function(child, parent) {
          for (var key in parent) { if (parent.hasOwnProperty(key)) child[key] = parent[key]; }
          function ctor() { this.constructor = child; }
          ctor.prototype = parent.prototype;
          child.prototype = new ctor();
          child.__super__ = parent.prototype;
          return child;
        }
      `

      klass = extend(klass, @Base)

      klass.className ||= klass.name
      klass.queryName ||= _.pluralize(s.underscored(klass.className))

      klass.define?()

      (@constantizeScope || @)[klass.className] = klass

      klass
