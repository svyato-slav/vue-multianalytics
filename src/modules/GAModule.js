import { MODULE_GA } from '../analyticsTypes'
import BasicModule from './BasicModule'
import { logDebug } from '../utils'

export default class GAModule extends BasicModule {

  constructor () {
    super(MODULE_GA)
    this.settings = {
      additionalAccountNames: [],  // array of additional account names (only works for analyticsjs)
      userId: null
    }
  }

  init (initConf = {}) {

      // Load the analytics snippet
      (function (i, s, o, g, r, a, m) {
        i[ 'GoogleAnalyticsObject' ] = r;
        i[ r ] = i[ r ] || function () {
            (i[ r ].q = i[ r ].q || []).push(arguments)
          }, i[ r ].l = 1 * new Date();
        a = s.createElement(o),
          m = s.getElementsByTagName(o)[ 0 ];
        // a.async = 1;
        a.setAttribute('defer','');
        a.src = g;
        m.parentNode.insertBefore(a, m)
      })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');


      // Apply default configuration
      // initConf = { ...pluginConfig, ...initConf }
      const mandatoryParams = [ 'trackingIds', 'appName', 'appVersion' ];
      mandatoryParams.forEach(el => {
        if (!initConf[ el ]) throw new Error(`VueAnalytics : Please provide a "${el}" from the config.`)
      })

      this.config.debug = initConf.debug
      this.config.trackingIds = initConf.trackingIds

      let trackingId = initConf.trackingIds[0]
      // register tracker
      ga('create', trackingId, 'auto')
      ga('set', "transport", "beacon")

      // set app name and version
      ga('set', 'appName', initConf.appName)
      ga('set', 'appVersion', initConf.appVersion)

      // ecommerce
      if (initConf['ecommerce']) {
        ga(`require`, 'ecommerce')
      }

      for (let i=1; i<initConf.trackingIds.length; i++) {
        let trackingId = initConf.trackingIds[i]
        // register tracker
        ga('create', trackingId, 'auto', `tracker${i}`)
        ga(`tracker${i}.set`, "transport", "beacon")

        // set app name and version
        ga(`tracker${i}.set`, 'appName', initConf.appName)
        ga(`tracker${i}.set`, 'appVersion', initConf.appVersion)

        // ecommerce
        if (initConf['ecommerce']) {
          ga(`tracker${i}.require`, 'ecommerce')
        }
      }
  }


  // Methods

  /**
   * Dispatch a view analytics event
   * https://developers.google.com/analytics/devguides/collection/analyticsjs/pages
   *
   * params object should contain
   * @param {string} viewName - The name of the view
   */
  trackView ({viewName}) {
    if (this.config.debug) {
      logDebug(viewName)
    }

    let fieldsObject = {
      hitType: 'pageview',
      page: viewName
    }

    if (this.settings.userId) {
      ga(`set`, '&uid', this.settings.userId)
    }

    // ga('set', 'screenName', params.viewName)
    ga('send', fieldsObject)

    for (let i=1; i<this.config.trackingIds.length; i++) {

      if (this.settings.userId) {
        ga(`tracker${i}.set`, '&uid', this.settings.userId)
      }

      // ga('set', 'screenName', params.viewName)
      ga(`tracker${i}.send`, fieldsObject)
    }
  }

  /**
   * Dispatch a tracking analytics event
   * https://developers.google.com/analytics/devguides/collection/analyticsjs/events
   *
   * params object should contain
   * @param {string} category - Typically the object that was interacted with (e.g. 'Video')
   * @param {string} action - The type of interaction (e.g. 'play')
   * @param {string} label - Useful for categorizing events (e.g. 'Fall Campaign')
   * @param {integer} value - A numeric value associated with the event (e.g. 42)
   */
  trackEvent ({category = "Event", action, label = null, value = null, callback = null }) {
    if (this.config.debug) {
      logDebug(...arguments)
    }

    // GA requires that eventValue be an integer, see:
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#eventValue
    // https://github.com/luisfarzati/angulartics/issues/81
    if (value) {
      var parsed = parseInt(value, 10);
      value = isNaN(parsed) ? 0 : parsed;
    }

    let fieldsObject = {
      hitType: 'event',
      eventCategory: category,
      eventAction: action,
      eventLabel: label,
      eventValue: value,
      hitCallback: callback,
      userId: this.settings.userId
    }

    ga('send', fieldsObject)

    for (let i=1; i<this.config.trackingIds.length; i++) {
      ga(`tracker${i}.send`, fieldsObject)
    }

  }

