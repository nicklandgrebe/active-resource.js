# Abstract class for defining an interface between a server and ActiveResource
# TODO: Ensure contentType is consistent in requests/responses
class ActiveResource::Interfaces
  class @::Base
    # Makes an HTTP request to a url with data
    #
    # @param [String] url the url to query
    # @param [String] method the HTTP verb to use for the request
    # @param [Object] data the data to send to the server
    @request: (url, method, data) ->
      options =
        contentType: 'application/json'
        dataType: 'json'
        headers: ActiveResource.headers
        method: method
        url: url

      options['data'] =
        if method == 'GET'
          data
        else
          JSON.stringify(data)

      $.ajax options

    # Make GET request
    #
    # @param [String] url the url to query
    # @param [Object] queryParams query params to send to the server
    @get: (url, queryParams) ->
      throw '#get not implemented on base interface'

    # Make POST request
    #
    # @param [String] url the url to query
    # @param [Object] resourceData the resourceData to send to the server
    # @param [Object] options options that may modify the data sent to the server
    @post: (url, resourceData, options) ->
      throw '#post not implemented on base interface'

    # Make PATCH request
    #
    # @param [String] url the url to query
    # @param [Object] resourceData the resourceData to send to the server
    # @param [Object] options options that may modify the data sent to the server
    @patch: (url, resourceData, options) ->
      throw '#patch not implemented on base interface'

    # Make PUT request
    #
    # @param [String] url the url to query
    # @param [Object] resourceData the resourceData to send to the server
    # @param [Object] options options that may modify the data sent to the server
    @put: (url, resourceData, options) ->
      throw '#put not implemented on base interface'

    # Make DELETE request
    #
    # @param [String] url the url to query
    # @param [Object] resourceData the resourceData to send to the server
    # @param [Object] options options that may modify the data sent to the server
    @delete: (url, resourceData, options) ->
      throw '#delete not implemented on base interface'
