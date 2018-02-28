# Wraps a Javascript array with some useful functions native to Ruby Arrays
ActiveResource.Collection = class ActiveResource::Collection
  ActiveResource.include(@, ActiveResource::Typing)

  # Builds a new ActiveResource::Collection
  #
  # @param [Array,Collection,Object] array the array/object to wrap in a collection
  # @return [Collection] the built Collection
  @build: (array = []) ->
    if array.isA?(this)
      array.clone()
    else if array.length?
      new this(array)
    else
      new this([array])

  # @param [Array] __collection the collection to wrap with Collection functionality
  constructor: (@__collection = []) ->

  # Returns the size of the collection
  #
  # @return [Integer] the size of the collection
  size: ->
    _.size(@__collection)

  # Indicates whether or not the collection is empty
  #
  # @return [Boolean] whether or not the collection is empty
  empty: ->
    @size() == 0

  # Check whether or not the specified item is in the collection
  #
  # @param [Object] item the item to check for in the collection
  # @return [Boolean] whether or not the item is in the collection
  include: (item) ->
    @indexOf(item) >= 0

  # Get the index of the specified item in the collection
  #
  # @param [Object] item the item to get the index for in the collection
  # @return [Integer] the index of the item in the collection, or -1 if it is not in the collection
  indexOf: (item) ->
    _.indexOf(@__collection, item)

  # Gets the item at the index of the collection
  #
  # @param [Integer] index the index to get
  # @return [Object] the item at the index
  get: (index) ->
    @__collection[index] unless index >= @size()

  # Sets the index of the collection to the item
  #
  # @param [Integer] index the index to set
  # @param [Object] item the item to set on the index
  set: (index, item) ->
    @__collection[index] = item unless index >= @size()

  # Finds original in the collection and if found, replaces it with next
  #
  # @param [Value] original the original item to replace in the collection
  # @param [Value] next the next value to replace the item
  # @return [
  replace: (original, next) ->
    if(index = @indexOf(original)) > -1
      @set(index, next)

    next

  # @return [Array] all the resources loaded in this collection as an array
  toArray: ->
    @__collection

  # @note Alias for toArray()
  # @return [Array] all the resources loaded in this collection as an array
  all: ->
    @toArray()

  # Get the first N resources from this association
  #
  # @param n [Integer] the number of resources to return
  # @return  [Array] array of N resources
  first: (n) ->
    output = _.first(@__collection, n || 1)
    if n
      output
    else
      output[0]

  # Get the last N resources from this association
  #
  # @param n [Integer] the number of resources to return
  # @return  [Array] array of N resources
  last: (n) ->
    output = _.last(@__collection, n || 1)
    if n
      output
    else
      output[0]

  # Performs an iteratee function on each item of the collection
  #
  # @param [Function] iteratee the function to call with each item of the collection passed in
  each: (iteratee) ->
    _.each(@__collection, iteratee)

  # Injects a persisting object as well as each item of the collection into an iteratee, boiling down
  # the collection into a single value that is returned
  #
  # @param memo an initial value to pass into the iteratee
  # @param [Function] iteratee the function to iterate over with the object and items of the collection
  # @return [Collection] the boiled down value as a result of each iteration of the iteratee
  inject: (memo, iteratee) ->
    _.reduce(@__collection, iteratee, memo)

  # Maps each item of the collection into a new collection using the iteratee
  #
  # @param [Function] iteratee the function to call with each item of the collection passed in
  # @return [ActiveResource::Collection] a collection mapped based on the iteratee
  map: (iteratee) ->
    this.constructor.build(_.map(@__collection, iteratee))

  # Removes all null values from the array (undefined, null)
  #
  # @return [ActiveResource::Collection] a collection with all null values removed
  compact: (iteratee) ->
    this.constructor.build(_.without(@__collection,null,undefined))

  # Joins each item of the collection as a string, with a separator
  #
  # @param [String] separator the string to separate each item of the collection with
  # @return [String] the joined collection
  join: (separator = ',') ->
    s.join(separator, _.map(@__collection, (i) -> i.toString())...)

  # Flattens a deep nested array into a shallow array
  #
  # @return [Collection] the shallow collection
  flatten: ->
    this.constructor.build(_.flatten(@__collection))

  # Push objects onto the end of this collection
  #
  # @param objs [Array] a list of objects to push onto the collection
  push: (objs...) ->
    @__collection.push(objs...)

  # TODO: Add pop, shift, and unshift with specs

  # Deletes an item from the collection and returns it
  #
  # @param [Array<Object>] items the items to delete from the collection
  # @return [Array] an array of items deleted from the collection
  delete: (items...) ->
    deleted = _.intersection(@__collection, items)
    @__collection = _.without(@__collection, items...)
    deleted

  # Clear the collection (does not delete on server)
  clear: ->
    @__collection = []

  # Looks through each item in the collection, returning an array of all items that pass the
  # truth test (predicate)
  #
  # @param predicate [Function] the function to evaluate each item in the collection with
  # @return [ActiveResource::Collection] a collection with only item that return true in the predicate
  select: (predicate) ->
    this.constructor.build(_.filter(@__collection, predicate))

  # Get the first item that returns true from the predicate
  #
  # @param [Function] predicate the function to evaluate each resource in the collection with
  # @return [Object] the first resource that returned true in the predicate
  detect: (predicate) ->
    _.detect(@__collection, predicate)

  # Duplicates the items of the collection into a new collection
  #
  # @return [Collection] the cloned collection of original items
  clone: ->
    this.constructor.build(_.map(@__collection, (i) => i))
