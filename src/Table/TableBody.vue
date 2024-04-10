<template>
  <tbody>
    <template v-if="this.$parent.$parent.$parent.bodyData.length">
      <template v-for="(row, rowIndex) in this.$parent.$parent.$parent.bodyData">
        <tr
        v-show="!row._isHide"
        :key="'table_row_' + rowIndex"
        :style="rowStyle(row)"
        :class="rowClass(row)"
        :ref="'row_'+rowIndex.toString()"
        v-resize.initial="(el) => handleRowResize(rowIndex, el)"
        >
          <td class="-selectable-column" v-if="shouldRenderSelection">
            <multi-select
              :status="getCheckboxStatus(row, rowIndex)"
              :value="row._isChecked"
              @onChange="checked => handleEvent(null, 'checkbox',  { row, rowIndex }, { isChecked: checked })" />
          </td>

          <!-- v-tippy="{ arrow : true, interactive : true,  duration: 0, trigger: 'manually' }"
          @mouseenter="onTippyMouseEnter"
          @mouseleave="onTippyMouseLeave" -->

          <td v-for="(col, colIndex) in tableColumns" :key="colIndex"

            :class="col.tdClass"
            :title="row[col.field]"
            :style="[col.tdStyle, { width: col.colStyle.width }]"
            >
            <!-- <td> component (tdComp) -->
            <template v-if="col.isTreeColumn">
              <div class="mh-grid-tree-wrapper-valign-center" :style="[ { paddingLeft: (row._level + ((row._isFold == true && row._childrenLen > 0) ? 1 : 1 )) * 22 + 'px'} ]">
                <div :class="{'mh-grid-tree-extra-content' : true , 'mh-grid-tree-button-expand':  row._childrenLen > 0 && row._isFold == false , 'mh-grid-tree-button-collapse':  row._childrenLen > 0 && row._isFold == true  }">
                  <span class="mh-grid-tree-depth">
                    <button
                      class="mh-grid-btn-tree"
                      :style="[ { left: (row._level - 1) * 22 + 'px'} ]"
                      @click="handleEvent($event, 'icon', { row, rowIndex, col, colIndex }, { isFold: row._isFold })">
                      <i></i>
                    </button>
                  </span>
                  <span class="mh-grid-tree-icon" :style="[ { left: row._level  * 22 + 'px'} ]">
                    <i></i>
                  </span>
                </div>
                <div class="mh-grid-cell-content">
                  <component
                      v-if="col.tdComp"
                      :is="forDynCompIs(col.tdComp)"
                      :row="row"
                      :field="col.field"
                      :options="col.options ? col.options : null"
                      :value="resolvePath(row, col.field, null)"
                      :nested="row.__nested__"
                      v-bind="$props">
                  </component>
                  <template v-else>
                    {{ resolvePath(row, col.field, null)}}
                  </template>
                </div>
              </div>
            </template>
            <component
              v-else-if="col.tdComp"
              :is="forDynCompIs(col.tdComp)"
              :row="row"
              :field="col.field"
              :options="col.options ? col.options : null"
              :value="resolvePath(row, col.field, null)"
              :nested="row.__nested__"
              v-bind="$props">
            </component>
            <template v-else>
              {{ resolvePath(row, col.field, null)}}
            </template>
          </td>
        </tr>
        <!-- <transition name="fade" :key="rowIndex"> -->
          <tr :key="rowIndex" v-if="row.__nested__ && row.__nested__.visible && !leftFixed && !rightFixed ">
            <td :colspan="colLen">
              <!-- nested component -->
              <component
                :is="forDynCompIs(row.__nested__.comp)"
                :row="row"
                :nested="row.__nested__"
                @rowDetailMounted="handleRowDetailMounted($event,  { row, rowIndex })"
                v-bind="$props">
              </component>
            </td>
          </tr>
          <tr :key="rowIndex" v-else-if="row.__nested__ && row.__nested__.visible" :style="{ height: row._rowDetailHeight + 1 + 'px' }">
             <td :colspan="colLen">
             </td>
          </tr>
        <!-- </transition> -->

      </template>
    </template>
    <tr
        v-else-if="!leftFixed && !rightFixed">
      <td :colspan="colLen" class="text-center text-muted">
        {{ $i18nForDatatable('No Data') }}
      </td>
    </tr>
  </tbody>
</template>
<script>
import MultiSelect from './MultiSelect.vue'
import props from '../_mixins/props'
import shouldRenderSelection from '../_mixins/shouldRenderSelection'
import isColVisible from '../_utils/isColVisible'
import resize from 'vue-resize-directive'

