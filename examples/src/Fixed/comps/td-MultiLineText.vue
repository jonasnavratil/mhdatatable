<template>
<div>
  <p v-for="line in lines" :key="line">
    {{ line | lineTitle }}
  </p>
</div>
</template>

<script>
export default {
  name: 'td-MultiLineText',
  data() {
    return { lines: [] }
  },
  props: {
    row: {
      type: Object
    }
  },
  filters: {
    lineTitle(index) {
      return `${index}. line`
    }
  },
  methods: {
    calculateLines(row) {
      const total = Math.floor(Math.random() * 4)
      let result = []
      for (let i = 0; i <= total; i++) {
        result.push(i)
      }
      this.lines = result
    }
  },
  watch: {
    row: {
      deep: true,
      immediate: true,
      handler: function(row) {
        this.calculateLines(row)
      }
    }
  }
}
</script>

<style scoped>

</style>