<template>
  <div name="Datatable" class="mh-datatable">
    <div v-if="$slots.default || HeaderSettings" class="clearfix" style="margin-bottom: 10px">
      <header-settings v-if="HeaderSettings" class="pull-right"
        :columns="columns" :support-backup="supportBackup">
      </header-settings>
      <slot />
    </div>

    <tbl v-bind="$props" :isPending="isPending" v-on:force-grid-store="handleGridStore" v-on:resetColumns="handleResetColumns" v-on:reset-filters="handleResetFilters" />
    
    <div class="mh-reorder-clue mh-drag-clue" style="position: fixed; z-index: 20000; left: 224.656px; top: 307.656px;"><span class="k-icon k-drag-status k-i-cancel"></span>Ship Name</div>

    <div v-if="Pagination" class="tablePagination">
      <div class="tablePagination-wrap">
        <div class="column">
          <pagination class="pull-left" :total="bodyTotal" :query="query" />
        </div>
        <div class="column">
          <page-size-select :query="query" :page-size-options="pageSizeOptions" />
        </div>
        <div class="column flex-right" style="white-space: nowrap">
          <button v-if="showSaveGridViewButton" @click.prevent="exportGridSettingsToJson" class="mh-button-saveView"><span class="mh-icon icon-floppy"></span></button>   
          <button @click.prevent="handleRefreshEvent" class="mh-button-refresh"><span class="mh-icon icon-arrows-ccw"></span></button>  
        </div>
        <div class="column" >
          {{ $i18nForDatatable('Total') }} {{ bodyTotal }} 
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import HeaderSettings from './HeaderSettings/index.vue'
import Tbl from './Table/index.vue'
import Pagination from './Pagination.vue'
import PageSizeSelect from './PageSizeSelect.vue'
import props from './_mixins/props'
import keyGen from './_utils/keyGen'
import isColVisible from './_utils/isColVisible'

import { stringify, saveToLS, getFromLS } from './_utils/localstorage'

