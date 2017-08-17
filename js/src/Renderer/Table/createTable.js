import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable'
import classNames from 'classnames';
import { ContentState, EditorState } from 'draft-js'
import { generateArray } from '../../Utils/common'
import styles from './styles.css'; // eslint-disable-line no-unused-vars
import ColorPicker from '../../components/Controls/ColorPicker/Component/index';
import FontSize from '../../components/Controls/FontSize/Component/index';

const getSelectedRowsNCols = (startrow, startcol, endrow, endcol) => {
  const minRow = startrow < endrow ? startrow : endrow
  const maxRow = startrow < endrow ? endrow : startrow

  const minCol = startcol < endcol ? startcol : endcol
  const maxCol = startcol < endcol ? endcol : startcol

  const selectedRowsNCols = []
  for (let i = 0; i < maxRow + 1; i++) {
    if (i < minRow) continue
    for (let j = 0; j < maxCol + 1; j++) {
      if (j < minCol) continue
      selectedRowsNCols.push({
        column: j,
        row: i,
      })
    }
  }
  return selectedRowsNCols
}

const tableConfig = {
  colors: ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4','#009688','#4caf50','#8bc34a','#cddc39','#ffeb3b','#ffc107','#ff9800','#ff5722','#795548','#9e9e9e','#607d8b','#ffffff','#000000',
  ]
}

const customizedStyle = {
  tdTool: {
    position: 'absolute',
    zIndex: '100',
    width: '350'
  },
  tdToolWrapper: {
    display: 'flex',
  }
}

