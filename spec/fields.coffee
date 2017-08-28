describe 'ActiveResource', ->
  beforeEach ->
    moxios.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

    MyLibrary::Order.last()
    .then window.onSuccess

    @promise = moxios.wait =>
      moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.all.success)
      .then =>
        @resource = window.onSuccess.calls.mostRecent().args[0]

  afterEach ->
    moxios.uninstall()

  describe '::Fields', ->
    describe '.fields()', ->
      it 'returns fields', ->
        @promise.then =>
          expect(@resource.klass().fields().toArray().sort()).toEqual([
            'price', 'comments', 'giftCard', 'orderItems', 'product', 'transactions'
          ].sort())

    describe 'updating changed fields', ->
      describe 'changing attribute', ->
        beforeEach ->
          @promise2 = @promise.then =>
            @resource.price = 1000.0

        it 'adds attribute to resource document', ->
          @promise2.then =>
            @resource.save()

            resourceDocument =
              JSON.stringify({
                data: {
                  type: 'orders',
                  id: '2',
                  attributes: {
                    price: 1000.0
                  },
                  relationships: {}
                }
              })

            moxios.wait =>
              expect(moxios.requests.mostRecent().data).toEqual(resourceDocument)

      describe 'changing relationship', ->
        describe 'singular', ->
          beforeEach ->
            @promise2 = @promise.then =>
              @resource.assignProduct(MyLibrary::Product.build(id: '10'))

          it 'adds relationship to resource document', ->
            @promise2.then =>
              @resource.save()

              resourceDocument =
                JSON.stringify({
                  data: {
                    type: 'orders',
                    id: '2',
                    attributes: {},
                    relationships: {
                      product: {
                        data: {
                          type: 'products',
                          id: '10'
                        }
                      }
                    }
                  }
                })

              moxios.wait =>
                expect(moxios.requests.mostRecent().data).toEqual(resourceDocument)

        describe 'collection', ->
          beforeEach ->
            @promise2 = @promise.then =>
              @resource.orderItems().build(id: '5')
              @resource.orderItems().build(id: '10')

          it 'adds relationship to resource document', ->
            @promise2.then =>
              @resource.save()

              resourceDocument =
                JSON.stringify({
                  data: {
                    type: 'orders',
                    id: '2',
                    attributes: {},
                    relationships: {
                      order_items: {
                        data: [{
                          type: 'order_items',
                          id: '5'
                        },{
                          type: 'order_items',
                          id: '10'
                        }]
                      }
                    }
                  }
                })

              moxios.wait =>
                expect(moxios.requests.mostRecent().data).toEqual(resourceDocument)

        describe 'autosave', ->
          beforeEach ->
            @promise2 = @promise.then =>
              @resource.transactions().build(amount: 5.0)
              @resource.transactions().build(amount: 10.0)

          it 'adds relationship to resource document', ->
            @promise2.then =>
              @resource.save()

              resourceDocument =
                JSON.stringify({
                  data: {
                    type: 'orders',
                    id: '2',
                    attributes: {},
                    relationships: {
                      transactions: {
                        data: [{
                          type: 'transactions',
                          attributes: {
                            amount: 5.0
                          },
                          relationships: {}
                        },{
                          type: 'transactions',
                          attributes: {
                            amount: 10.0
                          },
                          relationships: {}
                        }]
                      }
                    }
                  }
                })

              moxios.wait =>
                expect(moxios.requests.mostRecent().data).toEqual(resourceDocument)