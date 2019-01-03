describe 'ActiveResource', ->
  beforeEach ->
    moxios.install(MyLibrary.interface.axios)

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
            'price', 'customer', 'comments', 'giftCard', 'orderItems', 'product', 'transactions'
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

        describe 'polymorphic', ->
          beforeEach ->
            @promise2 = @promise.then =>
              @resource.comments().build()

          it 'does not add relationship to resource document', ->
            @promise2.then =>
              @resource.save()

              resourceDocument =
                JSON.stringify({
                  data: {
                    type: 'orders',
                    id: '2',
                    attributes: {},
                    relationships: {
                      comments: {
                        data: [{
                          type: 'comments',
                          attributes: {},
                          relationships: {}
                        }]
                      }
                    }
                  }
                })

              moxios.wait =>
                expect(moxios.requests.mostRecent().data).toEqual(resourceDocument)

          describe 'when includePolymorphicRepeats true', ->
            beforeEach ->
              @promise3 = @promise2.then =>
                @resource.klass().resourceLibrary.includePolymorphicRepeats = true

            afterEach ->
              @resource.klass().resourceLibrary.includePolymorphicRepeats = false

            it 'adds relationship to resource document', ->
              @promise3.then =>
                @resource.save()

                resourceDocument =
                  JSON.stringify({
                    data: {
                      type: 'orders',
                      id: '2',
                      attributes: {},
                      relationships: {
                        comments: {
                          data: [{
                            type: 'comments',
                            attributes: {},
                            relationships: {
                              resource: {
                                data: {
                                  type: 'orders',
                                  id: '2'
                                }
                              }
                            }
                          }]
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
              @resource.save()

              moxios.wait =>
                moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.includes)

          it 'adds relationship to resource document', ->
            @promise2.then =>
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

              expect(moxios.requests.mostRecent().data).toEqual(resourceDocument)

          it 'assigns inverseOf field on related resources (removing it from changedFields)', ->
            @promise2.then =>
              expect(@resource.orderItems().target().first().changedFields().empty()).toBeTruthy()

          describe 'when replacing an item (same length)', ->
            beforeEach ->
              @promise2.then =>
                @resource.orderItems().target().delete(@resource.orderItems().target().last())
                @resource.orderItems().build(id: '6')

            it 'replaces relationship to resource document', ->
              @resource.save()

              resourceDocument =
                JSON.stringify({
                  data: {
                    type: 'orders',
                    id: '1',
                    attributes: {},
                    relationships: {
                      order_items: {
                        data: [{
                          type: 'order_items',
                          id: '5'
                        },{
                          type: 'order_items',
                          id: '6'
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
