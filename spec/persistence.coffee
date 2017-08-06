describe 'ActiveResource', ->
  beforeEach ->
    jasmine.Ajax.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    jasmine.Ajax.uninstall()

  describe '::Persistence', ->
    describe '#persisted()', ->
      describe 'when the resource is not persisted', ->
        beforeEach ->
          @resource = MyLibrary::Product.build()

        it 'returns false', ->
          expect(@resource.persisted?()).toBeFalsy()

      describe 'when the resource is persisted', ->
        beforeEach ->
          MyLibrary::Product.create(title: 'A product title', description: 'A product description', window.onCompletion)

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
          expect(window.onCompletion).toHaveBeenCalled()
          @resource = window.onCompletion.calls.mostRecent().args[0]

        it 'returns true', ->
          expect(@resource.persisted?()).toBeTruthy()

    describe '#newResource()', ->
      describe 'when the resource is not persisted', ->
        beforeEach ->
          @resource = MyLibrary::Product.build()

        it 'returns true', ->
          expect(@resource.newResource?()).toBeTruthy()

      describe 'when the resource is persisted', ->
        beforeEach ->
          MyLibrary::Product.create(title: 'A product title', description: 'A product description', window.onCompletion)

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
          expect(window.onCompletion).toHaveBeenCalled()
          @resource = window.onCompletion.calls.mostRecent().args[0]

        it 'returns false', ->
          expect(@resource.newResource?()).toBeFalsy()

    describe '#save', ->
      describe 'in general', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        it 'executes the completion callback', ->
          @resource.save(window.onCompletion)
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
          expect(window.onCompletion).toHaveBeenCalled()

      describe 'when resource is persisted', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        it 'makes a PATCH request', ->
          @resource.save()
          expect(jasmine.Ajax.requests.mostRecent().method).toEqual('PATCH')

      describe 'when resource is not persisted', ->
        beforeEach ->
          @resource = MyLibrary::Product.build()

        it 'makes a POST request', ->
          @resource.save()
          expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST')

      describe 'when resource is valid', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @resource.title = 'Another title'
          @resource.save()
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)

        it 'returns the resource with saved attributes', ->
          expect(@resource.title).toEqual('Another title')

        it 'returns true for valid?()', ->
          expect(@resource.valid?()).toBeTruthy()

      describe 'when resource is invalid', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @resource.title = ''
          @resource.save()
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.failure)

        it 'returns a resource with errors', ->
          expect(@resource.errors().empty?()).toBeFalsy()

        it 'returns false for valid?()', ->
          expect(@resource.valid?()).toBeFalsy()

    describe '#update', ->
      describe 'in general', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        it 'executes the completion callback', ->
          @resource.update(title: 'Another title', window.onCompletion)
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
          expect(window.onCompletion).toHaveBeenCalled()

      describe 'when resource is persisted', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

        it 'makes a PATCH request', ->
          @resource.update(title: 'Another title')
          expect(jasmine.Ajax.requests.mostRecent().method).toEqual('PATCH')

      describe 'when resource is not persisted', ->
        beforeEach ->
          @resource = MyLibrary::Product.build(title: 'A product title', description: 'A product description')

        it 'makes a POST request', ->
          @resource.update(title: 'Another title')
          expect(jasmine.Ajax.requests.mostRecent().method).toEqual('POST')

      describe 'when resource is valid', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @resource.update(title: 'Another title', window.onCompletion)
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)

        it 'updates the resource\'s attributes', ->
          expect(@resource.title).toEqual('Another title')

      describe 'when resource is invalid', ->
        beforeEach ->
          MyLibrary::Product.last().then window.onSuccess

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
          @resource = window.onSuccess.calls.mostRecent().args[0]

          @resource.update(title: '', description: '', window.onCompletion)
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.failure)

        it 'does not update the attributes', ->
          expect(@resource.title).not.toEqual('')

        it 'returns a resource with errors', ->
          expect(@resource.errors().empty?()).toBeFalsy()

    describe '#destroy', ->
      beforeEach ->
        MyLibrary::Product.last().then window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
        @resource = window.onSuccess.calls.mostRecent().args[0]
        @resource.destroy()
        .done(window.onSuccess)
        .fail(window.onFailure)

      describe 'in general', ->
        it 'makes a DELETE request', ->
          expect(jasmine.Ajax.requests.mostRecent().method).toEqual('DELETE')

      describe 'on success', ->
        beforeEach ->
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.destroy.success)

        it 'unpersists the resource', ->
          expect(@resource.persisted?()).toBeFalsy()

        it 'executes the success callback', ->
          expect(window.onSuccess).toHaveBeenCalled()

        it 'returns the destroyed resource to the callback', ->
          expect(window.onSuccess.calls.mostRecent().args[0]).toEqual(@resource)

      describe 'on failure', ->
        beforeEach ->
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.destroy.failure)

        it 'does not unpersisted the resource', ->
          expect(@resource.persisted?()).toBeTruthy()

        it 'executes the failure callback', ->
          expect(window.onFailure).toHaveBeenCalled()

        it 'returns an error to the callback', ->
          errors = window.onFailure.calls.mostRecent().args[0]
          expect(errors.first().code).toEqual('forbidden')
