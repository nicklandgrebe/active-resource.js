import axios from 'axios'
import es6Promise from 'es6-promise'
import Qs from 'qs'
import _ from 'underscore'
import s from 'underscore.string'
import 'underscore.inflection'

window.Promise = es6Promise.Promise if typeof window != "undefined"

export default class ActiveResource
