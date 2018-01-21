describe 'ActiveResource', ->
  beforeEach ->
    moxios.install()

    window.onSuccess = jasmine.createSpy('onSuccess')
    window.onFailure = jasmine.createSpy('onFailure')
    window.onCompletion = jasmine.createSpy('onCompletion')

  afterEach ->
    moxios.uninstall()

  describe '::Immutable', ->
    beforeAll ->
      window.ImmutableLibrary = ActiveResource.createResourceLibrary(
        'https://example.com/api/v1',
        immutable: true
      )

      class ImmutableLibrary::Comment extends ImmutableLibrary.Base
        this.className = 'Comment'
        this.queryName = 'comments'

        this.belongsTo 'resource', polymorphic: true, inverseOf: 'comments'

      class ImmutableLibrary::GiftCard extends ImmutableLibrary.Base
        this.className = 'GiftCard'
        this.queryName = 'gift_cards'

        this.hasOne 'order'

      class ImmutableLibrary::Order extends ImmutableLibrary.Base
        this.className = 'Order'
        this.queryName = 'orders'

        this.attributes('price', 'tax')

        this.belongsTo 'giftCard'

        this.hasMany 'comments', as: 'resource', autosave: true, inverseOf: 'resource'
        this.hasMany 'orderItems', autosave: true, inverseOf: 'order'

      class ImmutableLibrary::OrderItem extends ImmutableLibrary.Base
        this.className = 'OrderItem'
        this.queryName = 'order_items'

        this.attributes('amount')

        this.belongsTo 'order', inverseOf: 'orderItems'

    describe 'when resource unpersisted', ->
      beforeEach ->
        @resource = ImmutableLibrary::Order.includes('giftCard').build()

      describe 'assigning attributes', ->
        beforeEach ->
          @resource2 = @resource.assignAttributes({
            price: 3.0
          })

        it 'clones a new resource', ->
          expect(@resource).not.toBe(@resource2)

        it 'does not change the old resource', ->
          expect(@resource.price).toBeUndefined()

        it 'does not track the change on the old resource', ->
          expect(@resource.changedFields().include('price')).toBeFalsy()

        it 'creates a new resource with the changes', ->
          expect(@resource2.price).toEqual(3.0)

        it 'creates a new resource with the changed attribute tracked', ->
          expect(@resource2.changedFields().include('price')).toBeTruthy()

        describe 'saving the resource', ->
          beforeEach ->
            @resource2.save (resource3) =>
              @resource3 = resource3

            null

          describe 'on success', ->
            beforeEach ->
              @promise = moxios.wait =>
                moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.find.success)

            it 'clones a new resource', ->
              @promise.then =>
                expect(@resource2).not.toBe(@resource3)

            it 'does not persist the old resource', ->
              @promise.then =>
                expect(@resource2.persisted()).toBeFalsy()

            it 'does not persist new changes from the server to the old resource', ->
              @promise.then =>
                expect(@resource2.tax).toBeUndefined()

            it 'indicates the attribute was still changed on the old resource', ->
              @promise.then =>
                expect(@resource2.changedFields().include('price')).toBeTruthy()

            it 'persists a new resource', ->
              @promise.then =>
                expect(@resource3.persisted()).toBeTruthy()

            it 'persists new changes from the server', ->
              @promise.then =>
                expect(@resource3.tax).not.toBeUndefined()

            it 'does not indicate the attribute was changed', ->
              @promise.then =>
                expect(@resource3.changedFields().include('price')).toBeFalsy()

          describe 'on failure', ->
            beforeEach ->
              @promise = moxios.wait =>
                moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)

            it 'clones a new resource', ->
              @promise.catch =>
                expect(@resource2).not.toBe(@resource3)

            it 'does not persist the old resource', ->
              @promise.catch =>
                expect(@resource2.persisted()).toBeFalsy()

            it 'does not add errors from the server to the old resource', ->
              @promise.catch =>
                expect(@resource2.errors().empty()).toBeTruthy()

            it 'indicates the attribute was still changed on the old resource', ->
              @promise.catch =>
                expect(@resource2.changedFields().include('price')).toBeTruthy()

            it 'does not persist the new resource', ->
              @promise.catch =>
                expect(@resource3.persisted()).toBeFalsy()

            it 'maintains attribute on new resource', ->
              @promise.catch =>
                expect(@resource3.price).toEqual(3.0)

            it 'adds errors from the server to the new resource', ->
              @promise.catch =>
                expect(@resource3.errors().empty()).toBeFalsy()

            it 'indicates the attribute was changed on the new resource', ->
              @promise.catch =>
                expect(@resource3.changedFields().include('price')).toBeTruthy()

      describe 'updating attributes', ->
        beforeEach ->
          @resource.update({
            price: 3.0
          }, (resource2) =>
            @resource2 = resource2
          )

          null

        describe 'on success', ->
          beforeEach ->
            @promise = moxios.wait =>
              moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.success)

          it 'clones a new resource', ->
            @promise.then =>
              expect(@resource).not.toBe(@resource2)

          it 'does not persist the old resource', ->
            @promise.then =>
              expect(@resource.persisted()).toBeFalsy()

          it 'does not change the old resource', ->
            @promise.then =>
              expect(@resource.price).toBeUndefined()

          it 'does not persist new changes from the server to the old resource', ->
            @promise.then =>
              expect(@resource.tax).toBeUndefined()

          it 'does not track the change on the old resource', ->
            @promise.then =>
              expect(@resource.changedFields().include('price')).toBeFalsy()

          it 'persists a new resource', ->
            @promise.then =>
              expect(@resource2.persisted()).toBeTruthy()

          it 'persists a new resource with the changes', ->
            @promise.then =>
              expect(@resource2.price).toEqual(3.0)

          it 'persists new changes from the server', ->
            @promise.then =>
              expect(@resource2.tax).not.toBeUndefined()

          it 'does not indicate the attribute was changed', ->
            @promise.then =>
              expect(@resource2.changedFields().include('price')).toBeFalsy()

        describe 'on failure', ->
          beforeEach ->
            @promise = moxios.wait =>
              moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)

          it 'clones a new resource', ->
            @promise.catch =>
              expect(@resource).not.toBe(@resource2)

          it 'does not persist the old resource', ->
            @promise.catch =>
              expect(@resource.persisted()).toBeFalsy()

          it 'does not change the old resource', ->
            @promise.catch =>
              expect(@resource.price).toBeUndefined()

          it 'does not add errors from the server to the old resource', ->
            @promise.catch =>
              expect(@resource.errors().empty()).toBeTruthy()

          it 'does not indicate the attribute was changed on the old resource', ->
            @promise.catch =>
              expect(@resource.changedFields().include('price')).toBeFalsy()

          it 'does not persist the new resource', ->
            @promise.catch =>
              expect(@resource2.persisted()).toBeFalsy()

          it 'does not change attribute on new resource', ->
            @promise.catch =>
              expect(@resource2.price).toEqual(null)

          it 'adds errors from the server to the new resource', ->
            @promise.catch =>
              expect(@resource2.errors().empty()).toBeFalsy()

          it 'does not indicate the attribute was changed on the new resource', ->
            @promise.catch =>
              expect(@resource2.changedFields().include('price')).toBeFalsy()

      describe 'assigning relationships', ->
        describe 'singular relationship', ->
          beforeEach ->
            @singularResource = ImmutableLibrary::GiftCard.build(id: '1')
            @resource2 = @resource.assignAttributes({
              giftCard: @singularResource
            })

          it 'clones a new resource', ->
            expect(@resource).not.toBe(@resource2)

          it 'does not change the old resource', ->
            expect(@resource.giftCard()).toBeNull()

          it 'does not track the change on the old resource', ->
            expect(@resource.changedFields().include('giftCard')).toBeFalsy()

          it 'creates a new resource with the changes', ->
            expect(@resource2.giftCard()).toEqual(@singularResource)

          it 'creates a new resource with the changed relationship tracked', ->
            expect(@resource2.changedFields().include('giftCard')).toBeTruthy()

          describe 'saving the resource', ->
            beforeEach ->
              @resource2.save((resource3) =>
                @resource3 = resource3
              )

              null

            describe 'on success', ->
              beforeEach ->
                @promise = moxios.wait =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.includes)

              it 'clones a new resource', ->
                @promise.then =>
                  expect(@resource2).not.toBe(@resource3)

              it 'does not persist the old resource', ->
                @promise.then =>
                  expect(@resource2.persisted()).toBeFalsy()

              it 'does not change the inverse target of the old relationship resource', ->
                @promise.then =>
                  expect(@resource2.giftCard().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise.then =>
                  expect(@resource2.changedFields().include('giftCard')).toBeTruthy()

              it 'persists a new resource', ->
                @promise.then =>
                  expect(@resource3.persisted()).toBeTruthy()

              it 'clones a new relationship resource', ->
                @promise.then =>
                  expect(@resource2.giftCard()).not.toBe(@resource3.giftCard())

              it 'changes the inverse target of the new relationship resource', ->
                @promise.then =>
                  expect(@resource3.giftCard().order()).toBe(@resource3)

              it 'does not indicate the new relationship resource inverse target was changed', ->
                @promise.then =>
                  expect(@resource3.giftCard().changedFields().include('order')).toBeFalsy()

              it 'does not indicate the relationship was changed', ->
                @promise.then =>
                  expect(@resource3.changedFields().include('giftCard')).toBeFalsy()

            describe 'on failure', ->
              beforeEach ->
                @promise = moxios.wait =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)

              it 'clones a new resource', ->
                @promise.catch =>
                  expect(@resource2).not.toBe(@resource3)

              it 'does not persist the old resource', ->
                @promise.catch =>
                  expect(@resource2.persisted()).toBeFalsy()

              it 'does not add errors from the server to the old resource', ->
                @promise.catch =>
                  expect(@resource2.errors().empty()).toBeTruthy()

              it 'does not change the inverse target of the old relationship resource', ->
                @promise.catch =>
                  expect(@resource2.giftCard().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise.catch =>
                  expect(@resource2.changedFields().include('giftCard')).toBeTruthy()

              it 'does not persist the new resource', ->
                @promise.catch =>
                  expect(@resource3.persisted()).toBeFalsy()

              it 'adds errors from the server to the new resource', ->
                @promise.catch =>
                  expect(@resource3.errors().empty()).toBeFalsy()

              it 'clones a new relationship resource', ->
                @promise.catch =>
                  expect(@resource2.giftCard()).not.toBe(@resource3.giftCard())

              it 'changes the inverse target of the new relationship resource', ->
                @promise.catch =>
                  expect(@resource3.giftCard().order()).toBe(@resource3)

              it 'indicates the new relationship resource inverse target was still changed', ->
                @promise.catch =>
                  expect(@resource3.giftCard().changedFields().include('order')).toBeTruthy()

              it 'indicates the relationship was still changed', ->
                @promise.catch =>
                  expect(@resource3.changedFields().include('giftCard')).toBeTruthy()

        describe 'collection relationship', ->
          beforeEach ->
            @collection = ActiveResource::Collection.build([
              ImmutableLibrary::OrderItem.build(id: '5'),
              ImmutableLibrary::OrderItem.build(id: '10')
            ])

            @resource2 = @resource.assignAttributes({
              orderItems: @collection
            })

          it 'clones a new resource', ->
            expect(@resource).not.toBe(@resource2)

          it 'does not change the old resource', ->
            expect(@resource.orderItems().empty()).toBeTruthy()

          it 'does not track the change on the old resource', ->
            expect(@resource.changedFields().include('orderItems')).toBeFalsy()

          it 'creates a new resource with the changes', ->
            expect(@resource2.orderItems().size()).toEqual(2)

          it 'creates a new resource with the changed relationship tracked', ->
            expect(@resource2.changedFields().include('orderItems')).toBeTruthy()

          describe 'saving the resource', ->
            beforeEach ->
              @resource2.save((resource3) =>
                @resource3 = resource3
              )

              null

            describe 'on success', ->
              beforeEach ->
                @promise = moxios.wait =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.includes)

              it 'clones a new resource', ->
                @promise.then =>
                  expect(@resource2).not.toBe(@resource3)

              it 'does not persist the old resource', ->
                @promise.then =>
                  expect(@resource2.persisted()).toBeFalsy()

              it 'does not change the inverse target of the old relationship resources', ->
                @promise.then =>
                  expect(@resource2.orderItems().target().first().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise.then =>
                  expect(@resource2.changedFields().include('orderItems')).toBeTruthy()

              it 'persists a new resource', ->
                @promise.then =>
                  expect(@resource3.persisted()).toBeTruthy()

              it 'clones new relationship resources', ->
                @promise.then =>
                  @resource3.orderItems().target().each (orderItem) =>
                    expect(@resource2.orderItems().target().toArray()).not.toContain(orderItem)

              it 'changes the inverse target of the new relationship resources', ->
                @promise.then =>
                  expect(@resource3.orderItems().target().first().order()).toBe(@resource3)

              it 'does not indicate the new relationship resource inverse target was changed', ->
                @promise.then =>
                  expect(@resource3.orderItems().target().first().changedFields().include('order')).toBeFalsy()

              it 'does not indicate the relationship was changed', ->
                @promise.then =>
                  expect(@resource3.changedFields().include('orderItems')).toBeFalsy()

            describe 'on failure', ->
              beforeEach ->
                @promise = moxios.wait =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)

              it 'clones a new resource', ->
                @promise.catch =>
                  expect(@resource2).not.toBe(@resource3)

              it 'does not persist the old resource', ->
                @promise.catch =>
                  expect(@resource2.persisted()).toBeFalsy()

              it 'does not add errors from the server to the old resource', ->
                @promise.catch =>
                  expect(@resource2.errors().empty()).toBeTruthy()

              it 'does not change the inverse target of the old relationship resource', ->
                @promise.catch =>
                  expect(@resource2.orderItems().target().first().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise.catch =>
                  expect(@resource2.changedFields().include('orderItems')).toBeTruthy()

              it 'does not persist the new resource', ->
                @promise.catch =>
                  expect(@resource3.persisted()).toBeFalsy()

              it 'adds errors from the server to the new resource', ->
                @promise.catch =>
                  expect(@resource3.errors().empty()).toBeFalsy()

              it 'clones new relationship resources', ->
                @promise.catch =>
                  @resource3.orderItems().target().each (orderItem) =>
                    expect(@resource2.orderItems().target().toArray()).not.toContain(orderItem)

              it 'changes the inverse target of the new relationship resource', ->
                @promise.catch =>
                  expect(@resource3.orderItems().target().first().order()).toBe(@resource3)

              it 'indicates the new relationship resource inverse target was still changed', ->
                @promise.catch =>
                  expect(@resource3.orderItems().target().first().changedFields().include('order')).toBeTruthy()

              it 'indicates the relationship was still changed', ->
                @promise.catch =>
                  expect(@resource3.changedFields().include('orderItems')).toBeTruthy()

    describe 'when resource persisted', ->
      beforeEach ->
        ImmutableLibrary::Order.includes('giftCard','orderItems').find('1')
        .then window.onSuccess

        @promise = moxios.wait =>
          moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.find.includes)
          .then =>
            @resource = window.onSuccess.calls.mostRecent().args[0]

      describe 'assigning attributes', ->
        beforeEach ->
          @promise2 = @promise.then =>
            @resource2 = @resource.assignAttributes({
              tax: 15.0
            })

        it 'clones a new resource', ->
          @promise2.then =>
            expect(@resource).not.toBe(@resource2)

        it 'does not change the old resource', ->
          @promise2.then =>
            expect(@resource.tax).toEqual(5.0)

        it 'does not track the change on the old resource', ->
          @promise2.then =>
            expect(@resource.changedFields().include('tax')).toBeFalsy()

        it 'creates a new persisted resource', ->
          @promise2.then =>
            expect(@resource2.persisted()).toBeTruthy()

        it 'creates a new resource with the changes', ->
          @promise2.then =>
            expect(@resource2.tax).toEqual(15.0)

        it 'creates a new resource with the changed attribute tracked', ->
          @promise2.then =>
            expect(@resource2.changedFields().include('tax')).toBeTruthy()

        describe 'saving the changed persisted resource', ->
          beforeEach ->
            @promise3 = @promise2.then =>
              @resource2.save((resource3) =>
                @resource3 = resource3
              )

              null

          describe 'on success', ->
            beforeEach ->
              @promise4 = @promise3.then =>
                moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.includes)

            it 'clones a new resource', ->
              @promise4.then =>
                expect(@resource2).not.toBe(@resource3)

            it 'does not persist new changes from the server to the old resource', ->
              @promise4.then =>
                expect(@resource2.balance).toBeUndefined()

            it 'indicates the attribute was still changed on the old resource', ->
              @promise4.then =>
                expect(@resource2.changedFields().include('tax')).toBeTruthy()

            it 'persists a new resource', ->
              @promise4.then =>
                expect(@resource3.persisted()).toBeTruthy()

            it 'persists new changes from the server', ->
              @promise4.then =>
                expect(@resource3.balance).not.toBeUndefined()

            it 'does not indicate the attribute was changed', ->
              @promise4.then =>
                expect(@resource3.changedFields().include('tax')).toBeFalsy()

          describe 'on failure', ->
            beforeEach ->
              @promise4 = @promise3.then =>
                moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)

            it 'clones a new resource', ->
              @promise4.catch =>
                expect(@resource2).not.toBe(@resource3)

            it 'persists the old resource', ->
              @promise4.catch =>
                expect(@resource2.persisted()).toBeTruthy()

            it 'does not add errors from the server to the old resource', ->
              @promise4.catch =>
                expect(@resource2.errors().empty()).toBeTruthy()

            it 'indicates the attribute was still changed on the old resource', ->
              @promise4.catch =>
                expect(@resource2.changedFields().include('tax')).toBeTruthy()

            it 'persists the new resource', ->
              @promise4.catch =>
                expect(@resource3.persisted()).toBeTruthy()

            it 'maintains attribute on new resource', ->
              @promise4.catch =>
                expect(@resource3.tax).toEqual(15.0)

            it 'adds errors from the server to the new resource', ->
              @promise4.catch =>
                expect(@resource3.errors().empty()).toBeFalsy()

            it 'indicates the attribute was changed on the new resource', ->
              @promise4.catch =>
                expect(@resource3.changedFields().include('tax')).toBeTruthy()

      describe 'assigning relationships', ->
        describe 'singular relationship', ->
          beforeEach ->
            @promise2 = @promise.then =>
              @singularResource = ImmutableLibrary::GiftCard.build(id: '1')
              @resource2 = @resource.assignAttributes({
                giftCard: @singularResource
              })

          it 'clones a new resource', ->
            @promise2.then =>
              expect(@resource).not.toBe(@resource2)

          it 'does not change the old resource', ->
            @promise2.then =>
              expect(@resource.giftCard()).not.toBe(@singularResource)

          it 'does not track the change on the old resource', ->
            @promise2.then =>
              expect(@resource.changedFields().include('giftCard')).toBeFalsy()

          it 'creates a new persisted resource', ->
            @promise2.then =>
              expect(@resource2.persisted()).toBeTruthy()

          it 'creates a new resource with the changes', ->
            @promise2.then =>
              expect(@resource2.giftCard()).toBe(@singularResource)

          it 'creates a new resource with the changed attribute tracked', ->
            @promise2.then =>
              expect(@resource2.changedFields().include('giftCard')).toBeTruthy()

          describe 'saving the changed persisted resource', ->
            beforeEach ->
              @promise3 = @promise2.then =>
                @resource2.save((resource3) =>
                  @resource3 = resource3
                )

                null

            describe 'on success', ->
              beforeEach ->
                @promise4 = @promise3.then =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.includes)

              it 'clones a new resource', ->
                @promise4.then =>
                  expect(@resource2).not.toBe(@resource3)

              it 'does not change the inverse target of the old relationship resource', ->
                @promise4.then =>
                  expect(@resource2.giftCard().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise4.then =>
                  expect(@resource2.changedFields().include('giftCard')).toBeTruthy()

              it 'persists a new resource', ->
                @promise4.then =>
                  expect(@resource3.persisted()).toBeTruthy()

              it 'clones a new relationship resource', ->
                @promise4.then =>
                  expect(@resource2.giftCard()).not.toBe(@resource3.giftCard())
                  expect(@resource2.giftCard().id).toEqual(@resource3.giftCard().id)

              it 'changes the inverse target of the new relationship resource', ->
                @promise4.then =>
                  expect(@resource3.giftCard().order()).toBe(@resource3)

              it 'does not indicate the new relationship resource inverse target was changed', ->
                @promise4.then =>
                  expect(@resource3.giftCard().changedFields().include('order')).toBeFalsy()

              it 'does not indicate the relationship was changed', ->
                @promise4.then =>
                  expect(@resource3.changedFields().include('giftCard')).toBeFalsy()

            describe 'on failure', ->
              beforeEach ->
                @promise4 = @promise3.then =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)

              it 'clones a new resource', ->
                @promise4.catch =>
                  expect(@resource2).not.toBe(@resource3)

              it 'persists the old resource', ->
                @promise4.catch =>
                  expect(@resource2.persisted()).toBeTruthy()

              it 'does not add errors from the server to the old resource', ->
                @promise4.catch =>
                  expect(@resource2.errors().empty()).toBeTruthy()

              it 'does not change the inverse target of the old relationship resource', ->
                @promise4.catch =>
                  expect(@resource2.giftCard().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise4.catch =>
                  expect(@resource2.changedFields().include('giftCard')).toBeTruthy()

              it 'persists the new resource', ->
                @promise4.catch =>
                  expect(@resource3.persisted()).toBeTruthy()

              it 'adds errors from the server to the new resource', ->
                @promise4.catch =>
                  expect(@resource3.errors().empty()).toBeFalsy()

              it 'clones a new relationship resource', ->
                @promise4.catch =>
                  expect(@resource2.giftCard()).not.toBe(@resource3.giftCard())
                  expect(@resource2.giftCard().id).toEqual(@resource3.giftCard().id)

              it 'changes the inverse target of the new relationship resource', ->
                @promise4.catch =>
                  expect(@resource3.giftCard().order()).toBe(@resource3)

              it 'indicates the new relationship resource inverse target was still changed', ->
                @promise4.catch =>
                  expect(@resource3.giftCard().changedFields().include('order')).toBeTruthy()

              it 'indicates the relationship was still changed', ->
                @promise4.catch =>
                  expect(@resource3.changedFields().include('giftCard')).toBeTruthy()

        describe 'collection relationship', ->
          beforeEach ->
            @collection = ActiveResource::Collection.build([
              ImmutableLibrary::OrderItem.build(id: '5'),
              ImmutableLibrary::OrderItem.build(id: '10')
            ])

            @resource2 = @resource.assignAttributes({
              orderItems: @collection
            })

          it 'clones a new resource', ->
            expect(@resource).not.toBe(@resource2)

          it 'does not change the old resource', ->
            expect(@resource.orderItems().target().map((o) => o.id).toArray()).toEqual(['1', '2'])

          it 'does not track the change on the old resource', ->
            expect(@resource.changedFields().include('orderItems')).toBeFalsy()

          it 'creates a new resource with the changes', ->
            expect(@resource2.orderItems().size()).toEqual(2)

          it 'creates a new resource with the changed relationship tracked', ->
            expect(@resource2.changedFields().include('orderItems')).toBeTruthy()

          describe 'saving the resource', ->
            beforeEach ->
              @resource2.save((resource3) =>
                @resource3 = resource3
              )

              null

            describe 'on success', ->
              beforeEach ->
                @promise = moxios.wait =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.includes)

              it 'clones a new resource', ->
                @promise.then =>
                  expect(@resource2).not.toBe(@resource3)

              it 'persists the old resource', ->
                @promise.then =>
                  expect(@resource2.persisted()).toBeTruthy()

              it 'does not change the inverse target of the old relationship resources', ->
                @promise.then =>
                  expect(@resource2.orderItems().target().first().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise.then =>
                  expect(@resource2.changedFields().include('orderItems')).toBeTruthy()

              it 'persists a new resource', ->
                @promise.then =>
                  expect(@resource3.persisted()).toBeTruthy()

              it 'clones new relationship resources', ->
                @promise.then =>
                  @resource3.orderItems().target().each (orderItem) =>
                    expect(@resource2.orderItems().target().toArray()).not.toContain(orderItem)

                  expect(@resource2.orderItems().target().map((o) => o.id).toArray()).toEqual(
                    @resource2.orderItems().target().map((o) => o.id).toArray()
                  )

              it 'changes the inverse target of the new relationship resources', ->
                @promise.then =>
                  expect(@resource3.orderItems().target().first().order()).toBe(@resource3)

              it 'does not indicate the new relationship resource inverse target was changed', ->
                @promise.then =>
                  expect(@resource3.orderItems().target().first().changedFields().include('order')).toBeFalsy()

              it 'does not indicate the relationship was changed', ->
                @promise.then =>
                  expect(@resource3.changedFields().include('orderItems')).toBeFalsy()

            describe 'on failure', ->
              beforeEach ->
                @promise = moxios.wait =>
                  moxios.requests.mostRecent().respondWith(JsonApiResponses.Order.save.failure)

              it 'clones a new resource', ->
                @promise.catch =>
                  expect(@resource2).not.toBe(@resource3)

              it 'persists the old resource', ->
                @promise.catch =>
                  expect(@resource2.persisted()).toBeTruthy()

              it 'does not add errors from the server to the old resource', ->
                @promise.catch =>
                  expect(@resource2.errors().empty()).toBeTruthy()

              it 'does not change the inverse target of the old relationship resource', ->
                @promise.catch =>
                  expect(@resource2.orderItems().target().first().order()).toBe(@resource2)

              it 'indicates the relationship was still changed on the old resource', ->
                @promise.catch =>
                  expect(@resource2.changedFields().include('orderItems')).toBeTruthy()

              it 'persists the new resource', ->
                @promise.catch =>
                  expect(@resource3.persisted()).toBeTruthy()

              it 'adds errors from the server to the new resource', ->
                @promise.catch =>
                  expect(@resource3.errors().empty()).toBeFalsy()

              it 'clones new relationship resources', ->
                @promise.catch =>
                  @resource3.orderItems().target().each (orderItem) =>
                    expect(@resource2.orderItems().target().toArray()).not.toContain(orderItem)

                  expect(@resource2.orderItems().target().map((o) => o.id).toArray()).toEqual(
                    @resource2.orderItems().target().map((o) => o.id).toArray()
                  )

              it 'changes the inverse target of the new relationship resource', ->
                @promise.catch =>
                  expect(@resource3.orderItems().target().first().order()).toBe(@resource3)

              it 'indicates the new relationship resource inverse target was still changed', ->
                @promise.catch =>
                  expect(@resource3.orderItems().target().first().changedFields().include('order')).toBeTruthy()

              it 'indicates the relationship was still changed', ->
                @promise.catch =>
                  expect(@resource3.changedFields().include('orderItems')).toBeTruthy()