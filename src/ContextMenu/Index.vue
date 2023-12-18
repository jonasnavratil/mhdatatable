<template :key="Date.now()">
  <div
      class="mh-context-menu"
      :class="{'mh--overflow': isOverflow}"
      :style="{
      top: top + 'px', 
      left: isOverflow == false ? left + 'px' : 'auto', 
      right: isOverflow ? left + 'px' : 'auto',
      visibility: show ? 'visible' : 'hidden' }"
  >
    <main>
      <component v-if="component" ref="dynamicContextMenuContent" :is="forDynCompIs(component)" :row="row"
                 :xprops="xprops" :column="column"></component>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<script>

import isColVisible from '../_utils/isColVisible'
import props from '../_mixins/props'

export default {
  name: 'contextMenu',
  mixins: [props],
  methods: {
    eventEndScrollHandler(evt) {
      if (evt.path.find(x => x.className === 'mh-context-menu')) {
        return
      }
      this.xprops.eventbus.$emit('hide-context-menu')
    },
    eventEndHandler(evt) {
      if (this.$el !== evt.target && !this.$el.contains(evt.target) && this.show === true) {
        this.xprops.eventbus.$emit('hide-context-menu')
      }
    },
    optionSelected(e, option) {
      this.$emit('option-selected', e, option)
    },
    uuidGen(key) {
      // $vm._uid is a private property of a Vue instance
      return `-col-${this._uid}-${key}`
    },
    handleHideContextMenu() {
      this.show = false
    },
    handleShowContextMenu(config) {
      this.row = config.row
      this.column = config.column
      this.component = config.component

      let event = config.event
      let menuBtnEl = event.target.getBoundingClientRect()
      let isOverflow = false//this.$parent.isOverflow(this.$parent.$el, event.target)

      this.top = menuBtnEl.top + menuBtnEl.height
      this.left = isOverflow == false ? menuBtnEl.left - this.isOverflowDelta(this.$parent.$el, event.target) : menuBtnEl.left - 15
      this.show = true
      this.$nextTick(() => {
        let rect = this.$el.getBoundingClientRect()
        let bottomPosition = this.$el.clientHeight + rect.y
        let overflowViewPort = bottomPosition - document.documentElement.clientHeight
        if (overflowViewPort > 0) {
          let topPosition = document.documentElement.clientHeight - this.$el.clientHeight
          this.top = topPosition
        }
      })
    },
    isOverflowDelta(parent, child) {
      let left = this.$el.clientWidth
      let op = child

      while (op && op != parent) {
        left += op.offsetLeft
        op = op.parentElement
      }

      let delta = ((left - child.offsetWidth) - parent.offsetWidth)
      return delta > 0 ? delta : 0
    },
    isColVisible
  },
  computed: {},
  watch: {},
  created() {
  },
  mounted() {
    this.xprops.eventbus.$on('show-context-menu', this.handleShowContextMenu)
    this.xprops.eventbus.$on('hide-context-menu', this.handleHideContextMenu)
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints
    this._touchEvent = touchSupport ? 'touchend' : 'click'
    document.body.addEventListener(this._touchEvent, this.eventEndHandler)
    document.body.addEventListener('mousewheel', this.eventEndScrollHandler)
  },
  beforeDestroy() {
    this.xprops.eventbus.$off('show-context-menu', this.handleShowContextMenu)
    this.xprops.eventbus.$off('hide-context-menu', this.handleHideContextMenu)
    document.body.removeEventListener(this._touchEvent, this.eventEndHandler)
    document.body.removeEventListener('mousewheel', this.eventEndScrollHandler)
  },
  data() {
    return {
      component: null,
      column: null,
      row: null,
      isOverflow: false,
      top: 0,
      left: 0,
      right: 0,
      show: false,
      key: Date.now()
    }
  }
}
</script>

<style>

.mh-tab-herader {
  background: #f5f7f7;
  min-width: 220px;
  width: 100%;
  display: flex;
  border-bottom: 1px solid #e4e4e4;
}

.mh-tab {
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

.cIcon {
  margin-left: 16px;
  margin-right: 0;
  position: absolute;
  right: 8px;
  height: 36px;
  line-height: 36px;
}

.cIcon.left {
  margin-left: 0px;
  margin-right: 0;
  position: absolute;
  left: 8px;
  height: 36px;
  line-height: 36px;
}

.cName {
  padding-left: 0px;
}

.mh-control {
  box-sizing: border-box;
}

.mh-context-menu {
  position: fixed;
  min-width: 120px;
  max-width: 230px;
  width: max-content;
  height: auto;
  z-index: 999;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)
}

.mh-context-menu main {
  max-width: 230px;
  padding-top: 0px;
  padding-bottom: 0px;
  background: #fff;
}

.mh-context-menu ul {
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

.mh-context-menu ul .mh-menu__item {
  cursor: pointer;
  position: relative;
  height: 36px;
  line-height: 36px;
  padding: 0 16px;
  text-overflow: ellipsis;
}

.mh-context-menu .mh-menu > .mh-menu__item {
  padding: 0 30px;
}

.mh-context-menu li.mh-menu__item .mh-menu--submenu .mh-menu__item {
  padding: 0 16px 0 30px;
}

.mh-context-menu ul .mh-menu__item.mh--focused, .mh-context-menu ul .mh-menu__item:hover {
  background-color: #eee;
  color: rgba(0, 0, 0, 0.87);
  outline: 0 solid rgba(0, 0, 0, 0.12);
  outline-offset: 0;
}

.mh-context-menu li.mh-menu__item .mh-menu--submenu {
  display: none;
  position: absolute;
  min-width: 104px;
  left: 100%;
  top: 0;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)
}

.mh-context-menu.mh--overflow li.mh-menu__item .mh-menu--submenu {
  left: -100%;
  right: 100%;
}

.mh-context-menu li.mh-menu__item:hover .mh-menu--submenu {
  display: block;
}

.mh-context-menu li.mh-menu__item ul.mh-column-list li.mh-menu__item {
  padding: 0 16px 0 16px;
  font-weight: normal;
}

.mh-context-menu .mh-checkbox-label {
  font-weight: normal;
}

.mh-separator--top {
  border-top: 1px solid #e4e4e4;
}
</style>
