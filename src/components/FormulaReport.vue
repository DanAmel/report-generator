<template>

  <div class="row">
<!--    <div class="col-2"> Colonne </div>-->

    <div class="col-5">
      <q-input
        ref="myExpression"
        v-model="item.expression"
        class="q-ml-md"
        dense label="Expression" />

    </div>
    <div class="col-5 justify-start">
      <q-input
        v-model="item.alias"
        class="q-ml-md"
        dense label="Libellé" />
    </div>

    <div class="col-1"> <q-icon class="q-mx-xs q-mt-md" color="black" size="25px" :name="iconType+'exclamation-circle'" @click="addVariables" /> </div>

    <div class="col-1"> <q-icon class="q-mx-xs q-mt-md" color="red" :name="iconType+'times'" @click="deleteColumn(items, index)" /> </div>
  </div>

</template>

<script>

import get from "lodash/get";
import {Parser} from 'expr-eval'
import VariablesFormulaDialog from "./VariablesFormula";

export default {
  name: "FormulaReport",
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
  components: {
  },

  data(){
    return {
      availableFilterColumns: [],
      variables: [],
      selectedAgregat: null,
    }
  },

  methods:{

    focus(){
      this.$refs.myExpression.focus()
    },

    changeAgregat(){
      this.item.column.aggregat = this.selectedAgregat
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
        this.availableFilterColumns = this.availableColumns.filter(v => get(v, 'name', '').toLowerCase().indexOf(needle) > -1)
      })
    },

    addVariables(){
      this.$q.dialog({
        component: VariablesFormulaDialog,
        parent: this,
        item: this.item,
        availableColumns: this.availableColumns.filter(x => this.isColumnNumeric(x)),
        variables: this.variables
      }).onOk(async (val) => {
        //A faire
        console.log('valll', val)
        this.item.variables = val
      })
    },

    isColumnNumeric(column){
      let result = false
      let type = get(column, 'type', 'varchar')
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
    },

    displayVariable(){
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
          agreg.push({name: 'MIN', code:'min'})
          agreg.push({name: 'MAX', code:'max'})
          agreg.push({name: 'NOMBRE', code:'count'})
          agreg.push({name: 'SOMME', code:'sum'})
          agreg.push({name: 'MOYENNE', code:'avg'})
          if(this.index === 0)
            agreg.push({name: 'DISTINCT', code:'distinct'})
          break
        case 'date':
          agreg.push({name: 'MIN', code:'min'})
          agreg.push({name: 'MAX', code:'max'})
          agreg.push({name: 'NOMBRE', code:'count'})
          break
        case 'text':
        case 'varchar':
          agreg.push({name: 'NOMBRE', code:'count'})
          if(this.index === 0)
            agreg.push({name: 'DISTINCT', code:'distinct'})
          break
      }

      return agreg
    },

    parseExpression(){
      let parser = new Parser()
      try {

        let expr = parser.parse(this.item.expression)
        let variables = expr.variables()


        this.variables = variables.reduce((acc, variable) => {
          //const attribut = this.variables.find(v => v.variable === variable);
          /*acc.push({
            variable,
            column: null,
          })*/
          acc.push(variable)

          return acc
        },[])

      }catch (e) {

      }
    }

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
    },

  },

  mounted(){
    if(this.item){
      this.parseExpression()
      this.selectedAgregat = get(this.item, 'column.aggregat')
    }
  },

  watch: {
    'item.expression'(){
      this.parseExpression()
    },



  },


}
</script>

<style scoped>

</style>
