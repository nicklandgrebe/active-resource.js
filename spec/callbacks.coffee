describe 'ActiveResource', ->
  beforeEach ->
    moxios.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    moxios.uninstall()

  describe '::Callbacks', ->
    describe '#afterBuild()', ->
      beforeEach ->
        MyLibrary::Order.afterBuild(->
          @orderItems().build([{}, {}, {}])
        )

        MyLibrary::Order.last()
        .then window.onSuccess

        @promise = moxios.wait =>
          moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
          .then =>
            @resource = window.onSuccess.calls.mostRecent().args[0]

      afterEach ->
        MyLibrary::Order.__callbacks['afterBuild'].clear()

      it 'calls after making a request', ->
        @promise.then =>
          expect(@resource.orderItems().size()).toEqual(3)
