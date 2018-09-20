'use strict'

import express from 'express'
import bodyParser from 'body-parser'
import favicon from 'serve-favicon'
import { RouterContext, match } from 'react-router'
import { StaticRouter, Router, BrowserRouter, Switch, Route } from 'react-router-dom'
import React from 'react'
import { Provider } from 'react-redux'
import ReactDOMServer from 'react-dom/server'
import cookie from 'react-cookie'
import cookieParser from 'cookie-parser'
// import { getRoutes } from '../shared/routes'
import routes from '../shared/newRoutes'
import { ConnectedRouter } from 'react-router-redux'
import { matchRoutes, renderRoutes } from 'react-router-config'
import { exists } from '../shared/utilities'
import { generateStore } from '../shared/store'

import createMemoryHistory from 'history/createMemoryHistory'

import Head from '../shared/components/Head/component.jsx'
import Scripts from '../shared/components/Scripts/component.jsx'
import Skiplinks from '../shared/components/Skiplinks/component.jsx'
import ContentfulTextSearch from 'contentful-text-search'
import * as path from 'path'

/*
 * Express routes
 */
import apiRoutes from './api/v1/api.js'
import contentFulWebhookRoutes from './contentful/webhooks.js'

/*
 * Project configuration
*/
import { config } from 'config'
import packageInfo from '../../package.json'

/*
 * Elasticsearch config
*/
const search = new ContentfulTextSearch({
  space: config.contentful.contentSpace,
  token: config.contentful.contentAccessToken,
  elasticHost: config.elasticsearch.host,
  contentType: config.contentful.contentTypes.drug
})

var store

const app = express()
const cacheBusterTS = Date.now()

const addSearch = (req, res, next) => {
  res.search = search
  return next()
}

// Add search middleware
app.use('/api/v1/search', addSearch)
app.use('/contentful/webhook', addSearch)

app.use('/api/v1', apiRoutes)
app.use('/contentful/webhook', contentFulWebhookRoutes)

/*
 * Adding service worker files direct to express callbacks
 */
app.use('/sw.js', (req, res) => {
  res.sendFile(path.resolve('../static/ui/js/sw.js'))
})
app.use('/service-worker.js', (req, res) => {
  res.sendFile(path.resolve('../static/ui/js/service-worker.js'))
})

app.use(cookieParser())
app.use(bodyParser.json())
app.use(express.static('../static'))
app.use(favicon('../static/ui/favicon.ico'))

app.get('/robots.txt', function (req, res) {
  res.type('text/plain')
  res.send('User-agent: *\nDisallow: /')
})

/*
 * Pass Express over to the App via the React Router
 */
app.get('*', function (req, res) {
  store = generateStore()

  cookie.plugToRequest(req, res)

  let context = {}
  let history = createMemoryHistory()

  // for the client side
  // import createBrowserHistory from 'history/createBrowserHistory'
  // history = createBrowserHistory()

  const page = matchRoutes(routes, req.url)

  // checking whether I need to return matches but not sure if relevant
  const matcher = page.map(({ route, match }) => {
    return match
  })

  // const page = matchRoutes(routes, req.url)

  // // const promises = page.map(({ route, match }) => {
  // //   return route.loadData
  // //     ? route.loadData(match)
  // //     : Promise.resolve(null)
  // // })

  let componentHtml = ''
  let state = store.getState()

  try {
    componentHtml = ReactDOMServer.renderToString((
      <Provider store={store}>
        <StaticRouter context={context} location={req.url}>
          {renderRoutes(routes)}
        </StaticRouter>
      </Provider>
    ))
  } catch (err) {
    console.log(err)
  }

  let title = 'Talk to Frank'

  if (state.error) {
    switch (state.error) {
      case '404':
        title = 'Page not found (404)'
        break
      case 500:
      default:
        title = 'Server error'
        break
    }
  } else if (exists(state, 'app.pageData.head.title')) {
    title = state.app.pageData.head.title
  }

  let status = state.error ? state.error : 200
  let skip = ReactDOMServer.renderToStaticMarkup(<Skiplinks />)
  let componentHead = ReactDOMServer.renderToStaticMarkup(<Head {...state.app.pageData} error={state.app.error} />)
  let componentScripts = ReactDOMServer.renderToStaticMarkup(<Scripts cacheTS={cacheBusterTS} />)

  let renderedHtml = renderFullPageHtml(skip, componentHtml, componentHead, componentScripts, JSON.stringify(state))
  return res.status(status).send(renderedHtml)

  // res.render('index', {title: 'Express', data: false, content })

  // match({routes: getRoutes(store), location: req.url}, (error, redirectLocation, renderProps) => {
  //   if (error) {
  //     // Error with routing
  //     res.status(500).send(error.message)
  //     return
  //   }

  //   if (redirectLocation) {
  //     // Handle redirects
  //     console.log('REDIRECTING TO: ' + redirectLocation.pathname + redirectLocation.search)
  //     res.redirect(302, redirectLocation.pathname + redirectLocation.search)
  //     return
  //   }

  //   let componentHtml = ''
  //   let state = store.getState()

  //   try {
  //     componentHtml = ReactDOMServer.renderToString((
  //       <Provider store={store}>
  //         <RouterContext {...renderProps} />
  //       </Provider>
  //     ))
  //   } catch (err) {
  //     console.log(err)
  //   }

  //   let title = 'Talk to Frank'

  //   if (state.error) {
  //     switch (state.error) {
  //       case '404':
  //         title = 'Page not found (404)'
  //         break
  //       case 500:
  //       default:
  //         title = 'Server error'
  //         break
  //     }
  //   } else if (exists(state, 'app.pageData.head.title')) {
  //     title = state.app.pageData.head.title
  //   }

  //   let status = state.error ? state.error : 200
  //   let skip = ReactDOMServer.renderToStaticMarkup(<Skiplinks />)
  //   let componentHead = ReactDOMServer.renderToStaticMarkup(<Head {...state.app.pageData} error={state.app.error} />)
  //   let componentScripts = ReactDOMServer.renderToStaticMarkup(<Scripts cacheTS={cacheBusterTS} />)

  //   let renderedHtml = renderFullPageHtml(skip, componentHtml, componentHead, componentScripts, JSON.stringify(state))
  //   return res.status(status).send(renderedHtml)
  // })
})

function renderFullPageHtml (skip, html, head, scripts, initialState) {
  return `
    <!DOCTYPE html>
    <html lang='en'>
    ${head}
    <body>
      ${skip}
      <div id='app'>${html}</div>
      <script>window.$REDUX_STATE=${initialState}</script>
      ${scripts}
    </body>
    </html>
  `
}

const port = process.env.PORT || 3000

var server = app.listen(port, () => {
  let host = server.address().address

  console.log('Compiled in ' + config.buildConfig + ' mode')
  console.log('NODE_ENV set to ' + process.env.NODE_ENV)
  console.log('BUILD_CONFIG set to ' + process.env.BUILD_CONFIG)

  console.log(packageInfo.name + ' app listening at http://%s:%s', host, port)
})
