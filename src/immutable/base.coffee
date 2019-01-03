class ActiveResource::Immutable::Base extends ActiveResource::Base
  ActiveResource.include(@, ActiveResource::Immutable::Attributes, true)
  ActiveResource.include(@, ActiveResource::Immutable::Errors, true)
  ActiveResource.include(@, ActiveResource::Immutable::Persistence, true)

  constructor: ->
    super()