const createTable = () => class Table extends Component {
  static propTypes = {
    blockProps: PropTypes.object,
  }
  constructor(props) {
    super(props);
    const { entity } = props.blockProps
    const { grids, attributes } = entity.getData();
    this.state = {
      attributes,

      isMouseDown: false,
      isFontExpanded: false,
      isColorPalate: false,
      isControlMode: false,
      isWidthExpanded: false,
      isEditing: false,

      grids: grids || [[]],
      selectedRowsNCols: [],

      mouseOverRow: -1,
      mouseOverCol: -1,
      mouseOverStartRow: -1,
      mouseOverStartCol: -1,

      lastFocusRow: -1,
      lastFocusColumn: -1,
      focusRow: -1,
      focusColumn: -1,

      tdInputValue: '',
      toFocused: ''
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !Immutable.is(nextProps.contentState, this.props.contentState) ||
      nextState.isEditing !== this.state.isEditing ||
      nextState.focusRow !== this.state.focusRow ||
      nextState.focusColumn !== this.state.focusColumn ||
      nextState.lastFocusRow !== this.state.lastFocusRow ||
      nextState.lastFocusColumn !== this.state.lastFocusColumn ||
      nextState.isControlMode !== this.state.isControlMode ||
      nextState.isColorPalate !== this.state.isColorPalate ||
      nextState.mouseOverRow !== this.state.mouseOverRow ||
      nextState.mouseOverCol !== this.state.mouseOverCol ||
      !Immutable.is(nextState.selectedRowsNCols !== this.state.selectedRowsNCols)
    )
  }

  componentDidUpdate(preProps, preState) {
    const { toFocused } = this.state
    if (
      preState.toFocused !== toFocused ||
      document.activeElement !== this.refs[toFocused]
    ) {
      setTimeout(
        () => this.refs[toFocused] && this.refs[toFocused].focus(),
        0
      )
    }
  }

  onClickTd = (focusRow, focusColumn) => {
    const { blockProps, block } = this.props
    const { onStartEdit, isReadOnly } = blockProps;
    if (isReadOnly()) return
    const toFocused = `${focusRow}-${focusColumn}`
    this.setState(
      {
        isEditing: true,
        focusRow,
        focusColumn,
        toFocused
      },
      () => {
        onStartEdit(block.getKey())
      }
    )
  }

  onClickTdEventHandler = (event, rowIndex, columnIndex) => {
    event.preventDefault();
    event.stopPropagation();
    this.onClickTd(rowIndex, columnIndex)
  }

  updateEditedContent: Function = (texValue): ContentState => {
    const { block, blockProps, contentState } = this.props
    const { focusRow, focusColumn } = this.state;
    const { grids } = blockProps.entity.getData();
    const entityKey = block.getEntityAt(0);

    grids[focusRow][focusColumn] = texValue

    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        grids
      },
    );
    return newContentState
  }

  onTdBlur = (event) => {
    const { isEditing, focusRow, focusColumn } = this.state
    const { blockProps, block } = this.props
    const newText = event.target.value
    // updateEditedContent will return contentState instance, for now we don't need it,
    // just keeping it for reference.
    const newContentState = this.updateEditedContent(newText) // eslint-disable-line
    if (isEditing) {
      this.setState(
        {
          lastFocusRow: focusRow,
          lastFocusColumn: focusColumn,
          focusRow: -1,
          focusColumn: -1
        },
        () => {
          const { onFinishEdit } = blockProps;
          onFinishEdit(block.getKey())
        }
      )
    }
  }

  onTdFocus = (ref) => {
    // console.log('this.refs[ref].offsetLeft', this.refs[ref].offsetLeft)
    // console.log('this.refs[ref].offsetTop', this.refs[ref].offsetTop)
  }

  onAddRowAfter = (row) => {
    if (row === -1) return
    const { block, blockProps, contentState } = this.props
    const { grids, attributes } = blockProps.entity.getData();
    const columnLength = grids[0].length
    const entityKey = block.getEntityAt(0);
    const insertedRows = generateArray(columnLength)
    const insertedAttrs = {
      attributes: {},
      style: {},
      td: {
        attributes: generateArray(columnLength, {}),
        style: generateArray(columnLength, {}),
      }
    }
    const newGrids = [
      ...grids.slice(0, row + 1),
      insertedRows,
      ...grids.slice(row + 1)
    ]
    const newAttrs = [
      ...attributes.slice(0, row + 1),
      insertedAttrs,
      ...attributes.slice(row + 1)
    ]

    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        grids: newGrids,
        attributes: newAttrs,
      },
    );

    const newEditorState = EditorState.createWithContent(newContentState)
    blockProps.onEditorChange(newEditorState)

  }

  onRemoveRowAfter = (row) => {
    if (row === -1) return
    const { block, blockProps, contentState } = this.props
    const { grids, attributes } = blockProps.entity.getData();
    const entityKey = block.getEntityAt(0);
    const newGrids = [
      ...grids.slice(0, row),
      ...grids.slice(row + 1)
    ]
    const newAttrs = [
      ...attributes.slice(0, row),
      ...attributes.slice(row + 1)
    ]

    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        grids: newGrids,
        attributes: newAttrs,
      },
    );

    const newEditorState = EditorState.createWithContent(newContentState)
    blockProps.onEditorChange(newEditorState)
  }

  onAddColumnAfter = (columnIndex) => {
    if (columnIndex === -1) return
    const { block, blockProps, contentState } = this.props
    const { grids, attributes } = blockProps.entity.getData();
    const entityKey = block.getEntityAt(0);

    // mutate original entity data
    grids.forEach(row => row.splice(columnIndex + 1, 0, ''))
    attributes.forEach(row => {
      row.td.attributes.splice(columnIndex + 1, 0, {})
      row.td.style.splice(columnIndex + 1, 0, {})
    })

    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        grids,
        attributes,
      },
    );

    const newEditorState = EditorState.createWithContent(newContentState)
    blockProps.onEditorChange(newEditorState)
  }

  onRemoveColumn = (columnIndex) => {
    if (columnIndex === -1) return
    const { block, blockProps, contentState } = this.props
    const { grids, attributes } = blockProps.entity.getData();
    const entityKey = block.getEntityAt(0);

    // mutate original entity data
    grids.forEach(row => row.splice(columnIndex, 1))
    attributes.forEach(row => {
      row.td.attributes.splice(columnIndex, 1)
      row.td.style.splice(columnIndex, 1)
    })

    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        grids,
        attributes,
      },
    );

    const newEditorState = EditorState.createWithContent(newContentState)
    blockProps.onEditorChange(newEditorState)
  }

  onWidthChange = (width: number) => {
    const { lastFocusColumn, lastFocusRow, selectedRowsNCols } = this.state
    const { block, blockProps, contentState } = this.props
    const { attributes } = blockProps.entity.getData();
    const entityKey = block.getEntityAt(0);

    if (lastFocusRow !== -1 && lastFocusColumn !== -1) {
      attributes[lastFocusRow].td.style[lastFocusColumn] = {
        ...attributes[lastFocusRow].td.style[lastFocusColumn],
        width: `${width}%`,
      }
    } else if (selectedRowsNCols.length !== 0) {
      selectedRowsNCols.forEach(({column, row}) => {
        attributes[row].td.style[column] = {
          ...attributes[row].td.style[column],
          width: `${width}%`,
        }
      })
    }
    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        attributes,
      },
    );

    const newEditorState = EditorState.createWithContent(newContentState)
    blockProps.onEditorChange(newEditorState)
  }

  onFontSizeChange = (fontSize: number) => {
    const { lastFocusColumn, lastFocusRow, selectedRowsNCols } = this.state
    const { block, blockProps, contentState } = this.props
    const { attributes } = blockProps.entity.getData();
    const entityKey = block.getEntityAt(0);

    if (lastFocusRow !== -1 && lastFocusColumn !== -1) {
      attributes[lastFocusRow].td.style[lastFocusColumn] = {
        ...attributes[lastFocusRow].td.style[lastFocusColumn],
        fontSize,
      }
    } else if (selectedRowsNCols.length !== 0) {
      selectedRowsNCols.forEach(({column, row}) => {
        attributes[row].td.style[column] = {
          ...attributes[row].td.style[column],
          fontSize,
        }
      })
    }
    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        attributes,
      },
    );

    const newEditorState = EditorState.createWithContent(newContentState)
    blockProps.onEditorChange(newEditorState)
  }

  onColorChange = (currentStyle, color) => {
    const { lastFocusColumn, lastFocusRow, selectedRowsNCols } = this.state
    const { block, blockProps, contentState } = this.props
    const { attributes } = blockProps.entity.getData();
    const entityKey = block.getEntityAt(0);

    if (lastFocusRow !== -1 && lastFocusColumn !== -1) {

      if (currentStyle === 'bgcolor') {
        attributes[lastFocusRow].td.style[lastFocusColumn] = {
          ...attributes[lastFocusRow].td.style[lastFocusColumn],
          backgroundColor: color,
        }
      } else if (currentStyle === 'color') {
        attributes[lastFocusRow].td.style[lastFocusColumn] = {
          ...attributes[lastFocusRow].td.style[lastFocusColumn],
          color,
        }
      }
    } else if (selectedRowsNCols.length !== 0) {
      selectedRowsNCols.forEach(({column, row}) => {
        if (currentStyle === 'bgcolor') {
          attributes[row].td.style[column] = {
            ...attributes[row].td.style[column],
            backgroundColor: color,
          }
        } else if (currentStyle === 'color') {
          attributes[row].td.style[column] = {
            ...attributes[row].td.style[column],
            color,
          }
        }
      })
    }

    const newContentState = contentState.mergeEntityData(
      entityKey,
      {
        attributes,
      },
    );

    const newEditorState = EditorState.createWithContent(newContentState)
    blockProps.onEditorChange(newEditorState)
  }

  onMouseDownHandler = (event) => {
    this.setState({
      isMouseDown: true,
    })
  }

  onMouseUpHandler = (event) => {
    const { mouseOverCol, mouseOverRow, mouseOverStartRow, mouseOverStartCol } = this.state
    const selectedRowsNCols = getSelectedRowsNCols(mouseOverRow, mouseOverCol, mouseOverStartRow, mouseOverStartCol)
    

    this.setState({
      isMouseDown: false,
      selectedRowsNCols,
    })
  }

  onMouseOverTdHandler = (row, column) => {
    if (this.state.isMouseDown) {
      let mouseOverRow = row
      let mouseOverCol = column
      let mouseOverStartRow = this.state.mouseOverStartRow
      let mouseOverStartCol = this.state.mouseOverStartCol

      if (mouseOverStartRow > row || mouseOverStartRow === -1)  {
        mouseOverStartRow = row
      }
      if (mouseOverStartCol > column || mouseOverStartCol === -1) {
        mouseOverStartCol = column
      }

      if (mouseOverRow < this.state.mouseOverRow) {
        mouseOverRow = this.state.mouseOverRow
      }
      if (mouseOverCol < this.state.mouseOverCol) {
        mouseOverCol = this.state.mouseOverCol
      }
      this.setState({
        mouseOverStartRow,
        mouseOverStartCol,
        mouseOverRow,
        mouseOverCol,
      })
    }
  }

  onKeyDownTdInput = (event) => {
    event.stopPropagation()
  }

  onKeyPressTdInput = (event) => {
    event.stopPropagation()
  }

  onKeyUpTdInput = (event) => {
    event.stopPropagation()
  }

  render() {
    const {
      grids, isEditing, focusRow,
      focusColumn, attributes, isColorPalate,
      isControlMode, lastFocusColumn, lastFocusRow,
      selectedRowsNCols, isFontExpanded, isWidthExpanded
    } = this.state
    const { readOnly, translations } = this.props.blockProps
    console.log('this.state.mouseOverStartRow', this.state.mouseOverStartRow)
    console.log('this.state.mouseOverStartCol', this.state.mouseOverStartCol)
    console.log('this.state.mouseOverRow', this.state.mouseOverRow)
    console.log('this.state.mouseOverCol', this.state.mouseOverCol)
    console.log('---------------------')

    return (
      <div>
        <table
          ref={(element) => { this.table = element; }}
          onMouseDown={this.onMouseDownHandler}
          onMouseUp={this.onMouseUpHandler}
          className='editor-table'
          contentEditable={false}
        >
          <tbody>
            {grids.map((rows, rowIndex) => {
              return (
                <tr
                  key={rowIndex}
                  className='editor-table-tr'
                  {...attributes[rowIndex].attributes}
                  style={attributes[rowIndex].style}
                >
                  {rows.map((column, columnIndex) => {
                    const tdClassName = {
                      'editor-table-td': true,
                      'editor-table-active-td': (
                        `${focusRow}-${focusColumn}` === `${rowIndex}-${columnIndex}` ||
                        (
                          `${lastFocusRow}-${lastFocusColumn}` === `${rowIndex}-${columnIndex}` &&
                          isControlMode
                        ) || (
                          selectedRowsNCols
                            .filter(rowNCol => rowNCol.row === rowIndex && rowNCol.column === columnIndex).length
                          !== 0
                        )
                      ),
                    }
                    return (
                      <td
                        key={columnIndex}
                        className={classNames(tdClassName)}
                        onMouseOver={
                          () => this.onMouseOverTdHandler(rowIndex, columnIndex)
                        }
                        onMouseDown={() => {
                          this.setState({
                            mouseOverStartRow: rowIndex,
                            mouseOverStartCol: columnIndex,
                            mouseOverRow: rowIndex,
                            mouseOverCol: columnIndex,
                          })
                        }}
                        onClick={(event) => this.onClickTdEventHandler(event, rowIndex, columnIndex)}
                        {...attributes[rowIndex].td.attributes[columnIndex]}
                        style={attributes[rowIndex].td.style[columnIndex]}
                      >
                        {
                          isEditing && `${focusRow}-${focusColumn}` === `${rowIndex}-${columnIndex}`
                            ? (
                                <input
                                  type="text"
                                  ref={`${rowIndex}-${columnIndex}`}
                                  key={`${rowIndex}-${columnIndex}`}
                                  className='editor-table-input'
                                  defaultValue={column}
                                  onKeyDown={this.onKeyDownTdInput}
                                  onKeyPress={this.onKeyPressTdInput}
                                  onKeyUp={this.onKeyUpTdInput}
                                  onBlur={this.onTdBlur}
                                  onFocus={() => this.onTdFocus(`${rowIndex}-${columnIndex}`)}
                                  onCopy={(event) => event.stopPropagation()}
                                  onCut={(event) => event.stopPropagation()}
                                  onPaste={(event) => event.stopPropagation()}
                                />            
                              )
                            : column
                        }
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        {
          !readOnly &&
          <div
            className='rdw-dropdown-optionwrapper'
            style={customizedStyle.tdTool}
            onClick={
              () => {
                console.log('lastFocusColumn', lastFocusColumn)
                console.log('lastFocusRow', lastFocusRow)
              }
            }
          >
            <div style={customizedStyle.tdToolWrapper}>
              <span
                className='rdw-option-wrapper'
                onClick={
                  () => {
                    this.onAddRowAfter(lastFocusRow, lastFocusColumn)
                  }
                }
              >
                <i className='icon-editor-insert-row' />
              </span>
              <span className='rdw-option-wrapper'
                onClick={
                  () => {
                    this.onRemoveRowAfter(lastFocusRow, lastFocusColumn)
                  }
                }
              >
                <i className='icon-editor-remove-row' />
              </span>
              <span
                className='rdw-option-wrapper'
                onClick={
                  () => {
                    this.onAddColumnAfter(lastFocusColumn)
                  }
                }
              >
                <i className='icon-editor-insert-column' />
              </span>
              <span
                className='rdw-option-wrapper'
                onClick={
                  () => {
                    this.onRemoveColumn(lastFocusColumn)
                  }
                }
              >
                <i className='icon-editor-remove-column' />
              </span>
              <span
                className='rdw-option-wrapper'
                onClick={() => {
                  this.setState({
                    isColorPalate: !isColorPalate,
                    isControlMode: !this.state.isControlMode
                  })
                }}
              >
                <i className='icon-editor-color' />
              </span>
              <span
                className='rdw-option-wrapper'
                onClick={() => {
                  this.setState({
                    isFontExpanded: !isFontExpanded,
                    isControlMode: !this.state.isControlMode
                  })
                }}
              >
                <i className='icon-editor-font-size-a' />
              </span>
              <span
                className='rdw-option-wrapper'
                onClick={() => {
                  this.setState({
                    isWidthExpanded: !isWidthExpanded,
                    isControlMode: !this.state.isControlMode
                  })
                }}
              >
                <i className='icon-editor-fit-to-width' />
              </span>
            </div>
          </div>
        }
        <ColorPicker
          isTablePicker={true}
          onTablePickerChange={this.onColorChange}
          expanded={isColorPalate}
          translations={translations}
          currentState={{}}
          doCollapse={() => {}}
          config={{
           colors: tableConfig.colors
          }}
        />
        { isFontExpanded &&
        <FontSize
          isTablePicker={true}
          onChange={this.onFontSizeChange}
          expanded={isFontExpanded}
          config={{
            options: [8,12,16,18,20,24,28,32,36]
          }}
          currentState={{}}
        />
        }
        { isWidthExpanded &&
        <FontSize
          isTablePicker={true}
          onChange={this.onWidthChange}
          expanded={isWidthExpanded}
          config={{
            options: [10,20,30,40,50,60,70,80,90]
          }}
          currentState={{fontSize: '%'}}
        />
        }
      </div>
    );
  }
};

export default createTable;
