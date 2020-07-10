class ActiveResource::Immutable::Base extends ActiveResource::Base
  ActiveResource.include(@, ActiveResource::Immutable::Attributes, true)
  ActiveResource.include(@, ActiveResource::Immutable::Errors, true)
  ActiveResource.include(@, ActiveResource::Immutable::Persistence, true)

  constructor: ->
    super()

    @__immutableId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) ->
      r = Math.random() * 16 | 0
      v = if c == 'x' then r else r & 0x3 | 0x8
      v.toString 16
    )

  isSame: (b) ->
    @__immutableId == b.__immutableId
