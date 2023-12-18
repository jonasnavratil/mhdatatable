<template :key="Date.now()">
  <div
      class="mh-column-menu"
      :class="{'mh--overflow': isOverflow}"
      :style="{ top: top + 'px', left: isOverflow == false ? left + 'px' : 'auto', right: isOverflow ? left + 'px' : 'auto' }"
      v-show="show"
  >
    <header ref="tabHeader" class="mh-tab-herader">
          <span @click="selectTab($event,'setting')" class="mh-tab" :class="{ 'mh-tab-selected' : selectedTabName === 'setting' }">
            <span class="mh-icon icon-menu-1" unselectable="on"></span>
          </span>
      <span v-if="hasColumnFilter" @click="selectTab($event,'filter')" class="mh-tab" :class="{ 'mh-tab-selected' : selectedTabName === 'filter' }">
            <span class="mh-icon icon-filter" unselectable="on"></span>
          </span>
      <span  @click="selectTab($event,'columns')" class="mh-tab" :class="{ 'mh-tab-selected' : selectedTabName === 'columns' }">
            <span class="mh-icon icon-menu-1 vertical" unselectable="on"></span>
          </span>
    </header>
    <main>
      <ul v-if="selectedTabName === 'setting'" class="mh-menu mh-control">
        <li class="mh-menu__item">
          <span class="cIcon left mh-icon icon-pin"></span>
          <span class="cName">{{ $i18nForDatatable('Pin Column') }}</span>
          <span class="cIcon mh-icon icon-right-open"></span>
          <ul class="mh-menu--submenu">
            <li @click="pinColumnLeft($event)" class="mh-menu__item">
              <span class="cIcon left mh-icon" :class="{ 'icon-check-1': isColumnPinnedLeft}"></span>
              <span class="cName">{{ $i18nForDatatable('Pin left') }}</span>
            </li>
            <li @click="pinColumnRight($event)" class="mh-menu__item" >
              <span class="cIcon left mh-icon" :class="{ 'icon-check-1': isColumnPinned && !isColumnPinnedLeft}"></span>
              <span class="cName">{{ $i18nForDatatable('Pin right') }}</span>
            </li>
            <li v-if="isColumnPinned" @click="cencelPin($event)" class="mh-menu__item">
              <span class="cName">{{ $i18nForDatatable('No pin') }}</span>
            </li>
          </ul>
        </li>
        <li class="mh-menu__item mh-separator--top" @click="setColumnAutoWidth($event)">
          <span class="cName">{{ $i18nForDatatable('Auto size This Column') }}</span>
        </li>
        <li class="mh-menu__item" @click="setAllColumnAutoWidth($event)">
          <span class="cName">{{ $i18nForDatatable('Auto size All Columns') }}</span>
        </li>
        <li class="mh-menu__item mh-separator--top" @click="resetColumns($event)">
          <span class="cName">{{ $i18nForDatatable('Reset columns') }}</span>
        </li>
        <li class="mh-menu__item mh-separator--top" @click="resetFilters($event)">
          <span class="cName">{{ $i18nForDatatable('Reset all filters') }}</span>
        </li>
      </ul>
      <div v-if="selectedTabName === 'columns'" class="mh-menu mh-control mh-column-list-wrap">
        <ul class="mh-menu--submenu mh-column-list">
          <li v-for="(col,index) in columns" :key="index" class="mh-menu__item">
            <checkbox :status="{ checked: isColVisible(col) }" :title="col.title" @onChange="handleColumnVisibilityChange(col, $event)" :label="col.title"></checkbox>
          </li>
        </ul>
      </div>
      <component
          v-else-if="selectedTabName === 'filter' && selectedColumn != null && !selectedColumn.isFilterDisabled  && selectedColumn.hasOwnProperty('thComp')"
          ref="dynamicFilterContent"
          :is="forDynCompIs(selectedColumn.thComp)"
          :key="key"
          :column="selectedColumn"
          :columns="columns"
          :query="query"
          :xprops="xprops"
          :field="selectedColumn.field"
          :title="selectedColumn.title"
          @close-column-menu="close"
      ></component>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<script>

import isColVisible from '../_utils/isColVisible'
import Checkbox from '../Checkbox'
import props from '../_mixins/props'

