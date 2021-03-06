import React from 'react'
import { Link } from 'react-router'
import Masthead from '../Masthead/component.jsx'
import Form from '../Form/component.jsx'
import Grid from '../Grid/component.jsx'
import GridCol from '../GridCol/component.jsx'
import Main from '../Main/component.jsx'
import Heading from '../Heading/component.jsx'
const util = require('util')

export default class SearchResults extends React.Component {
  constructor (props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.state = {
      searchValue: '',
      likelyDrugName: false,
      showSuggestions: false
    }
  }

  getDidYouMean (suggestions) {
    if (!suggestions || !suggestions.length) return null

    return (
      <ul className='search__list'>
        { suggestions.map((item, key) =>
          <li key={key}>
            <a href={`/drug/${item.text}`}>{item.text}</a>
          </li>
        )}
      </ul>
    )
  }

  getResults (results, type) {
    if (!results || !results.length) return null
    return (
      <ul className='search__list'>
        { results.map((item, i) => (
          type === 'phrase' ? <PhraseMatchItem{ ...item } key={i}/> : <ResultItem { ...item } key={i} />
        ))}
      </ul>
    )
  }

  handleInputChange (e) {
    e.preventDefault()
    let { likelyDrugName, showSuggestions } = this.state
    const { searchValue } = this.state
    const nextSearchValue = e.target.value
    let queryType = 'should'

    // If the server finds a drug name match
    if (this.props.pageData.match) {
      likelyDrugName = this.props.pageData.match
    }

    // Drug name is still in search
    if (likelyDrugName && nextSearchValue.indexOf(likelyDrugName) !== -1) {
      queryType = 'must'
    } else {
      likelyDrugName = ''
      showSuggestions = true
    }

    this.setState({
      searchValue: nextSearchValue,
      likelyDrugName,
      showSuggestions
    }, () => {
      if (nextSearchValue.length >= 2) {
        this.props.searchForTerm(nextSearchValue, likelyDrugName, queryType)
      }
    })
  }

  render () {
    const { loading } = this.props
    const { results, suggestions, phraseMatches } = this.props.pageData
    const { searchValue, likelyDrugName } = this.state
    const showResults = Boolean((results && results.length) || (phraseMatches && phraseMatches.length))

    return (
      <React.Fragment>
        <Masthead/>
        <Main>
          <Heading type='h1' className='h1' text='Search'/>
          <Grid>
            <GridCol className='col-12 col-md-8 search'>
              <Form>
                <div className='input-group'>
                  <label htmlFor='search-site' className='form-label h3'>Search for drugs, advice & information...</label>
                  <div className='input-group--raised d-flex'>
                    <input
                      className='form-control form-control--search'
                      id='search-site'
                      type='text'
                      autoComplete='off'
                      autoCorrect='off'
                      autoCapitalize='off'
                      spellCheck='false'
                      value={searchValue}
                      onChange={this.handleInputChange}
                      />
                  </div>
                </div>
              </Form>
              { loading &&
                <p>Searching...</p>
              }
              <Grid>
                { !likelyDrugName &&
                  <GridCol className='col-12 col-sm-12 search--suggestions'>
                    { this.getDidYouMean(suggestions)}
                  </GridCol>
                }
                { showResults &&
                  <GridCol className='col-12 col-sm-12'>
                    { this.getResults(results)}
                    <hr />
                    { this.getResults(phraseMatches, 'phrase')}
                  </GridCol>
                }
              </Grid>
            </GridCol>
          </Grid>
        </Main>
      </React.Fragment>
    )
  }
}

const getHeading = (field, drugName) => {
  const headings = {
    'risks': 'the risks of using %s',
    'effects': 'the effects of using %s',
    'appearance': 'what %s looks like',
    'law': 'what the law says about %s',
    'worried': 'worries of using %s',
    'description.localised': '%s'
  }
  return util.format(headings[field], drugName)
}

const PhraseMatchItem = ({text, drugName, topic, link}) => {
  return (
    <li key={`phraseresultitem-${link}`}>
      <p><strong>{ getHeading(topic, drugName) }</strong></p>
      <p dangerouslySetInnerHTML={{__html: text}} />
    </li>
  )
}

const ResultItem = ({name, drug, description, link}) => {
  return (
    <li key={`resultitem-${link}`}>
      <p className='h4'>
        <a href={`/drug/${link}`}>{name}</a>
        { name !== drug && ` (${drug})` }
      </p>
      <p dangerouslySetInnerHTML={{__html: description}}/>
    </li>
  )
}
