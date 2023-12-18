<template>
  <!-- complex mode -->
  <div
      v-if="useComplexMode"
      name="ComplexTable"
      :class="{'-complex-table': true, '-selectable': showSelection }"
      ref="table"
      v-resize:debounce="handleResize"
  >
    <template v-for="(x, index) in ['Header', 'Body']">
      <div
          :key="index"
          v-if="(x !== 'Footer' || x === 'Footer') && (isPending == false || x == 'Header' )"
          ref="wrappers"
          :name="`Table${x}Wrapper`"
          :class="`-table-${x.toLowerCase()}`"
          :style="[
          x === 'Body' && { height: fullHeight.enabled == true ? `${calcTableHeight}px`  : 'auto' }
        ]"
      >
        <div
            :ref="`NormalTable${x}`"
            :name="`NormalTable${x}`"
            :style="[ {
                      width: rightFixedColumns.length ? `${mainTableWidth}px` : `${mainTableWidth - verticalScrollWidthCorrection}px`,
                      marginLeft:  leftFixedColumns.length > 0 ? `${fixedLeftTableWidth}px` : '0px' ,
                      marginRight: rightFixedColumns.length > 0 ? `${fixedRightTableWidth}px` : '0px' ,
                      overflow: 'hidden'
                    },
                    x === 'Body' &&
                    {
                      width: `${mainTableWidth}px`,
                      marginLeft:  leftFixedColumns.length > 0 ? `${fixedLeftTableWidth}px` : '0px' ,
                      marginRight: rightFixedColumns.length > 0 ? `${fixedRightTableWidth}px` : '0px' ,
                      height: fullHeight.enabled == true ? `${calcTableHeight}px` : 'auto',
                      overflowX: 'auto',
                      overflowY: rightFixedColumns.length  ? 'hidden' : 'auto'
                    }]"
        >
          <table-frame v-bind="propsToNormalTable">
            <component :is="`Table${x}`" v-bind="propsToNormalTable" @header-resize="headerResize" @handle-event="handleEvent"/>
          </table-frame>
        </div>

        <div
            v-if="leftFixedColumns.length"
            :ref="`LeftFixedTable${x}`"
            :name="`LeftFixedTable${x}`"
            class="-left-fixed -fixed-table"
            :style="[ x === 'Body' &&  { overflow: 'hidden' }, x === 'Body' && $props.fullHeight != null && $props.fullHeight.enabled == true &&  {height: `${fixedTableHeight}px` }, fixedLeftTableWidth >1 && {width: `${fixedLeftTableWidth}px`} ]"
        >
          <table-frame v-bind="propsToLeftFixedTable" left-fixed>
            <component :is="`Table${x}`" v-bind="propsToLeftFixedTable" left-fixed @header-resize="headerResize" @handle-event="handleEvent"/>
          </table-frame>
        </div>

        <div
            v-if="rightFixedColumns.length"
            :ref="`RightFixedTable${x}`"
            :name="`RightFixedTable${x}`"
            class="-right-fixed -fixed-table"
            :style="[fixedRightTableWidth > 1 &&  x === 'Header' && {width: `${fixedRightTableWidth - verticalScrollWidthCorrection}px`,  marginRight: `${verticalScrollWidthCorrection}px` }, x === 'Body' &&  { overflowX: 'hidden', overfloxY: 'auto' }, x === 'Body' && $props.fullHeight != null && $props.fullHeight.enabled == true && {height: `${fixedTableHeight}px` }, fixedRightTableWidth > 1 && x === 'Body' && {width: `${fixedRightTableWidth}px`}]"
        >
          <table-frame v-bind="propsToRightFixedTable" right-fixed>
            <component :is="`Table${x}`" v-bind="propsToRightFixedTable" right-fixed @header-resize="headerResize" @handle-event="handleEvent" />
          </table-frame>
        </div>
      </div>
      <div v-else-if="x == 'Body'" :key="index">
        <div class="spinner">
          <div class="rect1"></div>
          <div class="rect2"></div>
          <div class="rect3"></div>
          <div class="rect4"></div>
          <div class="rect5"></div>
        </div>
        <div class="spinner-text">
          {{ $i18nForDatatable('loading') }}
        </div>
      </div>
    </template>

    <column-menu ref="columnMenu"
                 :show="columnMenu.show"
                 :top="columnMenu.top"
                 :left="columnMenu.left"
                 :isOverflow="columnMenu.isOverflow"
                 :columns="$parent.headerColumns"
                 :selectedColumn="columnMenu.selectedColumn"
                 v-bind="propsToNormalTable"
                 v-on:force-grid-resize= "fireResizeEvent"
                 v-on:set-auto-column-width="handleEvent($event, 'columnMenu-setAutoColumnWidth')"
                 v-on:set-auto-allColumns-width="handleEvent($event, 'columnMenu-setAutoAllColumnWidth')"
                 v-on:reset-columns="handleEvent($event, 'resetColumns')"
                 v-on:reset-filters="handleEvent($event, 'resetFilters')"
                 v-on:column-pinned-left="handleEvent($event, 'columnPinnedLeft')"
                 v-on:column-unpinned-left="handleEvent($event, 'columnUnpinnedLeft')"
                 v-on:column-pinned-right="handleEvent($event, 'columnPinnedRight')"
                 v-on:column-unpinned-right="handleEvent($event, 'columnUnpinnedRight')"
                 v-on:update:show = "columnMenu.show = $event"
                 v-on:column-set-visibility="handleEvent($event, 'columnMenu-setVisibility')"
    ></column-menu>

    <context-menu v-bind="propsToNormalTable" />

    <div class="manualColumnResizer" ref="manualColumnResizer"></div>
    <div class="manualColumnResizerGuide"  ref="manualColumnResizerGuide"></div>
    <div class="mh-reorder-cue" style="height: 37px;"></div>

  </div>
  <!-- simple mode -->
  <div v-else name="SimpleTable" ref="table">
    <table-frame v-bind="propsToNormalTable" is-simple-table>
      <table-header v-bind="propsToNormalTable" is-simple-table />
      <table-body v-bind="propsToNormalTable" is-simple-table />
      <table-footer v-if="summary" v-bind="propsToNormalTable" is-simple-table />
    </table-frame>
  </div>

