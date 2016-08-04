# =require underscore
# =require underscore.string
# =require underscore.inflection

class window.ActiveResource
  # The base URL to structure all queries from
  #
  # @example 'https://app.getoccasion.com/api/v1/'
  @baseUrl = null

  # The headers to include when querying a URL
  #
  # @example
  #   {
  #     Authorization: "Basic #{window.btoa(unescape(encodeURIComponent('[API_LOGIN]:[API_SECRET]')))}"
  #   }
  @headers = {}

  # The scope object to check for ActiveResource classes when calling `constantize`
  #
  # @example Occsn
  #   ActiveResource.constantize('Product') == window.prototype['Product']
  @constantizeScope = window

  # The interface class that allows for ActiveResource subclasses to submit queries to the server indicated by
  # `baseUrl`
  #
  # @example
  #   ActiveResource.interface = ActiveResource::Interfaces::JsonApi
  #
  @interface = null

  # Constantizes a className string into an actual ActiveResource::Base class
  #
  # @note By default, is scoped to the window object, so all lookups are
  #   window[klassName]. Thus, by default, all subclasses of ActiveResource::Base
  #   should be added to the window object
  #
  # @note Throws exception if klass cannot be found
  #
  # @param [String] className the class name to look for a constant with
  # @return [Class] the class constant corresponding to the name provided
  @constantize: (className) ->
    unless (klass = ActiveResource.constantizeScope[className])?
      throw "NameError: klass #{className} does not exist"
    klass

  # Extends a klass with a mixin's members, so the klass itself will have those members
  #
  # @param [Class] klass the object to extend the mixin into
  # @param [Class,Object] mixin the methods/members to extend into the obj
  @extend: (klass, mixin) ->
    for name, method of mixin
      unless method.__excludeFromExtend
        klass[name] = method

  # Adds a mixin's members to a klass prototype, so instances of that klass will
  # have those members
  #
  # @param [Class] klass the klass to include mixin members in when instantiated
  # @param [Class,Object] mixin the methods/members to include into the klass instances
  @include: (klass, mixin) ->
    @extend klass.prototype, mixin