export default {
  name: 'Datatable',
  mixins: [props],
  components: { HeaderSettings, Tbl, Pagination, PageSizeSelect },
  created() {
    // init query (make all the properties observable by using `$set`)
    let q = null
    let backcup = null

    if (this.supportBackup === true && this.gridName != null && this.gridName != '') {
      backcup = getFromLS(this.storageKey)
      if (backcup != null && backcup.query != null) {
        q = backcup.query
        this.headerColumns = backcup.columns 
      }
    }

    if (!q) {
      q = { limit: 20, offset: 0, sort: [], filters: [], ...this.query }
    } 

    Object.keys(q).forEach(key => { this.$set(this.query, key, q[key]) })

    // if(this.dataSource != null && this.dataSource.read != null){
    //     this.$http.get(this.dataSource.read).then((response) {
    //       this.data = response.data;
    //     });
    // }
  },
  updated() {
    this.isFirstInit = false
  },
  methods: {
    isColVisible,
    exportTableSettingsToJson() {
      let gridData = JSON.stringify({
        columns: this.headerColumns,
        query: this.query
      })
      this.$emit('table-settings-exported', gridData)
      return gridData
    },
    handleRefreshEvent() {
      if (this.hasDatasource && this.hasDatasource.read) {
        this.query.offset = 0
        this.loadData(this.query)
      } else {
        this.$emit('datasource-refresh')
      }
    },
    getBodyData(data, isTreeType, childrenProp, isFold, supportNested, level = 1) {
      const MAGIC_FIELD = '__nested__'
      let bodyData = []
      
      data.forEach((row, index) => {
        const children = row[childrenProp]
        const childrenLen = Object.prototype.toString.call(children).slice(8, -1) === 'Array' ? children.length : 0

        let item = Object.assign({}, row, {
          _isHover: false,
          _isExpanded: row._isExpanded != null ? row._isExpanded : false,
          _isChecked: row._isChecked != null ? row._isChecked : false,
          _level: level,
          _isHide: isFold ? level !== 1 : false,
          _isFold: isFold,
          _childrenLen: childrenLen,
          _normalIndex: index + 1,
          _rowDetailHeight: 0
        })

        if (supportNested) {
          if (!item[MAGIC_FIELD]) {
            this.$set(item, MAGIC_FIELD, {
              comp: undefined, // current nested component
              visible: false,
              $toggle (comp, visible) {
                switch (arguments.length) {
                  case 0:
                    this.visible = !this.visible
                    break
                  case 1:
                    switch (typeof comp) {
                      case 'boolean':
                        this.visible = comp
                        break
                      case 'string':
                      case 'object':
                        this.comp = comp
                        this.visible = !this.visible
                        break
                    }
                    break
                  case 2:
                    this.comp = comp
                    this.visible = visible
                    break
                }
              }
            })
            if (supportNested === 'accordion') {
              this.$watch(
                () => item[MAGIC_FIELD],
                nested => {
                  // only one nested component can be expanded at the same time
                  if (data.filter(item => item[MAGIC_FIELD].visible).length < 2) return

                  data.forEach(item => {
                    if (item[MAGIC_FIELD].visible && item[MAGIC_FIELD] !== nested) {
                      item[MAGIC_FIELD].visible = false
                    }
                  })
                },
                { deep: true }
              )
            }
          }
        }

        bodyData.push(item)

        if (isTreeType) {
          if (childrenLen > 0) {
            bodyData = bodyData.concat(this.getBodyData(children, true, childrenProp, isFold, supportNested, level + 1))
          }
        }
      })
      return bodyData
    },
    loadData(query) {  
      if (this.dataSource != null && typeof this.dataSource === 'object') {
        if (this.dataSource.read != null && typeof this.dataSource.read === 'function') {
          let queryObject = query || this.query
          this.isPending = true

          this.$emit('data-loading')

          this.dataSource.read({
            params: {
              pq_filter: JSON.stringify(queryObject.filters),
              pq_sort: JSON.stringify(queryObject.sort),
              pq_curPage: Math.ceil(+queryObject.offset / +queryObject.limit) + 1,
              pq_rPP: queryObject.limit
            }
          })
            .then((response) => {
              let normalizedResult = typeof this.dataSource.normalizeResponseCallback === 'function' ? this.dataSource.normalizeResponseCallback(response) : response
              this.bodyData = this.getBodyData(normalizedResult.rows, true, 'children', true, this.supportNested)
              this.bodyTotal = normalizedResult.total
            })
            .catch((e) => {
              console.error(e)
            })
            .finally(() => {
              this.$emit('data-loaded')
              this.isPending = false
            })
        }
      }
    },
    handleGridStore() {
      saveToLS(this.storageKey, { query: this.query, columns: this.headerColumns })
    },
    handleResetFilters() {
      this.$emit('reset-filters')
    },
    handleResetColumns() {
      let filteredColumnsFields = this.headerColumns.filter(x => x.isFilterApplied === true).map(x => x.field) || []
      this.headerColumns = []

      this.columns.forEach((x, i) => {
        let item = Object.assign({}, JSON.parse(JSON.stringify(x)), {
          index: i,
          isFilterApplied: filteredColumnsFields.indexOf(x.field) !== -1
        })

        if (!item.hasOwnProperty('colStyle')) {
          item.colStyle = {
            width: 'auto'
          }
        } else if (!item.colStyle.hasOwnProperty('width')) {
          item.colStyle.width = 'auto'
        }

        this.headerColumns.push(item)
      })
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
    }
  },
  data() {
    return {
      isFirstInit: true,
      isPending: false,
      storageKey: this.supportBackup === true ? keyGen(stringify(this.columns)) + '-' + this.gridName : '',
      bodyData: [],
      bodyTotal: 0,
      headerColumns: []
    }
  },
  computed: {
    hasDatasource() {
      return this.dataSource != null && typeof this.dataSource === 'object'
    },
    colWidth() {
      let columnswidth = this.headerColumns.filter(isColVisible).reduce((accumulator, currentValue) => {
        if (currentValue.hasOwnProperty('colStyle') 
          && currentValue.colStyle.hasOwnProperty('width') 
          && (currentValue.hasOwnProperty('fixed') === false || (currentValue.fixed == false))
        ) {
          return accumulator + parseFloat(currentValue.colStyle.width.replace('px', ''))
        }
        return accumulator
      }, 0)

      return columnswidth
    } 
  },
  mounted() {
  },
  watch: {
    columns: {
      handler (newColumns) {
        this.headerColumns = []

        newColumns.forEach((x, i) => {

          let item = Object.assign({
            colStyle: {
              width: 'auto'
            },
          }, JSON.parse(JSON.stringify(x)), {
            index: i,
            isFilterApplied: false
          })
          if (this.query?.filters) {
            let filteredColumn = this.query.filters.find(filter => filter.dataIndx === item.field)
            if (filteredColumn) {
              this.$set(item, 'isFilterApplied', true)
            } else if (item.isFilterApplied !== false) {
              this.$set(item, 'isFilterApplied', false)
            }
          }
          this.headerColumns.push(item)
        })
      },
      immediate: true,
      deep: true
    },
    headerColumns: {
      handler(updatedColumns) {
        if (this.supportBackup && !this.isFirstInit && this.gridName != null && this.gridName != '') {
          saveToLS(this.storageKey, { query: this.query, columns: updatedColumns })
        }

        this.$emit('updateColumns', updatedColumns)
        this.fireResizeEvent()
      }
    },
    total: {
      handler (value) {
        this.bodyTotal = value
      },
      immediate: true
    },
    pending: {
      handler (status) {
        this.isPending = status
      },
      immediate: true
    },
    query: {
      handler (state) {
        if (this.dataSource != null && typeof this.dataSource === 'object') {
          this.loadData(state)
        }

        this.headerColumns.forEach(column => {
          let filteredColumn = state.filters.find(filter => filter.dataIndx === column.field)
          if (filteredColumn) {
            this.$set(column, 'isFilterApplied', true) 
          } else if (column.isFilterApplied !== false) {
            this.$set(column, 'isFilterApplied', false) 
          }
        })

        if (this.supportBackup && !this.isFirstInit && this.gridName != null && this.gridName != '') {
          saveToLS(this.storageKey, { query: this.query, columns: this.headerColumns })
        }
      },
      deep: true
    },
    data: {
      handler (data) {
        const { supportNested } = this
        this.bodyData = this.getBodyData(data, true, 'children', true, supportNested)
        this.fireResizeEvent()
      },
      immediate: true
    }
  }
}
</script>
<style>

