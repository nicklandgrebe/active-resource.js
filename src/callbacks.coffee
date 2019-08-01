# ActiveResource callbacks to execute around things like requests and initialization
class ActiveResource::Callbacks
  callbacks: ->
    @__callbacks ||= {
      afterBuild: ActiveResource::Collection.build(),
      afterCreate: ActiveResource::Collection.build(),
      afterRequest: ActiveResource::Collection.build()
    }

  afterBuild: (func) ->
    @callbacks()['afterBuild'].push func

  afterCreate: (func) ->
    @callbacks()['afterCreate'].push func

  afterRequest: (func) ->
    @callbacks()['afterRequest'].push func

  # private

  @__executeCallbacks: (type) ->
    @klass().callbacks()[type].each (callback) => _.bind(callback, this)()