export default {
  name: 'TableBody',
  components: { MultiSelect },
  mixins: [props, shouldRenderSelection],
  directives: { resize },
  data() {
    return {
      detailRowHeight: 0,
      rowsHeights: []
    }
  },
  methods: {
    rowStyle(row) {
      if (this.xprops && Object.hasOwn(this.xprops, 'rowStyle')) return this.xprops.rowStyle(row)
      return null
    },
    rowClass(row) {
      if (this.xprops && Object.hasOwn(this.xprops, 'rowClass')) return this.xprops.rowClass(row)
      return null
    },
    resolvePath (object, path, defaultValue) {
      if (path != null) {
        return path.split('.').reduce((o, p) => o ? o[p] : defaultValue, object)
      } else {
        return defaultValue
      }
    },
    // TODO: Refactor to mixin
    onTippyMouseEnter(e) {
      if (e.target._tippy != null && (e.target.offsetWidth < e.target.scrollWidth)) {
        e.target._tippy.show()
      }
    },
    onTippyMouseLeave(e, vNode) {
      if (e.target._tippy != null && (e.target.offsetWidth < e.target.scrollWidth)) {
        e.target._tippy.hide()
      }
    },
    handleRowDetailMounted(e, data) {
      this.handleEvent(e, 'rowDetailMounted', data, {height: e.height})
    },
    handleEvent($event, type, data, others) {
      this.$emit('handle-event', $event, type, data, others)
    },
    getCheckboxStatus(row, rowIndex) {
      let allCheck
      let childrenIndex
      const hasChildren = row._childrenLen > 0
      if (hasChildren) {
        childrenIndex = this.$parent.$parent.getChildrenIndex(row._level, rowIndex, false)
        allCheck = true
        for (let i = 0; i < childrenIndex.length; i++) {
          if (!this.table.bodyData[childrenIndex[i]]._isChecked) {
            allCheck = false
            break
          }
        }
      } else {
        allCheck = row._isChecked
      }
      let indeterminate = false
      if (hasChildren && !allCheck) {
        for (let i = 0; i < childrenIndex.length; i++) {
          if (this.table.bodyData[childrenIndex[i]]._isChecked) {
            indeterminate = true
            break
          }
        }
      }

      return {allCheck, indeterminate}
    },
    handleRowResize(rowIndex, el) {
      const eventName = 'row-height-resize'
      const height = el.getBoundingClientRect().height
      const indexOf = this.rowsHeights.findIndex(x => x.rowIndex === rowIndex)
      const rowHeight = { rowIndex, height }
      if (indexOf > -1) {
        if (this.rowsHeights[indexOf].height < height) {
          this.rowsHeights[indexOf].height = height
          this.$emit(eventName, rowHeight)
        }
      } else {
        this.rowsHeights.push(rowHeight)
        this.$emit(eventName, rowHeight)
      }
    },
    setRowHeight(rowHeight, context) {
      if (rowHeight) {
        const rowKey = `row_${rowHeight.rowIndex}`
        const actualHeight = this.$refs[rowKey][0].clientHeight
        if (actualHeight < rowHeight.height) {
          this.$refs[rowKey][0].style.height = `${rowHeight.height}px`
        }
      }
    }
  },
  computed: {
    detailRowComputeHeight() {
      return this.detailRowHeight
    },
    table() {
      return this.$parent.$parent.$parent
    },
    colLen () {
      let columnLength = this.tableColumns.length

      if (this.leftFixed && this.showSelection) {
        columnLength += 1
      }

      return columnLength
    },
    tableColumns() {
      if (this.leftFixed) {
        return this.$parent.$parent.$parent.headerColumns.filter(col => isColVisible(col) && (col.fixed === true || col.fixed === 'left'))
      } else if (this.rightFixed) {
        return this.$parent.$parent.$parent.headerColumns.filter(col => isColVisible(col) && col.fixed === 'right')
      } else {
        return this.$parent.$parent.$parent.headerColumns.filter(col => isColVisible(col) && (col.fixed !== true && col.fixed !== 'left' && col.fixed !== 'right'))
      }
    }
  }
}
</script>

<style scoped>
.mh-datatable tbody tr td {
    vertical-align: middle;
    max-height: 37px;
    height: 37px;
    padding-right: 8px;
    padding-left: 8px;
    padding-top: 0;
    padding-bottom: 0;
}
/* .mh-datatable tbody tr {
    transition: transform 0.4s, top 0.4s, height 0.4s, background-color 0.1s, opacity 0.2s, visibility 0.5s;
} */
</style>
<style>
.resize-sensor {
  display: none;
}
</style>
