/* @flow */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Option from '../../../Option';
import { Dropdown, DropdownOption } from '../../../Dropdown';
import { getFirstIcon } from '../../../../Utils/toolbar';
import styles from './styles.css'; // eslint-disable-line no-unused-vars

export default class TextAlign extends Component {

  static propTypes = {
    expanded: PropTypes.bool,
    doExpand: PropTypes.func,
    doCollapse: PropTypes.func,
    onExpandEvent: PropTypes.func,
    config: PropTypes.object,
    onChange: PropTypes.func,
    currentState: PropTypes.object,
  };

  renderInFlatList(): Object {
    const { config: { options, left, center, right, justify, className }, onChange, currentState: { textAlignment }} = this.props;
    return (
      <div className={classNames('rdw-text-align-wrapper', className)} aria-label="rdw-textalign-control">
        {options.indexOf('left') >= 0 && <Option
          value="left"
          className={classNames(left.className)}
          active={textAlignment === 'left'}
          onClick={onChange}
        >
          <i
            className={left.icon}
          />
        </Option>}
        {options.indexOf('center') >= 0 && <Option
          value="center"
          className={classNames(center.className)}
          active={textAlignment === 'center'}
          onClick={onChange}
        >
          <i
            className={center.icon}
          />
        </Option>}
        {options.indexOf('right') >= 0 && <Option
          value="right"
          className={classNames(right.className)}
          active={textAlignment === 'right'}
          onClick={onChange}
        >
          <i
            className={right.icon}
          />
        </Option>}
        {options.indexOf('justify') >= 0 && <Option
          value="justify"
          className={classNames(justify.className)}
          active={textAlignment === 'justify'}
          onClick={onChange}
        >
          <i
            className={justify.icon}
          />
        </Option>}
      </div>
    );
  }

  renderInDropDown(): Object {
    const {
      config,
      expanded,
      doExpand,
      onExpandEvent,
      doCollapse,
      currentState: { textAlignment },
      onChange,
    } = this.props;
    const { options, left, center, right, justify, className, dropdownClassName } = config;
    return (
      <Dropdown
        className={classNames('rdw-text-align-dropdown', className)}
        optionWrapperClassName={classNames(dropdownClassName)}
        onChange={onChange}
        expanded={expanded}
        doExpand={doExpand}
        doCollapse={doCollapse}
        onExpandEvent={onExpandEvent}
        aria-label="rdw-textalign-control"
      >
        <i
          className={(textAlignment && config[textAlignment].icon) || getFirstIcon(config)}
        />
        {options.indexOf('left') >= 0 && <DropdownOption
          value="left"
          active={textAlignment === 'left'}
          className={classNames('rdw-text-align-dropdownOption', left.className)}
        >
          <i
            className={left.icon}
          />
        </DropdownOption>}
        {options.indexOf('center') >= 0 && <DropdownOption
          value="center"
          active={textAlignment === 'center'}
          className={classNames('rdw-text-align-dropdownOption', center.className)}
        >
          <i
            className={center.icon}
          />
        </DropdownOption>}
        {options.indexOf('right') >= 0 && <DropdownOption
          value="right"
          active={textAlignment === 'right'}
          className={classNames('rdw-text-align-dropdownOption', right.className)}
        >
          <i
            className={right.icon}
          />
        </DropdownOption>}
        {options.indexOf('justify') >= 0 && <DropdownOption
          value="justify"
          active={textAlignment === 'justify'}
          className={classNames('rdw-text-align-dropdownOption', justify.className)}
        >
          <i
            className={justify.icon}
          />
        </DropdownOption>}
      </Dropdown>
    );
  }

  render(): Object {
    const { config: { inDropdown } } = this.props;
    if (inDropdown) {
      return this.renderInDropDown();
    }
    return this.renderInFlatList();
  }
}