</template>

<script>
import TableFrame from './TableFrame.vue'
import TableHeader from './TableHeader.vue'
import TableBody from './TableBody.vue'
import TableFooter from './TableFooter.vue'
import ContextMenu from '../ContextMenu/Index'
import ColumnMenu from '../ColumnMenu/Index'
import props from '../_mixins/props'
import getScrollWidth from '../_utils/getScrollWidth'
import isColVisible from '../_utils/isColVisible'
import syncScroll from '../_utils/syncScroll'
import resize from 'vue-resize-directive'
import textWidthHelper from '../_utils/textWidthHelper'

function initialState(table, expandKey) {
  return {
    firstProp: expandKey || (table.columns[0] && table.columns[0].key)
  }
}

export default {
  name: 'Tbl',
  mixins: [props],
  props: {
    isPending: Boolean
  },
  components: { TableFrame, TableHeader, TableBody, TableFooter, ContextMenu, ColumnMenu },
  directives: {
    resize
  },
  data() {
    return {
      columnMenu: {
        show: false,
        top: -9999,
        left: -9999,
        isOverflow: false,
        selectedColumn: null
      },
      offsetLeft: 0,
      offsetTop: 0,
      scrollWidth: getScrollWidth(),
      tableWidth: 0,
      fixedTableHeight: 0,
      fixedLeftTableWidth: 0,
      fixedRightTableWidth: 0,
      tableHeight: 0,
      isRedered: false,
      unsync: null,
      unsyncH: null,
      isVerticallScrollVisible: false,
      normalTableFixedWidth: 0,
      ...initialState(this, '')
    }
  },
  methods: {
    indexOfField(fieldId) {
      let filredIdConverted = Number(fieldId)
      let fieldData = this.table.headerColumns
      let i = 0
      let ii = this.table.headerColumns.length
      for (i; i < ii; i++) if (fieldData[i].index === filredIdConverted) break
      return i
    },
    calcFixedTableHeight() {
      if (
          this.$refs.NormalTableBody != null &&
          this.$refs.NormalTableBody.length > 0 &&
          this.$refs.NormalTableBody[0].scrollWidth >
          this.$refs.NormalTableBody[0].clientWidth
      ) {
        this.fixedTableHeight = this.calcTableHeight - 17
      } else {
        this.fixedTableHeight = this.calcTableHeight
      }
    },
    headerResize(e, deltaX, table, newWidth, fieldIndex) {

      var calcAndSetColumnsWidth = () => {
        if (table === 'M' && this.$refs.NormalTableHeader != null && this.$refs.NormalTableHeader.length > 0) {
          let columnsWithoutWidth = this.visibleColumns.filter((c) => (!c.hasOwnProperty('colStyle') || (c.colStyle != null && !c.colStyle.hasOwnProperty('width')) || (c.colStyle != null && c.colStyle.hasOwnProperty('width') && c.colStyle.width === 'auto')) && (c.fixed !== true && c.fixed !== 'left' && c.fixed !== 'right'))
          let colsWidth = this.visibleColumns.filter((c) => (c.fixed !== true && c.fixed !== 'left' && c.fixed !== 'right') && c.hasOwnProperty('colStyle') && (c.colStyle != null && c.colStyle.hasOwnProperty('width'))).reduce((a, c) => a + parseFloat(c.colStyle.width.replace(/auto|px|\s/g, '') || 0), 0)
          let tableWidth = this.$refs.NormalTableHeader[0].querySelector('table').offsetWidth

          let newRestColumnsWidth = (tableWidth - colsWidth) / columnsWithoutWidth.length
          let newTableFixedWidth = tableWidth - colsWidth

          columnsWithoutWidth.forEach(col => {
            // console.log('SET WIDTH ON COLUMN ' + col.index + ' on ' + newRestColumnsWidth)
            const realColumnIndex = this.indexOfField(col.index)
            const target = this.table.headerColumns[realColumnIndex]
            this.table.headerColumns.splice(realColumnIndex, 1, {
              ...target,
              colStyle: { width: newRestColumnsWidth + 'px' }
            })
          })
        }
      }

      if (e.type === 'mousedown') {
        this.$refs.manualColumnResizer.style.left = e.pageX - this.$refs.table.getBoundingClientRect().left + 'px'
        this.$refs.manualColumnResizerGuide.style.left = e.pageX - this.$refs.table.getBoundingClientRect().left + 'px'
        this.$refs.manualColumnResizerGuide.style.display = 'block'
        this.$refs.manualColumnResizer.style.display = 'block'
        calcAndSetColumnsWidth()
      }

      if (e.type === 'mousemove') {
        const realColumnIndex = this.indexOfField(fieldIndex)
        const target = this.table.headerColumns[realColumnIndex]

        if (target.minWidth != null && newWidth <= target.minWidth) {
          return
        }

        this.$refs.manualColumnResizer.style.left = e.pageX - this.$refs.table.getBoundingClientRect().left + 'px'
        this.$refs.manualColumnResizerGuide.style.left = e.pageX - this.$refs.table.getBoundingClientRect().left + 'px'
      }

      if (e.type === 'calcAndSetColumnsWidth') {
        calcAndSetColumnsWidth()
      }

      if (e.type === 'mouseup') {
        this.$refs.manualColumnResizerGuide.style.display = 'none'
        this.$refs.manualColumnResizer.style.display = 'none'

        const realColumnIndex = this.indexOfField(fieldIndex)
        const target = this.table.headerColumns[realColumnIndex]

        this.table.headerColumns.splice(realColumnIndex, 1, {
          ...target,
          colStyle: { width: (target.minWidth != null && newWidth <= target.minWidth ? target.minWidth : newWidth) + 'px' }
        })

        calcAndSetColumnsWidth()

        this.handleResize()

        if (table === 'L') {
          this.fixedLeftTableWidth = this.getLeftFixedTableWidth();
        }

        if (table === 'R') {
          this.fixedRightTableWidth = this.getRightFixedTableWidth();
        }
      }
    },
    handleResize(e) {
      // Set Table WIDTH
      if (this.$refs.table != null) {
        this.tableWidth = this.$refs.table.offsetWidth
      }

      // Set Table HEIGHT
      if (this.fullHeight != null && e != undefined) {
        let heightCorrection = 0
        if (
            this.fullHeight != null &&
            this.fullHeight.heightCorrection != null
        ) {
          heightCorrection = this.fullHeight.heightCorrection
        }

        let tableHeigth = window.innerHeight + heightCorrection

        if (this.fullHeight.minHeight != null) {
          this.tableHeight = tableHeigth < this.fullHeight.minHeight ? this.fullHeight.minHeight : tableHeigth
        } else {
          this.tableHeight = tableHeigth
        }

        setTimeout(() => {
          if (
              this.$refs.NormalTableBody != null &&
              this.$refs.NormalTableBody.length > 0
          ) {
            if (
                this.$refs.NormalTableBody[0].scrollHeight >
                this.$refs.NormalTableBody[0].clientHeight
            ) {
              this.isVerticallScrollVisible = true
            } else {
              this.isVerticallScrollVisible = false
            }
          }
        }, 200)
      }

      // Set fixed Table width
      if (this.$refs.wrappers != null && this.$refs.wrappers.length > 0) {
        setTimeout(() => {
          this.calcFixedTableHeight()
        }, 200)
      }

      this.fixedLeftTableWidth = this.getLeftFixedTableWidth()
      this.fixedRightTableWidth = this.getRightFixedTableWidth()
    },
    toggleStatus(type, row, rowIndex, value) {
      // this.validateType(type, ['Expanded', 'Checked', 'Hide', 'Fold'], 'toggleStatus', false);
      const target = this.table.bodyData[rowIndex]
      this.table.bodyData.splice(rowIndex, 1, {
        ...target,
        [`_is${type}`]: typeof value === 'undefined' ? !row[`_is${type}`] : value
      })
    },
    setRowPropertyValue(propertyName, row, rowIndex, value) {
      const target = this.table.bodyData[rowIndex]
      this.table.bodyData.splice(rowIndex, 1, {
        ...target,
        [`_${propertyName}`]: value
      })
    },
    getChildrenIndex(parentLevel, parentIndex, careFold = true) {
      const data = this.table.bodyData
      let childrenIndex = []
      for (let i = parentIndex + 1; i < data.length; i++) {
        if (data[i]._level <= parentLevel) break
        if (data[i]._level - 1 === parentLevel) {
          childrenIndex.push(i)
        }
      }
      const len = childrenIndex.length // important!!!
      if (len > 0) {
        for (let i = 0; i < len; i++) {
          const childData = data[childrenIndex[i]]
          if (
              childData._childrenLen &&
              (!careFold || (careFold && !childData._isFold))
          ) {
            childrenIndex = childrenIndex.concat(
                this.getChildrenIndex(childData._level, childrenIndex[i], careFold))
          }
        }
      }
      return childrenIndex
    },
    isOverflow(parent, child) {
      var left = 200
      var op = child

      while (op && op != parent) {
        left += op.offsetLeft
        op = op.offsetParent
      }

      return ((left + child.offsetWidth) > parent.offsetWidth)
    },
    autoSizeColumn(column, tableFontSize, tableFontFamily) {
      let maxWidth = 0
      let widthCorrection = 0

      if (column.isTreeColumn === true) {
        widthCorrection += 45
      }

      this.table.bodyData.forEach(x => {
        let textWidth = textWidthHelper.getTextWidth(x[column.field + ''], tableFontSize + ' ' + tableFontFamily) + widthCorrection
        if (maxWidth < textWidth) { maxWidth = textWidth }
      })

      if (column.title) {
        let textWidth = textWidthHelper.getTextWidth(column.title, tableFontSize + ' ' + tableFontFamily) + 30
        if (maxWidth < textWidth) { maxWidth = textWidth }
      }

      if (column.colStyle == null) {
        column.colStyle = { width: maxWidth + 'px' }
      }

      if (column.minWidth != null && maxWidth <= column.minWidth) {
        maxWidth = column.minWidth
      }

      this.$set(column.colStyle, 'width', maxWidth + 'px')
    },
    handleEvent($event, type, data, others) {
      // const certainType = this.validateType(type, ['cell', 'row', 'checkbox', 'icon', 'radio'], 'handleEvent');
      // const eventType = $event ? $event.type : ''
      const { row, rowIndex, column, columnIndex } = data || { row: null, rowIndex: 0, column: null, columnIndex: 0 }
      const latestData = this.table.bodyData

      if (type === 'icon') {
        $event.stopPropagation()
        this.toggleStatus('Fold', row, rowIndex)
        const childrenIndex = this.getChildrenIndex(row._level, rowIndex)
        for (let i = 0; i < childrenIndex.length; i++) {
          this.toggleStatus('Hide', latestData[childrenIndex[i]], childrenIndex[i])
        }
        this.$emit('tree-icon-click', latestData[rowIndex], column, columnIndex, $event)
        return
      }

      if (type === 'columnPinnedLeft') {
        this.fixedLeftTableWidth = this.getLeftFixedTableWidth() + Number($event.replace('px', ''))
        return
      }

      if (type === 'columnUnpinnedLeft') {
        this.fixedLeftTableWidth = this.getLeftFixedTableWidth() - Number($event.replace('px', ''))
        return
      }

      if (type === 'columnPinnedRight') {
        this.fixedRightTableWidth = this.getRightFixedTableWidth() + Number($event.replace('px', ''))
        return
      }

      if (type === 'columnUnpinnedRight') {
        this.fixedRightTableWidth = this.getRightFixedTableWidth() - Number($event.replace('px', ''))
        return
      }

      if (type === 'columnMenu-setAutoColumnWidth') {
        let tableFontSize = window.getComputedStyle(this.$el, null).getPropertyValue('font-size')
        let tableFontFamily = window.getComputedStyle(this.$el, null).getPropertyValue('font-family')

        this.autoSizeColumn($event, tableFontSize, tableFontFamily)

        this.$emit('force-grid-store')
        return
      }

      if (type === 'columnMenu-setAutoAllColumnWidth') {
        let tableFontSize = window.getComputedStyle(this.$el, null).getPropertyValue('font-size')
        let tableFontFamily = window.getComputedStyle(this.$el, null).getPropertyValue('font-family')

        this.visibleColumns.forEach(column => {
          this.autoSizeColumn(column, tableFontSize, tableFontFamily)
        })

        this.fixedLeftTableWidth = this.leftFixedColumns.reduce((accumulator, currentValue) => {
          if (currentValue.hasOwnProperty('colStyle') && currentValue.colStyle.hasOwnProperty('width')) {
            return accumulator + parseFloat(currentValue.colStyle.width.replace('px', ''))
          }
          return accumulator
        }, 0) + (this.showSelection === true ? 30 : 0)

        this.fixedRightTableWidth = this.rightFixedColumns.reduce((accumulator, currentValue) => {
          if (currentValue.hasOwnProperty('colStyle') && currentValue.colStyle.hasOwnProperty('width')) {
            return accumulator + parseFloat(currentValue.colStyle.width.replace('px', ''))
          }
          return accumulator
        }, 0)

        this.$emit('force-grid-store')

        return
      }

      if (type === 'columnMenu-setVisibility') {
        this.$emit('force-grid-store')

        return
      }

      if (type === 'resetFilters') {
        if (this.customResetLogic === true) {
          this.$emit('reset-filters')
        } else {
          this.query = Object.assign(this.query, { filters: [], sort: [], offset: 0 })
          this.$emit('reset-filters')
        }
      }

      if (type === 'resetColumns') {
        this.$emit('resetColumns')
      }

      if (type === 'showColumnMenu') {
        let menuBtnEl = $event.target.getBoundingClientRect()
        let table = this.$refs.table
        let isOverflow = this.isOverflow(table, $event.target)

        this.columnMenu.selectedColumn = column
        this.columnMenu.top = table.getBoundingClientRect().top + 10
        this.columnMenu.left = isOverflow == false ? menuBtnEl.left - 10  : table.getBoundingClientRect().right - menuBtnEl.left - 15
        this.columnMenu.show = true
        this.columnMenu.isOverflow = isOverflow
      }

      if (type === 'toggleCheckAll') {
        const { isChecked } = others
        this.$parent.bodyData = this.$parent.bodyData.map(row => ({
          ...row,
          _isChecked: isChecked
        }))
      }

      if (type === 'rowDetailMounted') {
        const { height } = others
        this.setRowPropertyValue('rowDetailHeight', row, rowIndex, height)
      }

      if (type === 'checkbox') {
        const { isChecked } = others
        this.toggleStatus('Checked', row, rowIndex, isChecked)
        if (row._childrenLen > 0) {
          const childrenIndex = this.getChildrenIndex(row._level, rowIndex, false)
          for (let i = 0; i < childrenIndex.length; i++) {
            this.toggleStatus('Checked', latestData[childrenIndex[i]], childrenIndex[i], isChecked)
          }
        }
      }
    },
    toggleColumnMenu() {
      this.columnMenu.show = !this.columnMenu.show
    },
    getLeftFixedTableColumnWidth() {
      return this.leftFixedColumns.reduce((accumulator, currentValue) => {
        if (currentValue.hasOwnProperty('colStyle') && currentValue.colStyle.hasOwnProperty('width')) {
          return accumulator + parseFloat(currentValue.colStyle.width.replace('px', ''))
        }
        return accumulator
      }, 0) + (this.showSelection === true ? 30 : 0)
    },
    getRightFixedTableColumnWidth() {
      return this.rightFixedColumns.reduce((accumulator, currentValue) => {
        if (currentValue.hasOwnProperty('colStyle') && currentValue.colStyle.hasOwnProperty('width')) {
          return accumulator + parseFloat(currentValue.colStyle.width.replace('px', ''))
        }
        return accumulator
      }, 0)
    },
    getLeftFixedTableWidth() {
      let width = 0
      if (this.$refs['LeftFixedTableHeader'] != null && this.$refs['LeftFixedTableHeader'].length > 0) {
        let leftFixedColumnEl = this.$refs['LeftFixedTableHeader'][0]
        width = 0
        if (leftFixedColumnEl) {
          width = leftFixedColumnEl.offsetWidth || 0
        }
      }
      return this.getLeftFixedTableColumnWidth();
    },

    getRightFixedTableWidth() {
      let width = 0
      if (this.$refs['RightFixedTableHeader'] != null && this.$refs['RightFixedTableHeader'].length > 0) {
        let rightFixedColumnEl = this.$refs['RightFixedTableHeader'][0]
        width = 0
        if (rightFixedColumnEl) {
          width = rightFixedColumnEl.offsetWidth + this.verticalScrollWidthCorrection || 0
        }
      }
      return this.getRightFixedTableColumnWidth()
    },

    fireResizeEvent() {
      this.$nextTick(() => {
        let event = null

        if (typeof Event === 'function') {
          event = new Event('resize')
        } else {
          event = document.createEvent('Event')
          event.initEvent('resize', true, true)
        }

        window.dispatchEvent(event)
        event = null
      })
    },


  },
  created() {
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
    this.unsync && this.unsync()
    this.unsyncH && this.unsyncH()
  },
  mounted() {
    // this allows you to fix columns or `fixHeaderAndSetBodyMaxHeight` dynamically


    this.$watch(
        vm => [vm.useComplexMode, vm.isPending, vm.fixedLeftTableWidth, vm.fixedRightTableWidth],
        v => {
          if (v) {
            this.$nextTick(() => {
              window.removeEventListener('resize', this.handleResize)
              window.addEventListener('resize', this.handleResize)

              window.removeEventListener('DOMContentLoaded', this.handleResize)
              window.addEventListener('DOMContentLoaded', this.handleResize)
            })

            // console.log(this.$refs.wrappers);
            // synchronize vertical horizontal scrolling
            this.unsync && this.unsync()
            this.unsyncH && this.unsyncH()
            if (this.$refs.wrappers && this.$refs.wrappers[1] != null) {
              this.unsyncH = syncScroll(
                  [...this.$refs.wrappers[1].querySelectorAll('div[name$=TableBody]')],
                  () => {},
                  false
              )
            }

            if (
                this.$refs.wrappers &&
                this.$refs.wrappers.length > 1 &&
                this.$refs.wrappers[0] != null &&
                this.$refs.wrappers[1] != null
            ) {
              this.unsync = syncScroll(
                  [
                    this.$refs.wrappers[0].querySelector('div[name$=TableHeader]'),
                    this.$refs.wrappers[1].querySelector('div[name$=TableBody]')
                  ],
                  () => {},
                  true
              )
            }
          } else {
            this.unsync && this.unsync()
            this.unsyncH && this.unsyncH()
          }
        },
        { immediate: true }
    ),

        this.fixedLeftTableWidth = this.getLeftFixedTableColumnWidth();
    this.fixedRightTableWidth = this.getRightFixedTableColumnWidth();
  },
  updated() {
    if (this.isRedered == false) {
      let event = null

      if (typeof Event === 'function') {
        event = new Event('resize')
      } else {
        event = document.createEvent('Event')
        event.initEvent('resize', true, true)
      }

      window.dispatchEvent(event)
      event = null

      this.isRedered = true
    }
  },
  computed: {
    table() {
      return this.$parent
    },
    visibleColumns() {
      return this.$parent.headerColumns.filter(isColVisible)
    },
    leftFixedColumns() {
      return this.visibleColumns.filter(
          col => col.fixed && col.fixed !== 'right'
      )
    },
    rightFixedColumns() {
      return this.visibleColumns.filter(col => col.fixed === 'right')
    },
    hasFixedColumns() {
      return !!(this.leftFixedColumns.length + this.rightFixedColumns.length)
    },
    useComplexMode() {
      return !!(this.fixHeaderAndSetBodyMaxHeight || this.hasFixedColumns)
    },
    propsToNormalTable() {
      return { ...this.$props, columns: this.visibleColumns, resize: this.resize, fixedWidth: this.normalTableFixedWidth }
    },
    propsToLeftFixedTable() {
      return { ...this.$props, columns: this.leftFixedColumns, resize: this.resize }
    },
    propsToRightFixedTable() {
      return { ...this.$props, columns: this.rightFixedColumns, resize: this.resize }
    },
    mainTableWidth() {
      return (
          this.tableWidth - this.fixedLeftTableWidth - this.fixedRightTableWidth
      )
    },
    verticalScrollWidthCorrection() {
      return this.isVerticallScrollVisible ? 17 : 0
    },
    calcTableHeight() {
      return this.fullHeight != null
          ? this.tableHeight
          : this.fixHeaderAndSetBodyMaxHeight
    }
  }
}
</script>
<style>
/* @import  '~vue-context/dist/css/vue-context.css'; */

