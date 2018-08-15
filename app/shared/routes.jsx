import React from 'react'
import { Route, IndexRoute } from 'react-router'
import { fetchPage, fetchDrugList, receivePageError } from './actions'

import NoMatchContainer from './containers/NoMatchContainer/component.jsx'
import ServerError from './components/ServerError/component.jsx'
import PageContainer from './containers/PageContainer/component'
import PageStaticContainer from './containers/PageStaticContainer/component'
import SearchPageContainer from './containers/SearchPageContainer/component'
import TypographyContainer from './containers/TypographyContainer/component' // @todo @refactor @joel - remove this in due time - replace with generic static page handler
import DrugListContainer from './containers/DrugListContainer/component'
import PageHome from './components/PageHome/component'

import { config } from 'config'

/*
 * Render 404 / 500 errors
 */

let getRoutes = store => {
  function withFallback (WrappedComponent, selectData) {
    return class extends React.Component {
      render () {
        let state = store.getState()
        switch (state.error) {
          case 500:
            return <ServerError />
          case 404:
            return <NoMatchContainer />
          default:
            return <WrappedComponent {...this.props} />
        }
      }
    }
  }

  function getPage (nextState, replace, callback) {
    const slug = this.slug ? this.slug : nextState.params.drugName
    store.dispatch(fetchPage(slug))
      .then(() => {
        callback()
      }).catch(err => {
        console.log(err)
        // error pushed to state
        callback()
      })
  }

  function getDrugList (nextState, replace, callback) {
    store.dispatch(fetchDrugList())
      .then(() => {
        callback()
      }).catch(err => {
        console.log(err)
        // error pushed to state
        callback()
      })
  }

  function noMatchError (nextState, replace, callback) {
    store.dispatch(receivePageError(404))
    callback()
  }

  return (
    <Route path='/'>
      <IndexRoute component={withFallback(PageHome)} onEnter={getPage} slug='index'/>
      <Route path='typography' component={withFallback(TypographyContainer)} onEnter={getPage} slug='typography' />
      <Route path='drug'>
        <IndexRoute component={withFallback(DrugListContainer)} onEnter={getDrugList} />
        <Route path='search' component={withFallback(SearchPageContainer)} />
        <Route path=':drugName' component={withFallback(PageContainer)} onEnter={getPage} />
      </Route>
      <Route path='offline' component={withFallback(PageStaticContainer)} onEnter={getPage} slug='offline' />
      <Route path='*' component={withFallback(NoMatchContainer)} onEnter={getPage} slug='no-match' />
    </Route>
  )
}

export { getRoutes }
