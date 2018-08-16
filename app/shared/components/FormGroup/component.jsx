import React from 'react'
import classNames from 'classnames'
import Button from '../Button/component.jsx'
import Svg from '../Svg/component.jsx'

const FormGroup = props => {
  let classes = classNames('input-group', props.className)
  let controlClasses = classNames('form-control', props.modifiers)

  return (
    <div className={classes}>
      <label htmlFor={props.id}><input className={controlClasses} id={props.id} name={props.name} type={props.type || 'text'}/></label>
      {props.button && <div className='input-group-append'>
      <Button className='btn--primary icon-magnifying' id='search-button'><Svg url='/ui/svg/magnifying.svg' alt=''/></Button>
      </div>}
    </div>
  )
}

export default FormGroup