.column-draging-ghost{
  background-color: #ddd;
}

/* .column-dragging{
  background-color: #ddd;
} */

th span.-headerMenuBtn{
  position: absolute;
  right: 5px;
  cursor: pointer;
  opacity: 0.2;;
  transition: opacity 0.2s ease 0s, border 0.2s ease 0s;
}

th:hover span.-headerMenuBtn{
  opacity:1;
}
.-complex-table {
  position: relative;
  border: 1px solid #dddddd;
}

.-complex-table .table-bordered {
  border: none;
}

.-complex-table table {
  background: #fff;
}

thead tr th,
tbody tr td {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  position: relative;
}

.-table-header,
.-table-body,
.-table-footer {
  position: relative;
  overflow-y: hidden;
  overflow-x: hidden;
}

.mh-datatable table {
  table-layout: fixed;
}
.mh-datatable thead tr th, .mh-datatable tbody tr td {
  max-width: none;
}

.mh-datatable table{ margin: 0;}

.-table-header > .table-bordered {
  border: none;
}

.-complex-table .table-bordered > thead > tr > th {
  border: 1px solid #ddd;
  border-bottom: none;
}

.-table-header > .table-bordered > thead > tr > td {
  border-bottom-width: 0;
}

.-complex-table .table-bordered > tbody > tr > th,
.-complex-table .table-bordered > tbody > tr > td,
.-complex-table .table-bordered > tfoot > tr > td,
.-complex-table .table-bordered > tfoot > tr > th,
.-complex-table .table-bordered > thead > tr > td {
  border: 1px solid #ddd;
  border-top: none;
}

