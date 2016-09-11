((config) ->

  # The base URL to structure all queries from
  #
  # @example 'https://www.example.com/api/v1/'
  config.baseUrl = null

  # The headers to include when querying a URL
  #
  # @example
  #   {
  #     Authorization: "Basic #{window.btoa(unescape(encodeURIComponent('[API_LOGIN]:[API_SECRET]')))}"
  #   }
  config.headers = {}

  # The scope object to check for ActiveResource classes when calling `constantize`
  #
  # @example Occsn
  #   ActiveResource.constantize('Product') == window.prototype['Product']
  config.constantizeScope = window

  # The interface class that allows for ActiveResource subclasses to submit queries to the server indicated by
  # `baseUrl`
  #
  # @example
  #   ActiveResource.interface = ActiveResource::Interfaces::JsonApi
  #
  config.interface = ActiveResource::Interfaces::JsonApi
)(ActiveResource)
