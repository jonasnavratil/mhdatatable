<template>
<div>
  <label class="-page-size-select-label" name="PageSizeSelect">
    <select class="form-control -page-size-select"  v-model="query.limit"
      @change="query.offset = 0 /* reset to the first page */">
      <option v-for="(i, index) in pageSizeOptions" :value="i" :key="index">{{ i }}</option>
    </select>
  </label>
 <span class="grid-item-per-page"> {{ $i18nForDatatable('items / page') }} </span>
</div>

</template>
<script>
export default {
  name: 'PageSizeSelect',
  props: {
    query: { type: Object, required: true },
    pageSizeOptions: { type: Array, required: true }
  }
}
</script>
<style>
.-page-size-select {
  margin: 0;
  width: 65px;
  border-radius: 0 !important;
  height: 28px !important;
}
.-page-size-select-label {
  margin: 0;
}
</style>
