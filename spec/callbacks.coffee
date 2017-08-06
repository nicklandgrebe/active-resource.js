describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    jasmine.Ajax.uninstall()

  describe '::Callbacks', ->
    describe '#afterBuild()', ->
      beforeEach ->
        MyLibrary::Order.afterBuild(->
          @orderItems().build([{}, {}, {}])
        )

        MyLibrary::Order.last().then window.onSuccess
        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
        @resource = window.onSuccess.calls.mostRecent().args[0]

      afterEach ->
        MyLibrary::Order.__callbacks['afterBuild'].clear()

      it 'calls after making a request', ->
        expect(@resource.orderItems().size()).toEqual(3)
