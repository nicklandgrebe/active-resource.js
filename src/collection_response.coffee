# Wraps an ActiveResource::Collection with some useful functions specific to GET responses
ActiveResource.CollectionResponse = class ActiveResource::CollectionResponse extends ActiveResource::Collection
  # Builds a new ActiveResource::CollectionResponse
  #
  # @param [Array,Collection,Object] array the array/object to wrap in a collection
  # @return [CollectionResponse] the built CollectionResponse
  @build: (array = []) ->
    if array.isA?(ActiveResource::Collection)
      new this(array.toArray())
    else
      super(array)

  # Retrieves and sets the links that were sent at the top level in the response
  #
  # @param [Object] data the link data to set this CollectionResponse's links to
  # @return [Object] the link data for the response
  links: (data = {}) ->
    if !_.isEmpty(data) || !@__links?
      @__links = data

    @__links

  # Indicates whether or not a prev link was included in the response
  #
  # @return [Boolean] whether or not the response has a previous page that can be loaded
  hasPrevPage: ->
    this.links()['prev']?

  # Indicates whether or not a next link was included in the response
  #
  # @return [Boolean] whether or not the response has a next page that can be loaded
  hasNextPage: ->
    this.links()['next']?

  # Loads data at links()['prev'] if there is a link
  #
  # @return [Promise] a promise to return the previous page of data, or errors
  prevPage: ->
    if this.hasPrevPage()
      this.prevPagePromise ||
        this.prevPagePromise = this.first().klass().resourceLibrary.interface.get(this.links()['prev'])

  # Loads data at links()['next'] if there is a link
  #
  # @return [Promise] a promise to return the next page of data, or errors
  nextPage: ->
    if this.hasNextPage()
      this.nextPagePromise ||
        this.nextPagePromise = this.first().klass().resourceLibrary.interface.get(this.links()['next'])

  # Converts this a plain ActiveResource::Collection
  #
  # @return [Collection] the converted collection for this CollectionResponse
  toCollection: ->
    ActiveResource::Collection.build(this.toArray())