  /**
   * Track an exception that occurred in the application.
   * https://developers.google.com/analytics/devguides/collection/analyticsjs/exceptions
   *
   * @param {string} description - Something describing the error (max. 150 Bytes)
   * @param {boolean} isFatal - Specifies whether the exception was fatal
   */
  trackException ({description = "", isFatal = false}) {
    if (this.config.debug) {
      logDebug({description, isFatal})
    }
    ga('send', 'exception', { 'exDescription': description, 'exFatal': isFatal })
    for (let i=1; i<this.config.trackingIds.length; i++) {
      ga(`tracker${i}.send`, 'exception', { 'exDescription': description, 'exFatal': isFatal })
    }
  }

  /**
   * Track an user timing to measure periods of time.
   * https://developers.google.com/analytics/devguides/collection/analyticsjs/user-timings
   *
   * @param {string} timingCategory - A string for categorizing all user timing variables into logical groups (e.g. 'JS Dependencies').
   * @param {string} timingVar -  A string to identify the variable being recorded (e.g. 'load').
   * @param {number} timingValue - The number of milliseconds in elapsed time to report to Google Analytics (e.g. 20).
   * @param {string|null} timingLabel -  A string that can be used to add flexibility in visualizing user timings in the reports (e.g. 'Google CDN').
   */
  trackTiming (timingCategory, timingVar, timingValue, timingLabel = null) {
    if (this.config.debug) {
      logDebug({timingCategory, timingVar, timingValue, timingLabel})
    }
    let conf = {
      hitType: 'timing',
      timingCategory,
      timingVar,
      timingValue
    }
    if (timingLabel) {
      conf.timingLabel = timingLabel;
    }
    ga('send', conf)
    for (let i=1; i<this.config.trackingIds.length; i++) {
      ga(`tracker${i}.send`, conf)
    }
  }


  setUsername (userId) {
    this.settings.userId = userId
  }

  // Same as setUsername
  identify ({userId}) {
    this.setUsername(userId)
  }

  setUserProperties({properties}) {
    // this.setDimensionsAndMetrics(properties)
  }

  /**
  * Ecommerce transactions.
  * ecommerce needs to be enabled in the module options (ecommerce = true)
  * More info at https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce
  * @param {long} id - Transaction ID. Required
  * @param {string} affiliation -  Affiliation or store name
  * @param {float} revenue - Grand Total
  * @param {flat} shipping -  Shipping
  * @param {float} tax - Tax
  * @param {string} currency - Currency - https://developers.google.com/analytics/devguides/platform/features/currencies
  */
  addTransaction ({id, affiliation = '', revenue = 0, shipping = 0, tax = 0, currency = 'USD'}) {
    ga(`ecommerce:addTransaction`, {
      id,
      affiliation,
      revenue,
      shipping,
      tax,
      currency
    })
    for (let i=1; i<this.config.trackingIds.length; i++) {
      ga(`tracker${i}.ecommerce:addTransaction`, {
        id,
        affiliation,
        revenue,
        shipping,
        tax,
        currency
      })
    }
  }

  /**
  * Ecommerce transactions.
  * ecommerce needs to be enabled in the module options (ecommerce = true)
  * More info at https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce
  * @param {long} id - Transaction ID. Required
  * @param {string} name -  Product name. Required.
  * @param {string} sku - SKU/code.
  * @param {string} category -  Category or variation.
  * @param {float} price - Unit price.
  * @param {int} quantity - Quantity
  */
  addItem ({id, name, sku, category, price = 0, quantity = 1}) {
    ga(`ecommerce:addItem`, {
      id,
      name,
      sku,
      category,
      price,
      quantity
    })
    for (let i=1; i<this.config.trackingIds.length; i++) {
      ga(`tracker${i}.ecommerce:addItem`, {
        id,
        name,
        sku,
        category,
        price,
        quantity
      })
    }
  }

  /**
  * Ecommerce transactions.
  * More info at https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce
  */
  trackTransaction () {
    ga(`ecommerce:send`)
    for (let i=1; i<this.config.trackingIds.length; i++) {
      ga(`tracker${i}.ecommerce:send`)
    }
  }

  /**
  * Ecommerce transactions.
  * More info at https://developers.google.com/analytics/devguides/collection/analyticsjs/ecommerce
  */
  clearTransactions () {
    ga(`ecommerce:clear`)
    for (let i=1; i<this.config.trackingIds.length; i++) {
      ga(`tracker${i}.ecommerce:clear`)
    }
  }

}
