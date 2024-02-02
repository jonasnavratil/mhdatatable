<template>
  <div style="margin: 0 auto; width: 100%">
    <code>query: {{ query }}</code>
    <datatable ref="table" @datasource-refresh="loadData" v-bind="$data" />
  </div>
</template>
<script>
import mockData from '../_mockData'
import { setTimeout } from 'timers'
import dnd from '../../../plugins/HeaderSettingsDnD'
import components from './comps/'
import Vue from 'vue'

export default {
  components,
  data: () => ({
    supportBackup: true,
    supportNested: true,
    showSelection: true,
    gridName: 'fixedGrid2',
    fixHeaderAndSetBodyMaxHeight: 800,
    tblClass: 'table-bordered',
    showSaveGridViewButton: true,
    // dataSource: {
    //   read: mockData
    // },
    columns: [
      { title: 'User ID', field: 'uid', thComp: 'FilterTh', sortable: true, fixed: true, colStyle: {width: '100px'} },
      { title: 'Username', field: 'name', thComp: 'FilterTh', minWidth: 100, fixed: false, colStyle: {width: '100px'} },
      { title: 'Age', field: 'age', thComp: 'FilterTh', sortable: true , colStyle: {width: '100px'}, isFilterDisabled: true },
      { title: 'Email', field: 'email', visible: 'false', colStyle: {width: '100px'} },
      { title: 'Country', field: 'country',  visible: 'false', minWidth: 300, visible: 'false', colStyle: {width: '600px'}   },
      { title: 'Operation', tdComp: 'Opt' , fixed: "right",  visible: 'false', colStyle: {width: '650px'}, isTreeColumn: true  },
      { title: 'Multiline', tdComp: 'MultiLineTextTd', visible: 'true' }
    ],
    //.map(col => (col.colStyle = { width: '200px' }, col)),
    data: [],
    summary: {},
    pending: true,
    total: 0,
    query: {},
    fullHeight: {
      enabled: true,
      heightCorrection: -350,
      minHeight: 300
    },
    selection: [],
    xprops: {
      eventbus: new Vue()
    }
  }),
  methods: {
    loadData() {

        //  var dataStatic = {
        //       rows: [
        //         {uid: 1, name: "Linda Thomas", age: 81, email: "linda@oneway.mobi", friends: [], children:[]}
        //       ],
        //       summary: {uid: 120, age: 47, country: 7},
        //       total: 120
        //   }

        //   this.data = dataStatic.rows.slice(1, 500)
        //   this.total = dataStatic.total
        //   this.summary = dataStatic.summary


        this.query.offset = 0;
        mockData(this.query).then(({ rows, total, summary }) => {
          this.data = rows.slice(1, 500)
          this.total = 500
          this.summary = summary
        })
    }
  },
  mounted() {
    dnd(this),
    setTimeout(() => {
      this.pending = false
    }, 2000)
  },
  watch: {
    query: {
      handler (query) {
        mockData(query).then(({ rows, total, summary }) => {
          this.data = rows.slice(1, 500)
          this.total = 500
          this.summary = summary
        })
      },
      deep: true
    }
  }
}
</script>
