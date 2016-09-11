describe 'ActiveResource', ->
  beforeEach ->
    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  describe '::Relation', ->
    describe 'when calling Relation extension methods on Base', ->
      it 'creates a new Relation', ->
        expect(MyLibrary::Product.where(token: 'jshf8e').klass()).toEqual(ActiveResource::Relation)

    describe '#links()', ->
      it 'returns the correct links', ->
        expect(MyLibrary::Product.where(token: 'jshf8e').links()).toEqual({ related: 'https://example.com/api/v1/products/' })

    describe '#all()', ->
      beforeEach ->
        MyLibrary::Product.all()
        .done window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
        expect(window.onSuccess).toHaveBeenCalled()
        @result = window.onSuccess.calls.mostRecent().args[0]

      it 'makes a call to retrieve all resources', ->
        expect(jasmine.Ajax.requests.mostRecent().url).toEqual(MyLibrary::Product.links()['related'])

      it 'returns a collection of the type requested', ->
        expect(@result.isA?(ActiveResource::Collection)).toBeTruthy()

    describe '#each()', ->
      beforeEach ->
        @i = 0
        MyLibrary::Product.each =>
          @i += 1

        @response = JsonApiResponses.Product.all.success
        jasmine.Ajax.requests.mostRecent().respondWith(@response)

      it 'makes a call to retrieve all resources', ->
        expect(jasmine.Ajax.requests.mostRecent().url).toEqual(MyLibrary::Product.links()['related'])

      it 'iterates over each resource returned', ->
        expect(@i).toEqual(JSON.parse(@response.responseText).data.length)

    describe '#find()', ->
      beforeEach ->
        MyLibrary::Product.find(1)
        .done window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.find.success)
        expect(window.onSuccess).toHaveBeenCalled()
        @result = window.onSuccess.calls.mostRecent().args[0]

      it 'makes a call to retrieve a resource', ->
        expect(jasmine.Ajax.requests.mostRecent().url).toEqual(MyLibrary::Product.links()['related'] + '1')

      it 'returns a resource of the type requested', ->
        expect(@result.isA?(MyLibrary::Product)).toBeTruthy()

    describe '#findBy()', ->
      beforeEach ->
        MyLibrary::Product.findBy(token: 'jshf8e')
        .done window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
        expect(window.onSuccess).toHaveBeenCalled()
        @result = window.onSuccess.calls.mostRecent().args[0]

      it 'makes a call to retrieve filtered resources', ->
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('filter[token]=jshf8e')

      it 'returns a resource of the type requested', ->
        expect(@result.isA?(MyLibrary::Product)).toBeTruthy()

    describe '#first()', ->
      beforeEach ->
        MyLibrary::Product.first()
        .done window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
        expect(window.onSuccess).toHaveBeenCalled()
        @result = window.onSuccess.calls.mostRecent().args[0]

      it 'makes a call to retrieve a single resource via index', ->
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('page[size]=1')

      it 'returns a resource of the type requested', ->
        expect(@result.isA?(MyLibrary::Product)).toBeTruthy()

    describe '#last()', ->
      beforeEach ->
        MyLibrary::Product.last()
        .done window.onSuccess

        jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.all.success)
        expect(window.onSuccess).toHaveBeenCalled()
        @result = window.onSuccess.calls.mostRecent().args[0]

      it 'makes a call to retrieve a single resource starting from the back, via index', ->
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('page[number]=-1&page[size]=1')

      it 'returns a resource of the type requested', ->
        expect(@result.isA?(MyLibrary::Product)).toBeTruthy()

    describe '#where()', ->
      it 'adds filters to a query', ->
        MyLibrary::Product.where(token: 'jshf8e').all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('filter[token]=jshf8e')

      it 'merges filters', ->
        MyLibrary::Product.where(token: 'jshf8e').where(another: 'param').all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('filter[token]=jshf8e&filter[another]=param')

    describe '#order()', ->
      it 'adds sort params to a query', ->
        MyLibrary::Product.order(createdAt: 'asc').all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('sort=created_at')

      it 'merges sorts', ->
        MyLibrary::Product.order(createdAt: 'asc').order(updatedAt: 'desc').all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('sort=created_at,-updated_at')

    describe '#select()', ->
      it 'determines the root model to apply fields to', ->
        MyLibrary::Product.select('id', 'createdAt').all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('fields[products]=id,created_at')

      it 'determines the model to apply nested fields to', ->
        MyLibrary::Product.select('id', { orders: 'price' }).all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('fields[products]=id&fields[orders]=price')

      it 'merges fields', ->
        MyLibrary::Product.select('id', 'createdAt').select(orders: 'price').all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('fields[products]=id,created_at&fields[orders]=price')

    describe '#includes()', ->
      it 'adds root level includes', ->
        MyLibrary::Product.includes('merchant', 'attributeValues').all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('include=merchant,attribute_values')

      it 'adds nested includes', ->
        MyLibrary::Product.includes('merchant', { orders: ['attributeValues','giftCards'] }).all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('include=merchant,orders.attribute_values,orders.gift_cards')

    describe '#page()', ->
      it 'adds a page number to the query', ->
        MyLibrary::Product.page(2).all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('page[number]=2')

    describe '#per()', ->
      it 'adds a page size to the query', ->
        MyLibrary::Product.per(2).all()
        @paramStr = requestParams(jasmine.Ajax.requests.mostRecent())
        expect(@paramStr).toContain('page[size]=2')

    describe '#build()', ->
      beforeEach ->
        @product = MyLibrary::Product.build(title: 'A product title')

      it 'assigns attributes to the built resource', ->
        expect(@product.title).toEqual('A product title')

      it 'builds a resource of Base\'s type', ->
        expect(@product.isA?(MyLibrary::Product)).toBeTruthy()

      describe 'when called from Relation', ->
        beforeEach ->
          @product = MyLibrary::Product.where(title: 'My title').build()

        it 'builds a resource of Relation\'s base type', ->
          expect(@product.isA?(MyLibrary::Product)).toBeTruthy()

        it 'adds filters to the attributes assigned', ->
          expect(@product.title).toEqual('My title')

    describe '#create()', ->
      describe 'in general', ->
        beforeEach ->
          MyLibrary::Product.create(title: 'Another title', description: 'Another description', window.onCompletion)

          console.log(window.onCompletion.calls.count())
          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
          @result = window.onCompletion.calls.mostRecent().args[0]

        it 'executes the completion callback', ->
          expect(window.onCompletion).toHaveBeenCalled()

        it 'builds a resource of class\'s type', ->
          expect(@result.isA?(MyLibrary::Product)).toBeTruthy()

        it 'assigns attributes to the created resource', ->
          expect(@result.title).toEqual('Another title')

      describe 'on success', ->
        beforeEach ->
          MyLibrary::Product.create(title: 'Another title', description: 'Another description', window.onCompletion)

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.success)
          expect(window.onCompletion).toHaveBeenCalled()
          @result = window.onCompletion.calls.mostRecent().args[0]

        it 'creates a persisted resource', ->
          expect(@result.persisted( )).toBeTruthy()

      describe 'on failure', ->
        beforeEach ->
          MyLibrary::Product.create(title: '', description: '', window.onCompletion)

          jasmine.Ajax.requests.mostRecent().respondWith(JsonApiResponses.Product.save.failure)
          expect(window.onCompletion).toHaveBeenCalled()
          @result = window.onCompletion.calls.mostRecent().args[0]

        it 'does not create a persisted resource', ->
          expect(@result.persisted?()).toBeFalsy()

        it 'adds errors', ->
          expect(@result.errors().empty?()).toBeFalsy()
