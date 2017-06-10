describe 'ActiveResource', ->
  describe '::Errors', ->
    beforeEach ->
      @resource = MyLibrary::Product.build()
      @resource.errors().add('title', 'blank', 'Title cannot be blank')

    describe '#clear()', ->
      it 'clears the errors', ->
        @resource.errors().clear()
        expect(@resource.errors().size()).toEqual(0)

    describe '#add()', ->
      it 'adds an error with code and message', ->
        expect(@resource.errors().forAttribute('title')).toEqual({ blank: 'Title cannot be blank' })

    describe '#added()', ->
      describe 'when added', ->
        it 'returns true', ->
          expect(@resource.errors().added('title', 'blank')).toBeTruthy()

      describe 'when not added', ->
        it 'returns false', ->
          expect(@resource.errors().added('title', 'taken')).toBeFalsy()

    describe '#include()', ->
      describe 'when included', ->
        it 'returns true', ->
          expect(@resource.errors().include('title')).toBeTruthy()

      describe 'when not included', ->
        it 'returns false', ->
          expect(@resource.errors().include('price')).toBeFalsy()

    describe '#empty()', ->
      describe 'when empty', ->
        beforeEach ->
          @resource.errors().clear()

        it 'returns true', ->
          expect(@resource.errors().empty()).toBeTruthy()

      describe 'when not empty', ->
        it 'returns false', ->
          expect(@resource.errors().empty()).toBeFalsy()

    describe '#size()', ->
      it 'returns the total number of errors', ->
        expect(@resource.errors().size()).toEqual(1)

    describe '#delete()', ->
      it 'deletes the errors from the attribute', ->
        @resource.errors().delete('title')
        expect(@resource.errors().forAttribute('title')).toEqual({})

    describe '#each()', ->
      it 'iterates over each error', ->
        @resource.errors().each (attribute, error) ->
          expect(attribute).toEqual('title')
          expect(error.code).toEqual('blank')
          expect(error.message).toEqual('Title cannot be blank')

    describe '#forAttribute()', ->
      it 'returns an object mapped to error code and message pairs for the attribute', ->
        expect(@resource.errors().forAttribute('title')).toEqual({ blank: 'Title cannot be blank' })

    describe '#forBase()', ->
      beforeEach ->
        @resource.errors().add('base', 'invalid', 'Product is invalid')

      it 'returns an object mapped to error code and message pairs for the base', ->
        expect(@resource.errors().forBase()).toEqual({ invalid: 'Product is invalid' })

    describe '#toArray()', ->
      it 'returns an array of errors for the resource', ->
        expect(@resource.errors().toArray()).toEqual([{ attribute: 'title', code: 'blank', message: 'Title cannot be blank', detail: 'Title cannot be blank' }])

    describe '#toCollection()', ->
      it 'returns a collection', ->
        expect(@resource.errors().toCollection().klass()).toBe(ActiveResource::Collection)

      it 'returns a collection of errors for the resource', ->
        expect(@resource.errors().toCollection().toArray()).toEqual([{ attribute: 'title', code: 'blank', message: 'Title cannot be blank', detail: 'Title cannot be blank' }])
