describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

    MyLibrary::Product.last().then window.onSuccess

    jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
    @resource = window.onSuccess.calls.mostRecent().args[0]

  afterEach ->
    jasmine.Ajax.uninstall()

  describe '::Attributes', ->
    describe '#hasAttribute()', ->
      describe 'if resource has attribute', ->
        beforeEach ->
          @resource.myAttribute = 'value'

        it 'returns true', ->
          expect(@resource.hasAttribute('myAttribute')).toBeTruthy()

      describe 'if resource does not have attribute', ->
        it 'returns false', ->
          expect(@resource.__readAttribute('myAttribute')).toBeFalsy()

    describe '#__readAttribute()', ->
      describe 'if resource has attribute', ->
        beforeEach ->
          @resource.myAttribute = 'value'

        it 'returns the attribute', ->
          expect(@resource.__readAttribute('myAttribute')).toEqual('value')

      describe 'if resource does not have attribute', ->
        it 'returns the attribute', ->
          expect(@resource.__readAttribute('myAttribute')).toBeUndefined()

    describe '#assignAttributes()', ->
      it 'assigns attributes', ->
        @resource.assignAttributes({ anAttribute: 'value' })
        expect(@resource.hasAttribute('anAttribute')).toBeTruthy()

    describe '#attributes()', ->
      describe 'if attribute is a property', ->
        beforeEach ->
          @resource.myAttribute = 1

        it 'returns the attribute', ->
          expect(@resource.attributes()['myAttribute']).toBeDefined()

      describe 'if attribute is a reserved word', ->
        beforeEach ->
          @resource.__links = {}

        it 'returns the attribute', ->
          expect(@resource.attributes()['__links']).toBeUndefined()

      describe 'if attribute is a function', ->
        beforeEach ->
          @resource.myMethod = ->

        it 'returns the attribute', ->
          expect(@resource.attributes()['myMethod']).toBeUndefined()

    describe '#reload()', ->
      describe 'when resource is persisted', ->
        it 'makes a call to GET the resource', ->
          @resource.reload()
          expect(jasmine.Ajax.requests.mostRecent().url).toEqual(@resource.links()['self'])

        it 'reloads the resource\'s attributes', ->
          oldTitle = @resource.title
          @resource.reload()
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
          expect(@resource.title).not.toEqual(oldTitle)

      describe 'when resource is not persisted', ->
        beforeEach ->
          @resource = MyLibrary::Product.build()

        it 'throws an error', ->
          expect(-> @resource.reload()).toThrow()
