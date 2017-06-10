# ActiveResource callbacks to execute around things like requests
class ActiveResource::Callbacks
  callbacks: ->
    @__callbacks ||= {
      afterBuild: ActiveResource::Collection.build()
    }

  afterBuild: (func) ->
    @callbacks()['afterBuild'].push func

  # private

  @__executeCallbacks: (type) ->
    @klass().callbacks()[type].each (callback) => _.bind(callback, this)()
