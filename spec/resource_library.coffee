describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    jasmine.Ajax.uninstall()

  describe '.createResourceLibrary', ->
    beforeEach ->
      @myLibrary = ActiveResource.createResourceLibrary(
        'https://www.example.com',
        headers: { Authorization: 'xxx' },
        interface: ActiveResource.Interfaces.JsonApi,
        constantizeScope: window
      )

    it 'adds the baseUrl to the library', ->
      expect(@myLibrary.baseUrl).toEqual('https://www.example.com/')

    it 'adds the headers to the library', ->
      expect(@myLibrary.headers).toEqual({ Authorization: 'xxx' })

    it 'adds the interface to the library', ->
      expect(@myLibrary.interface.constructor).toBe(ActiveResource.Interfaces.JsonApi)

    it 'adds the constantizeScope to the library', ->
      expect(@myLibrary.constantizeScope).toEqual(window)

    describe 'when interface not provided', ->
      beforeEach ->
        @myLibrary = ActiveResource.createResourceLibrary(
          'https://www.example.com',
          headers: { Authorization: 'xxx' }
        )

      it 'uses JsonApi interface', ->
        expect(@myLibrary.interface.constructor).toBe(ActiveResource::Interfaces::JsonApi)

  describe 'ResourceLibrary', ->
    beforeEach ->
      @MyLibrary = ActiveResource.createResourceLibrary(
        'https://www.example.com',
        headers: { Authorization: 'xxx' }
      )

      class @MyLibrary::Product extends @MyLibrary.Base
        @className = 'Product'
        @queryName = 'products'

    describe '#constantize', ->
      it 'returns the correct class', ->
        expect(@MyLibrary.constantize('Product')).toEqual(@MyLibrary::Product)

      describe 'when class does not exist', ->
        beforeEach -> @className = 'ClassThatDoesNotExist'

        it 'throws an error', ->
          expect(=> @MyLibrary.constantize(@className)).toThrow()

      describe 'when constantizeScope set', ->
        beforeEach ->
          @MyLibrary.constantizeScope = window

          class window.Product extends @MyLibrary.Base
            @className = 'Product'

        afterEach ->
          @MyLibrary.constantizeScope = null

        it 'uses the scope', ->
          expect(@MyLibrary.constantize('Product')).toEqual(window.Product)

    describe 'when making a request', ->
      beforeEach ->
        @MyLibrary::Product.find(1)

      it 'uses the baseUrl', ->
        expect(jasmine.Ajax.requests.mostRecent().url).toContain('https://www.example.com/')

      it 'uses the headers', ->
        expect(jasmine.Ajax.requests.mostRecent().requestHeaders['Authorization']).toEqual('xxx')
