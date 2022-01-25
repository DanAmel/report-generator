<template>

  <div class="row">
<!--    <div class="col-2"> Colonne </div>-->
    <div class="col-6">

      <q-select  dense outlined class="q-mr-md" clearable
                 ref="mySelect"
         v-model="item.column"
         label="Choisir une colonne"
         :options="availableFilterColumns"
         :hide-bottom-space="true"
         option-label="name" option-value="code"
         :options-dense="true"
         use-input input-debounce="0"
         error-message="Champ requis."
         @m-blur="validator.newFilter.column_cross.$each[index].column.$touch"
         :error="validator.newFilter.column_cross.$each[index].column.$error"
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
      <!--                                {{item.column}}-->
<!--      <q-select  dense outlined class="" clearable
         v-model="selectedAgregat"
         label="Sous total"
         :options="getAvailaibleAgregats(item.column)"
         :hide-bottom-space="true"
         error-message="Champ requis."
         @m-blur="validator.newFilter.column_cross.$each[index].aggregat.$touch"
         :error="validator.newFilter.column_cross.$each[index].aggregat.$error"
         option-label="name" option-value="code"
         :options-dense="true"
         @input="changeAgregat"> </q-select>-->
    </div>

    <div class="col-2">
      <q-checkbox v-if="item.column && isNumeric" class="q-ml-md" v-model="item.column.sumData" label="Sous total" left-label />
    </div>

    <div class="col-1"> <q-icon class="q-mx-xs q-mt-md" color="red" :name="iconType+'times'" @click="deleteColumn(items, index)" /> </div>
  </div>

</template>

<script>
import get from "lodash/get";

export default {
  name: "ColumnCross",
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
      availableFilterColumns: [],
      selectedAgregat: null,
    }
  },

  methods:{

    focus(){
      this.$refs.mySelect.focus()
    },

    changeAgregat(){
      this.item.aggregat = this.selectedAgregat
    },

    deleteColumn(data, index){
      if(this.item.column){
        this.availableColumns.push(this.item.column)
      }
      this.removeItem(data, index)
    },

    removeItem(data, index){
      data.splice(index, 1)
    },

    filterAvailableColumns (val, update, abort) {
      update(() => {
        const needle = val.toLowerCase()
        this.availableFilterColumns = this.availableColumns.filter(v => v.name && v.name.toLowerCase().indexOf(needle) > -1)
      })
    },

    selectColumn(val){
      //let index = this.availableColumns.findIndex(x => get(x, 'code') === get(val, 'code'))
      //this.removeItem(this.availableColumns, index)
      if(this.item.column)
        this.item.column.aggregat = null
    },

    //GESTION DES AGREGATS
    getAvailaibleAgregats(data){

      let type = get(data, 'type', '')
      let agreg = []
      switch (type){
        case 'float4':
        case 'float8':
        case 'numeric':
        case 'int4':
        case 'int8':
          agreg.push({name: 'SOMME', code:'sum'})
          agreg.push({name: 'NOMBRE', code:'count'})
          agreg.push({name: 'MOYENNE', code:'avg'})
          break
        case 'date':
        case 'text':
        case 'varchar':
          agreg.push({name: 'NOMBRE', code:'count'})
          break
      }

      return agreg
    },

  },

  computed:{

    isNumeric(){
      let result = false
      let type = get(this.item, 'column.type', 'varchar')
      switch (type){
        case 'float4':
        case 'float8':
        case 'numeric':
        case 'int4':
        case 'int8':
          result = true
          break
        default:
          result = false
          break
      }

      return result
    }
  },

  mounted(){
    if(this.item){
      this.selectedAgregat = get(this.item, 'column.aggregat')
    }
  },


}
</script>

<style scoped>

</style>