.-table-header > div, .-table-header table {
  border-bottom: 2px solid #dedede;
  background-color: #fafafa;
}

.-fixed-table {
  position: absolute;
  top: 0;
}
.-fixed-table table {
  width: auto;
}
.-left-fixed {
  box-shadow: 1px 0 5px #ddd;
  border-right: 1px solid #dddddd;
}
.-right-fixed {
  right: 0;
  box-shadow: -1px 2px 5px #ddd;
  border-left: 1px solid #dddddd;
}

.-cell-label-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  justify-content: space-between;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: reverse;
  -ms-flex-direction: row-reverse;
  flex-direction: row-reverse;
  width: 100%;
  align-items: center;
  height: 100%;
}

.-header-cell-label {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  overflow: hidden;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  text-overflow: ellipsis;
  -ms-flex-item-align: stretch;
  align-self: stretch;
}

.-cellText{
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.-cellMenu {
  padding-left: 4px;
  cursor: pointer;
  opacity: .2;
  -webkit-transition: opacity .2s ease 0s,border .2s ease 0s;
  transition: opacity .2s ease 0s,border .2s ease 0s;
}

th:hover span.-cellMenu{
  opacity:1;
}

.-cell-resize{
  width: 8px;
  height: 100%;
  right: -4px;
  top: 0;
  cursor: col-resize;
  position: absolute;
  z-index: 1;
}

.-cell-resize-R{
  left: -4px;
}

.tablePagination {
  border-top: none;
}
.spinner-text{
  text-align: center;
  color: #b4b4b4;
  margin-top: -10px;
  padding-bottom: 20px;
}
.spinner {
  margin: 20px auto;
  width: 100%;
  height: 50px;
  text-align: center;
  font-size: 15px;
}
.spinner > div {
  height: 100%;
  width: 4px;
  margin-left: 2px;
  display: inline-block;
  -webkit-animation: sk-stretchdelay 1.2s infinite ease-in-out;
  animation: sk-stretchdelay 1.2s infinite ease-in-out;
  background-color: rgb(180, 180, 180);
}
.spinner .rect2 {
  -webkit-animation-delay: -1.1s;
  animation-delay: -1.1s;
}
.spinner .rect3 {
  -webkit-animation-delay: -1s;
  animation-delay: -1s;
}
.spinner .rect4 {
  -webkit-animation-delay: -0.9s;
  animation-delay: -0.9s;
}
.spinner .rect5 {
  -webkit-animation-delay: -0.8s;
  animation-delay: -0.8s;
}
@-webkit-keyframes sk-stretchdelay {
  0%,
  100%,
  40% {
    -webkit-transform: scaleY(0.4);
  }
  20% {
    -webkit-transform: scaleY(1);
  }
}
@keyframes sk-stretchdelay {
  0%,
  100%,
  40% {
    transform: scaleY(0.4);
    -webkit-transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
    -webkit-transform: scaleY(1);
  }
}

.manualColumnResizerGuide {
  position: absolute;
  right: 0;
  top: 0;
  background-color: #34a9db;
  display: none;
  width: 0;
  border-right: 1px dashed #777;
  margin-left: 5px;
  height: 100%;
}

.manualColumnResizer {
  position: absolute;
  background-color: #34a9db;
  display: none;
  right: 0;
  top: 0;
  cursor: col-resize;
  z-index: 210;
  width: 5px;
  height: 37px;
}

/* TREE
*******************/
.mh-grid-btn-tree {
  position: absolute;
  padding: 0;
  padding-left: 4px;
  margin-top: -8px;
  top: 50%;
  width: 15px;
  height: 15px;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0;
  vertical-align: middle;
  cursor: pointer;
}
.mh-grid-tree-icon {
  position: absolute;
  margin-top: -7px;
  top: 50%;
  width: 22px;
  height: 14px;
  font-size: 0;
  vertical-align: middle;
}
.mh-grid-tree-icon i {
  display: inline-block;
  margin-left: 5px;
  width: 14px;
  height: 14px;
  background: url(data:image/png;base64,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)
  no-repeat -14px -35px;
}
.mh-grid-tree-button-collapse .mh-grid-btn-tree i {
  background-position: -43px -61px;
  width: 8px;
  height: 11px;
}
.mh-grid-tree-button-collapse .mh-grid-tree-icon i {
  margin-left: 4px;
  background-position: -39px -35px;
  width: 14px;
  height: 14px;
}
.mh-grid-tree-button-expand .mh-grid-btn-tree i {
  margin-top: 2px;
  background-position: -15px -63px;
  width: 11px;
  height: 8px;
}
.mh-grid-tree-button-expand .mh-grid-tree-icon i {
  margin-left: 4px;
  background-position: -65px -35px;
  height: 14px;
  width: 14px;
}

.mh-grid-tree-wrapper-relative {
  display: table;
  position: relative;
  margin: -1px 0;
  height: 100%;
  width: 100%;
}
.mh-grid-tree-wrapper-valign-center {
  display: table-cell;
  vertical-align: middle;
}
.mh-grid-tree-extra-content {
  position: absolute;
  margin-left: 4px;
  top: 0;
  left: 0;
  bottom: 0;
}
.mh-grid-tree-depth {
  display: inline-block;
  position: absolute;
  width: 22px;
  top: 0;
  bottom: 0;
}
.mh-grid-tree-depth i {
  display: inline-block;
  background: url(data:image/png;base64,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)
  no-repeat;
}

/* REORDER CUE */

.mh-drag-clue {
  padding: 2px 4px;
  position: fixed;
  border-width: 1px;
  border-style: solid;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  cursor: move
}

.mh-drag-status {
  margin-right: .4ex
}

.mh-reorder-cue {
  position: absolute;
  display: none;
}

.mh-drag-clue {
  position: fixed;
  display: none;
}

.mh-reorder-cue::after,
.mh-reorder-cue::before {
  content: "";
  width: 0;
  height: 0;
  border: 3px solid transparent;
  position: absolute;
  -webkit-transform: translateX(-50%);
  -ms-transform: translateX(-50%);
  transform: translateX(-50%)
}

.mh-reorder-cue::before {
  border-bottom-width: 0;
  border-top-color: currentColor;
  top: -4px
}

.mh-reorder-cue::after {
  border-top-width: 0;
  border-bottom-color: currentColor;
  bottom: -4px
}

.mh-drag-clue {
  display: none;
  overflow: hidden;
  border-color: rgba(0, 0, 0, 0.13);
  background-color: #f9f9f9;
  border-radius: 2px;
  box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
  border: 1px solid #e2e2e2;
  color: rgba(0, 0, 0, 0.68);
  font-weight: 700;
  font-size: 12px;
  font-family: Roboto,sans-serif;
  padding: 4px 8px;
}

.mh-drag-clue.active{
  display: block;
}

.table-clomuns-allFixed{
  width: auto !important;
}

</style>