@import "./_assets/style/mh-grid.css";

.break {
  flex-basis: 100%;
  height: 0;
}

.tablePagination-wrap {
  display: flex;
  flex-direction: row;
  flex-basis: auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.flex-right {
  margin-left: auto;
}

/* transition effect: fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-active {
  opacity: 0;
}
.tablePagination {

  color: #444;
  background-color: #fafafa;
  border-color: #e6e6e6;
  line-height: 1.286em;
  padding: 10px 15px;
  border-width: 1px 0 0;
  clear: both;
  overflow: hidden;
  position: relative;
  border-style: solid;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  border-left: 1px solid rgba(0, 0, 0, 0.125);
  border-right: 1px solid rgba(0, 0, 0, 0.125);
}

.tablePagination ul.pagination .page-item a {
  border-radius: 0;
}

.grid-pagination-total{
  padding-top: 9px;
}

.mh-datatable thead{
  border-color: #e6e6e6;
  color: #444;
  background-color: #fafafa;
}
.mh-datatable thead th {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-columns-auto{
  width: 100%;
}

.tooltip {
  display: block !important;
  z-index: 10000;
}

.tooltip .tooltip-inner {
  background: black;
  color: white;
  border-radius: 16px;
  padding: 5px 10px 4px;
}

.tooltip .tooltip-arrow {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
  border-color: black;
  z-index: 1;
}

.tooltip[x-placement^="top"] {
  margin-bottom: 5px;
}

.tooltip[x-placement^="top"] .tooltip-arrow {
  border-width: 5px 5px 0 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  bottom: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="bottom"] {
  margin-top: 5px;
}

.tooltip[x-placement^="bottom"] .tooltip-arrow {
  border-width: 0 5px 5px 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="right"] {
  margin-left: 5px;
}

.tooltip[x-placement^="right"] .tooltip-arrow {
  border-width: 5px 5px 5px 0;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  left: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[x-placement^="left"] {
  margin-right: 5px;
}

.tooltip[x-placement^="left"] .tooltip-arrow {
  border-width: 5px 0 5px 5px;
  border-top-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  right: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip.popover .popover-inner {
  background: #f9f9f9;
  color: black;
  padding: 24px;
  border-radius: 5px;
  box-shadow: 0 5px 30px rgba(black, .1);
}

.tooltip.popover .popover-arrow {
  border-color: #f9f9f9;
}

.tooltip[aria-hidden='true'] {
  visibility: hidden;
  opacity: 0;
  transition: opacity .15s, visibility .15s;
}

.tooltip[aria-hidden='false'] {
  visibility: visible;
  opacity: 1;
  transition: opacity .15s;
}

</style>
