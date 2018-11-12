class ActiveResource::Immutable::Base extends ActiveResource::Base
  ActiveResource.include(@, ActiveResource::Immutable::Attributes)
  ActiveResource.include(@, ActiveResource::Immutable::Errors)
  ActiveResource.include(@, ActiveResource::Immutable::Persistence)

  constructor: ->
    super
