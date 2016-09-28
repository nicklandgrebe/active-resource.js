# Creates a library that holds resources classes
#
# @param [String] baseUrl the base url for the resource server
# @option [Object] headers the headers to send with each request made in this library
# @option [Interface] interface the interface to use when making requests and building responses
# @option [Object] constantizeScope the scope to use when calling #constantize
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

    resourceLibrary = this
    @Base: class Base extends ActiveResource::Base
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

      scope = @constantizeScope && _.values(@constantizeScope) || _.flatten([_.values(@), _.values(@::)])
      for v in scope
        klass = v if _.isObject(v) && v.className == className

      throw "NameError: klass #{className} does not exist" unless klass?
      klass
