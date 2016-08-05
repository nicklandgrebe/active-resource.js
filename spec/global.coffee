describe 'ActiveResource', ->
  describe '.extend()', ->
    it 'extends the class correctly', ->
      class MyModule
        @myMethod: ->

      class MyClass
        ActiveResource.extend(@, MyModule)

      expect(MyClass.myMethod).toBeDefined()

  describe '.include()', ->
    beforeEach ->
      class MyModule
        myMethod: ->

        class @::myOtherClass
          @__excludeFromExtend = true

      class MyClass
        ActiveResource.include(@, MyModule.prototype)

      @instance = new MyClass()

    it 'includes the class correctly', ->
      expect(@instance.myMethod).toBeDefined()

    it 'does not include methods flagged for exclusion', ->
      expect(@instance.myOtherClass).not.toBeDefined()

  describe '.constantize()', ->
    beforeEach ->
      class MyLibrary::MyClass extends ActiveResource::Base
      @className = 'MyClass'

    it 'returns the correct class', ->
      expect(ActiveResource.constantize('MyClass')).toEqual(window.MyLibrary::MyClass)

    describe 'when class does not exist', ->
      beforeEach -> @className = 'ClassThatDoesNotExist'

      it 'throws an error', ->
        expect(-> ActiveResource.constantize(@className)).toThrow()

    describe 'when constantize scope is set', ->
      beforeEach ->
        class window.MyScope
          class @::MyClass extends ActiveResource::Base

        ActiveResource.constantizeScope = window.MyScope::

      it 'scopes correctly', ->
        expect(ActiveResource.constantize(@className)).toEqual(window.MyScope::MyClass)

      afterEach ->
        ActiveResource.constantizeScope = window.MyLibrary::
