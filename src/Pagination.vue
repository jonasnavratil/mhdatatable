<template>
  <ul class="pagination" style="margin: 0" name="Pagination">
    <li  class="page-item" :class="{'disabled': isFirstPage}" @click="turnPage(-1)">
      <a href="#" class="page-link" @click.prevent>
        <i class="fa fa-arrow-left"></i>
      </a>
    </li>
    <li v-for="(i, index) in dspBtns" :key="index" :class="['page-item', { 'active': i === curPage }]">
      <a v-if="i" href="#" class="page-link" @click.prevent="handleClick(i)">
        {{ i }}
      </a>
      <a v-else class="page-link">
        <i class="fa fa-ellipsis-h"></i>
      </a>
    </li>
    <li :class="{'disabled': isLastPage}" class="page-item" @click="turnPage(1)">
      <a href="#" class="page-link" @click.prevent>
        <i class="fa fa-arrow-right"></i>
      </a>
    </li>
    <li class="page-item">
      <a href="#" class="page-link -go-to-page-link" @click.prevent="onGoToPageClick">
        {{$i18nForDatatable('Go to page')}}
      </a>
      <label class="-go-to-page-select-label">
        <input class="form-control -go-to-page-input" :value="curPage" type="number" min="1" :max="curPage" @change="onGoToPageChange($event)"/>
      </label>
    </li>
  </ul>
</template>
<script>
export default {
  name: 'Pagination',
  props: {
    total: { type: Number, required: true },
    query: { type: Object, required: true }
  },
  data() {
    return {
      goToPageValue: this.curPage
    }
  },
  computed: {
    isFirstPage () {
      return +this.query.offset === 0 || +this.query.limit >= this.total
    },
    isLastPage () {
      return +this.query.offset + +this.query.limit >= this.total
    },
    totalPage () {
      return Math.ceil(this.total / +this.query.limit)
    },
    curPage () {
      return Math.ceil(+this.query.offset / +this.query.limit) + 1
    },
    dspBtns () {
      const n = this.totalPage
      const i = this.curPage

      /* eslint-disable */
      if (n <= 9) return ((n) => {
        const arr = Array(n)
        while (n) { arr[n - 1] = n-- }
        return arr
      })(n)
      if (i <= 5) return [1, 2, 3, 4, 5, 0, n] // 0 represents `···`
      if (i >= n - 4) return [1, 0, n-4, n-3, n-2, n-1, n]
      return [1, 0, i-2, i-1, i, i+1, i+2, 0, n]
      /* eslint-enable */
    }
  },
  methods: {
    handleClick (n) {
      this.query.offset = (n - 1) * +this.query.limit
    },
    turnPage (i) {
      if (i < 0 && this.isFirstPage || i > 0 && this.isLastPage) return
      this.query.offset = +this.query.offset + i * +this.query.limit
    },
    onGoToPageChange(evt) {
      this.goToPageValue = evt.target.value
    },
    onGoToPageClick() {
      let val = Number.parseInt(this.goToPageValue)
      if (!Number.isNaN(val)) {
        if (val >= 1 && val <= this.totalPage) {
          this.handleClick(val)
        } else if (val < 1) {
          this.handleClick(1)
        } else if (val > this.totalPage) {
          this.handleClick(this.totalPage)
        }
      }
    }
  }
}
</script>
<style>
.-go-to-page-link {
  margin-left: 12px !important;
  display: inline-block !important;
  border: 1px solid #d8dbe0;
}
.-go-to-page-input {
  margin: 0;
  width: 65px;
  border-radius: 0 !important;
  border-left: 0;
  -moz-appearance: textfield;
}
.-go-to-page-select-label {
  margin: 0;
  margin-right: 1rem;
  display: inline-block !important;
}
/* Chrome, Safari, Edge, Opera */
.-go-to-page-input::-webkit-outer-spin-button,
.-go-to-page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
