<template>

  <div class="row">
<!--    <div class="col-2"> Colonne </div>-->
    <div class="col-5">
      <q-input
        ref="myExpression"
        v-model="item.expression"
        class="q-ml-md"
        @m-blur="validator.newFilter.formulas.$each[index].expression.$touch"
        :error="validator.newFilter.formulas.$each[index].expression.$error"
        error-message="Expression incorrecte."
        dense label="Expression" />

    </div>
    <div class="col-5 justify-start">
      <q-input
        v-model="item.alias"
        class="q-ml-md"
        @m-blur="validator.newFilter.formulas.$each[index].alias.$touch"
        :error="validator.newFilter.formulas.$each[index].alias.$error"
        dense label="Libellé" />
    </div>

    <div class="col-1"> <q-icon :aria-errormessage="validator.newFilter.formulas.$each[index].variables.$error" v-if="variables.length>0" class="q-mx-xs q-mt-md" color="black" size="25px" :name="iconType+'exclamation-circle'" @click="addVariables" /> </div>

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
      hasError: false,
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
      let data = this.availableColumns.map(x => x.column)
      this.$q.dialog({
        component: VariablesFormulaDialog,
        parent: this,
        item: this.item,
        availableColumns: data.filter(x => this.isColumnNumeric(x) && x.sumData),
        variables: this.variables
      }).onOk(async (val) => {
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

    parseExpression(){
      let parser = new Parser()
      try {

        let expr = parser.parse(this.item.expression)
        let variables = expr.variables()


        this.variables = []
        this.variables = variables.reduce((acc, variable) => {
          acc.push(variable)

          return acc
        },[])
        this.hasError = false

      }catch (e) {
        //lever une erreur
        this.hasError = true
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
    }
  },

  watch: {
    'item.expression'(){
      this.parseExpression()

      //Suppression des index
      let indexRemove = []
      let variableToAdd = []
      this.item.variables.forEach((x, i) =>{
        let el = this.variables.find(y => y === x.variable)

        if(!el){
          indexRemove.push(i)
        }

      })
      indexRemove.forEach(index =>{
        this.item.variables[index].variable = null
        this.item.variables[index].column = null
        //this.item.variables.splice(index, 1)
      })


    },

  },

}
</script>

<style scoped>

</style>