export default {
  name: 'columnMenu',
  components: {Checkbox},
  mixins: [props],
  props: {
    selectedColumn: {
      type: Object,
      required: false
    },
    columns: {
      type: Array,
      required: true
    },
    show: {
      type: Boolean,
      required: true
    },
    top: {
      type: Number,
      required: true
    },
    left: {
      type: Number,
      required: true
    },
    isOverflow: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  methods: {
    close() {
      this.$emit('update:show', false)
    },
    selectTab($event, tabName) {
      if (this.selectedTabName === tabName) {
        this.$emit('update:show', false)
      }
      this.selectedTabName = tabName
    },
    resetColumns() {
      this.$emit('reset-columns')
      this.$emit('update:show', false)
      this.$emit('force-grid-resize')
    },
    resetFilters() {
      this.$emit('reset-filters')
      this.$emit('update:show', false)
      this.$emit('force-grid-resize')
    },
    setAllColumnAutoWidth() {
      //if (this.selectedColumn.hasOwnProperty('colStyle') && this.selectedColumn.colStyle.hasOwnProperty('width')) {
      this.$emit('set-auto-allColumns-width', this.selectedColumn)
      this.$emit('update:show', false)
      this.$emit('force-grid-resize')
      //}
    },
    setColumnAutoWidth() {
      //if (this.selectedColumn.hasOwnProperty('colStyle') && this.selectedColumn.colStyle.hasOwnProperty('width')) {
      //this.selectedColumn.colStyle.width = 'auto'
      this.$emit('set-auto-column-width', this.selectedColumn)
      this.$emit('update:show', false)
      this.$emit('force-grid-resize')
      //}
    },
    cencelPin() {
      if (this.selectedColumn.fixed === 'left') {
        this.$emit('column-unpinned-left', this.selectedColumn.colStyle.width)
      }

      if (this.selectedColumn.fixed === 'right') {
        this.$emit('column-unpinned-right', this.selectedColumn.colStyle.width)
      }

      this.$set(this.selectedColumn, 'fixed', false)

      this.$emit('update:show', false)
      this.$emit('force-grid-resize')
    },
    pinColumnLeft() {
      this.$set(this.selectedColumn, 'fixed', 'left')
      this.$emit('column-pinned-left', this.selectedColumn.colStyle.width)
      this.$emit('update:show', false)
      this.$emit('force-grid-resize')
    },
    pinColumnRight() {
      this.$set(this.selectedColumn, 'fixed', 'right')
      this.$emit('column-pinned-right', this.selectedColumn.colStyle.width)
      this.$emit('update:show', false)
      this.$emit('force-grid-resize')
    },
    handleColumnVisibilityChange (col, isChecked) {
      this.$set(col, 'visible', isChecked)
      this.$emit('column-set-visibility')
      this.$emit('force-grid-resize')
    },
    eventEndHandler (evt) {
      if (this.$el !== evt.target && !this.$el.contains(evt.target) && this.show === true) {
        this.$emit('update:show', false)
      }
    },
    optionSelected(e, option) {
      this.$emit('option-selected', e, option)
    },
    uuidGen (key) {
      // $vm._uid is a private property of a Vue instance
      return `-col-${this._uid}-${key}`
    },
    apply () {
      this.changes.forEach(({ col, isChecked }) => {
        this.$set(col, 'visible', isChecked)
      })
      this.changes = [] // don't forget to clear the stack
    },
    isColVisible
  },
  computed: {
    hasColumnFilter() {
      return this.selectedColumn && this.selectedColumn.hasOwnProperty('thComp') && !this.selectedColumn.isFilterDisabled
    },
    hasColumnFixedWidth() {
      return this.selectedColumn != null && this.selectedColumn.hasOwnProperty('colStyle') && this.selectedColumn.colStyle.hasOwnProperty('width') && this.selectedColumn.colStyle.width !== 'auto'
    },
    isColumnPinned() {
      if (this.selectedColumn != null && this.selectedColumn.hasOwnProperty('fixed') && (this.selectedColumn.fixed == true || this.selectedColumn.fixed == 'left' || this.selectedColumn.fixed == 'right')) {
        return true
      }
      return false
    },
    isColumnPinnedLeft() {
      if (this.selectedColumn != null && this.selectedColumn.hasOwnProperty('fixed') && (this.selectedColumn.fixed == true || this.selectedColumn.fixed == 'left')) {
        return true
      }
      return false
    }
  },
  watch: {
    selectedColumn: {
      handler (newValue) {
        this.key = Date.now();
        this.selectedTabName = this.selectedTabName === 'filter' && this.hasColumnFilter === false ? 'setting' : this.selectedTabName
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints
    this._touchEvent = touchSupport ? 'touchend' : 'click'
    document.body.addEventListener(this._touchEvent, this.eventEndHandler)
  },
  beforeDestroy() {
    document.body.removeEventListener(this._touchEvent, this.eventEndHandler)
  },
  data() {
    return {
      selectedTabName: 'filter',
      changes: [],
      key: Date.now()
    }
  }
}
</script>

<style>

.mh-tab-herader{
  background: #f5f7f7;
  min-width: 220px;
  width: 100%;
  display: flex;
  border-bottom: 1px solid #e4e4e4;
}

.mh-tab{
  display: flex;
  border-bottom: 2px solid transparent;
  height: 16px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: solid transparent;
  border-width: 1px 1px 0;
  margin: 4px 4px 0;
  padding: 4px 8px;
  box-sizing: content-box;
  margin-bottom: -2px;
  cursor: pointer;
}

.mh-tab.mh-tab-selected {
  background-color: #fff;
  border-color: #e4e4e4;
  border-bottom: 2px solid #fff;
}

.cIcon{
  margin-left: 16px;
  margin-right: 0;
  position: absolute;
  right: 8px;
  height: 36px;
  line-height: 36px;
}

.cIcon.left{
  margin-left: 0px;
  margin-right: 0;
  position: absolute;
  left: 8px;
  height: 36px;
  line-height: 36px;
}

.cName{
  padding-left: 0px;
}

.mh-control {
  box-sizing: border-box;
}

.mh-column-menu {
  position: fixed;
  min-width: 120px;
  max-width: 230px;
  height: auto;
  z-index: 999;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)
}

.mh-column-menu main {
  max-width: 230px;
  padding-top: 5px;
  padding-bottom: 0px;
  background: #fff;
}

.mh-column-menu main .mh-menu.mh-column-list-wrap {
  max-height: 400px;
  overflow-y: auto;
  text-overflow: ellipsis;
}

.mh-column-menu ul {
  background-color: #fff;
  color: rgba(0, 0, 0, 0.87);
  font-weight: normal;
  list-style-image: none;
  list-style-position: outside;
  list-style-type: none;
  margin: 0;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-size: 14px;
  padding: 0px 0;
  border: none;
  border-radius: 0;
  min-width: 120px;
  background-color: white;
}

.mh-column-menu ul .mh-menu__item {
  cursor: pointer;
  position: relative;
  height: 36px;
  line-height: 36px;
  padding: 0 16px;
  text-overflow: ellipsis;
}

.mh-column-menu ul .mh-menu__item label.mh-checkbox-wrapper {
  text-overflow: ellipsis;
  overflow: hidden;
}

.mh-column-menu .mh-menu > .mh-menu__item {
  padding: 0 30px;
}

.mh-column-menu li.mh-menu__item .mh-menu--submenu .mh-menu__item{
  padding: 0 16px 0 30px;
}

.mh-column-menu ul .mh-menu__item.mh--focused, .mh-column-menu ul .mh-menu__item:hover {
  background-color: #eee;
  color: rgba(0, 0, 0, 0.87);
  outline: 0 solid rgba(0, 0, 0, 0.12);
  outline-offset: 0;
}

.mh-column-menu li.mh-menu__item .mh-menu--submenu{
  display: none;
  position: absolute;
  min-width: 104px;
  left: 100%;
  top: 0;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)
}

.mh-column-menu.mh--overflow li.mh-menu__item .mh-menu--submenu {
  left: -100%;
  right: 100%;
}

.mh-column-menu li.mh-menu__item:hover .mh-menu--submenu{
  display: block;
}

.mh-column-menu li.mh-menu__item ul.mh-column-list li.mh-menu__item{
  padding: 0 16px 0 16px;
  font-weight: normal;
}

.mh-column-menu .mh-checkbox-label{
  font-weight: normal;
}

.mh-separator--top{
  border-top: 1px solid #e4e4e4;
}
</style>
