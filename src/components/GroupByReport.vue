<template>

  <div class="row">
    <div class="col-2"> Colonne </div>
    <div class="col-6">

      <q-select  dense outlined class="q-mr-md" clearable
           ref="mySelect"
           v-model="item.column"
           label="Choisir le champ"
           :options="availableFilterColumns"
           :hide-bottom-space="true"
           option-label="name" option-value="code"
           :options-dense="true"
           use-input input-debounce="0"
           @m-blur="validator.newFilter.groupBy.$each[index].column.$touch"
           :error="validator.newFilter.groupBy.$each[index].column.$error"
           @filter="filterAvailableColumns"
           @input="selectColumn">
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              Pas de résultats
            </q-item-section>
          </q-item>
        </template>
      </q-select>

    </div>
    <div class="col-3 justify-start">

      <q-checkbox v-show="false" v-model="item.sumData" label="Sous total" left-label />

    </div>
    <div class="col-1"> <q-icon class="q-mx-xs q-mt-md" color="red" :name="iconType+'times'" @click="deleteColumn(items, index)" /> </div>
  </div>

</template>

<script>
import get from "lodash/get";

export default {
  name: "GroupByReport",
  props:{
    item: {
      type : [Array, Object]
    },
    items: {
      type : [Array, Object]
    },
    index: {
      type : [Number, String]
    },
    availableColumns: {
      type: [Array]
    },
    validator: {
      type : [Array, Object]
    },
    iconType: {
      type: String,
      default: 'fa fa-',
    },
  },

  data(){
    return {
      availableFilterColumns: []
    }
  },

  methods:{

    focus(){
      this.$refs.mySelect.focus()
    },

    deleteColumn(data, index){
      this.removeItem(data, index)
    },

    removeItem(data, index){
      data.splice(index, 1)
    },

    filterAvailableColumns (val, update, abort) {
      update(() => {
        const needle = val.toLowerCase()
        this.availableFilterColumns = this.availableColumns.filter(v =>get(v, 'name', '').toLowerCase().indexOf(needle) > -1)
      })
    },

    selectColumn(val){
    },

  },


}
</script>

<style scoped>

</style>
