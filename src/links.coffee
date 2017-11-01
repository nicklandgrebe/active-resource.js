# ActiveResource methods for managing links of resources to their servers
class ActiveResource::Links
  # Links to query the server for this persisted resource with
  links: ->
    @__links ||= _.clone(@klass().links())

  # @note Static method
  # Links to query the server for this model with
  #
  # @return [Object] the URL links used to query this resource type
  @links: ->
    throw 'baseUrl is not set' unless @resourceLibrary.baseUrl?
    throw 'queryName is not set' unless @queryName?

    @__links ||= { related: @resourceLibrary.baseUrl + @queryName + '/' }

  # @note Static method
  # Constructs formatted links
  #
  # @param [Array<String>] args the segments of a URL to join
  # @return [String] joined segments of URL together with /
  @__constructLink: (args...) ->
    _.map(args, (str) ->
      if s.endsWith(str, '/') then str else str + '/'
    ).join('')