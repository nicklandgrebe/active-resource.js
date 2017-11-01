describe 'ActiveResource', ->
  beforeEach ->
    moxios.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

    MyLibrary::Product.last().then window.onSuccess

    @promise = moxios.wait =>
      moxios.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
      .then =>
        @resource = window.onSuccess.calls.mostRecent().args[0]

  afterEach ->
    moxios.uninstall()

  describe '::Attributes', ->
    describe '#hasAttribute()', ->
      describe 'if resource has attribute', ->
        beforeEach ->
          @promise2 = @promise.then =>
            @resource.myAttribute = 'value'

        it 'returns true', ->
          @promise2.then =>
            expect(@resource.hasAttribute('myAttribute')).toBeTruthy()

      describe 'if resource does not have attribute', ->
        it 'returns false', ->
          @promise.then =>
            expect(@resource.__readAttribute('myAttribute')).toBeFalsy()

    describe '#__readAttribute()', ->
      describe 'if resource has attribute', ->
        beforeEach ->
          @promise2 = @promise.then =>
            @resource.myAttribute = 'value'

        it 'returns the attribute', ->
          @promise2.then =>
            expect(@resource.__readAttribute('myAttribute')).toEqual('value')

      describe 'if resource does not have attribute', ->
        it 'returns the attribute', ->
          @promise.then =>
            expect(@resource.__readAttribute('myAttribute')).toBeUndefined()

    describe '#assignAttributes()', ->
      it 'assigns attributes', ->
        @promise.then =>
          @resource.assignAttributes({ anAttribute: 'value' })
          expect(@resource.hasAttribute('anAttribute')).toBeTruthy()

    describe '#attributes()', ->
      describe 'if attribute is a property', ->
        beforeEach ->
          @promise2 = @promise.then =>
            @resource.myAttribute = 1

        it 'returns the attribute', ->
          @promise2.then =>
            expect(@resource.attributes()['myAttribute']).toBeDefined()

      describe 'if attribute is a reserved word', ->
        beforeEach ->
          @promise2 = @promise.then =>
            @resource.__links = {}

        it 'does not return the attribute', ->
          @promise2.then =>
            expect(@resource.attributes()['__links']).toBeUndefined()

      describe 'if attribute is a function', ->
        beforeEach ->
          @promise2 = @promise.then =>
            @resource.myMethod = ->

        it 'does not return the attribute', ->
          @promise2.then =>
            expect(@resource.attributes()['myMethod']).toBeUndefined()

    describe '#reload()', ->
      describe 'when resource is persisted', ->
        it 'makes a call to GET the resource', ->
          @promise.then =>
            @resource.reload()

            moxios.wait =>
              expect(moxios.requests.mostRecent().url).toEqual(@resource.links()['self'])

        it 'reloads the resource\'s attributes', ->
          @promise.then =>
            oldTitle = @resource.title
            @resource.reload()

            moxios.wait =>
              moxios.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
              .then =>
                expect(@resource.title).not.toEqual(oldTitle)

      describe 'when resource has ID', ->
        beforeEach ->
          @resource2 = MyLibrary::Product.build(id: 1)

        it 'makes a call to GET the resource', ->
          @resource2.reload()
          moxios.wait =>
            expect(moxios.requests.mostRecent().url).toEqual(@resource2.links()['related'] + '1/')

      describe 'when resource is not persisted nor has ID', ->
        beforeEach ->
          @resource2 = MyLibrary::Product.build()

        it 'throws an error', ->
          expect(-> @resource2.reload()).toThrow()
