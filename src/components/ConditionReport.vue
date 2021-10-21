<template>

  <div class="row">

    <div class="col-2"> <q-select  dense outlined class="q-mr-md"
                                   label=""
                                   v-model="item.condition"
                                   :options="conditions"
                                   :hide-bottom-space="true"
                                   option-label="name" option-value="code"
                                   :options-dense="true"
                                   @m-blur="validator.newFilter.conditions.$each[index].condition.$touch"
                                   :error="validator.newFilter.conditions.$each[index].condition.$error"
    > </q-select> </div>

    <div class="col-4"> <q-select  dense outlined class="q-mr-md"
                                   clearable clear-icon="fa fa-times"
                                   label=""
                                   v-model="item.column"
                                   :options="availableFilterColumns"
                                   :hide-bottom-space="true"
                                   option-label="name" option-value="code"
                                   :options-dense="true"
                                   use-input input-debounce="0"
                                   @filter="filterAvailableColumns"
                                   @m-blur="validator.newFilter.conditions.$each[index].column.$touch"
                                   :error="validator.newFilter.conditions.$each[index].column.$error"
                                   @input="resetByColumn"

      > </q-select>

    </div>
    <div class="col-3"> <q-select  dense outlined class="q-mr-md"
                                   clearable clear-icon="fa fa-times"
                                   label="Opérande"
                                   v-model="item.operand"
                                   :options="getAvailaibleOperands"
                                   :hide-bottom-space="true"
                                   option-label="name" option-value="code"
                                   :options-dense="true"
                                   @m-blur="validator.newFilter.conditions.$each[index].operand.$touch"
                                   :error="validator.newFilter.conditions.$each[index].operand.$error"
                                   @input="resetByOperand"

    > </q-select>
    </div>
    <div class="col-2">
      <q-input v-if="!hasData"  v-model="item.value" :type="getInputValue" dense label="Valeur"
               :readonly="isOperandNull"

      >

        <template v-if="isDate" v-slot:append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
              <q-date v-model="datesRange"  mask="YYYY-MM-DD"  :range="get(item, 'operand.code', '') === 'between'">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>

      </q-input>

      <q-select v-if="hasData"  dense  class="q-mr-md"
                 label="Valeur"
                 v-model="dataItem"
                 :options="get(item,'column.data', [])"
                 :hide-bottom-space="true"
                 option-label="name" option-value="code"
                 :options-dense="true"
                 :readonly="isOperandNull"
                 @input="onChangeDataInput"
      > </q-select>
    </div>
    <div class="col-1 justify-center"> <q-icon class="q-mx-xs q-mt-md" color="red" name="fa fa-times" @click="removeItem(items, index)" /> </div>
  </div>

</template>

<script>
import get from "lodash/get";

export default {
  name: "ConditionReport",
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
  },

  data(){
    return {
      availableFilterColumns: [],
      selectedOperand: null,
      conditions: [
        {name: 'ET', code:'and'},
        {name: 'OU', code:'or'},
      ],
      operands: [
        {name: 'Egal', code:'equal'},
        {name: 'Différent', code:'not-equal'},
        {name: 'Contient', code:'contains'},
        {name: 'Supérieur', code:'gt'},
        {name: 'Inférieur', code:'lt'},
        {name: 'Supérieur =', code:'gte'},
        {name: 'Inférieur =', code:'lte'},
        {name: 'Commence par', code:'start'},
        {name: 'Est null', code:'isNull'},
        {name: 'Diff. de null', code:'isNotNull'},
        {name: 'Fini par', code:'end'},
        {name: 'Entre', code:'between'},
      ],
      datesRange: {
        from: null,
        to: null,
      },
      dataItem: null,
    }
  },

  methods:{

    get,
    deleteColumn(data, index){
      this.removeItem(data, index)
    },
    removeItem(data, index){
      data.splice(index, 1)
    },

    filterAvailableColumns (val, update, abort) {
      update(() => {
        const needle = val.toLowerCase()
        this.availableFilterColumns = this.availableColumns.filter(v => v.name.toLowerCase().indexOf(needle) > -1)
      })
    },

    selectColumn(val){
      let index = this.availableColumns.findIndex(x => get(x, 'code') === get(val, 'code'))
    },

    dataItemChange(){
      this.item.value = get(this.dataItem, 'code')
    },

    resetByOperand(){
      this.item.value = null
    },

    resetByColumn(){
      this.item.operand = null
      this.item.value = null
    },

    onChangeDataInput(){
      this.item.value = get(this.dataItem, 'code')
    },

  },

  computed:{

    getAvailaibleOperands(){

      let type = get(this.item, 'column.type', '')
      let operands = []
      switch (type){
        case 'float4':
        case 'numeric':
        case 'int4':
          operands.push({name: 'Différent', code:'not-equal'})
          operands.push({name: 'Egal', code:'equals'},)
          operands.push({name: 'Est null', code:'isNull'})
          operands.push({name: 'Diff. de null', code:'isNotNull'})
          operands.push({name: 'Supérieur', code:'gt'})
          operands.push({name: 'Inférieur', code:'lt'})
          operands.push({name: 'Supérieur =', code:'gte'})
          operands.push({name: 'Inférieur =', code:'lte'})
          break
        case 'date':
        case 'timestamptz':
          operands.push({name: 'Egal', code:'equals'})
          operands.push({name: 'Différent', code:'not-equal'})
          operands.push({name: 'Est null', code:'isNull'})
          operands.push({name: 'Diff. de null', code:'isNotNull'})
          operands.push({name: 'Supérieur', code:'gt'})
          operands.push({name: 'Inférieur', code:'lt'})
          operands.push({name: 'Supérieur =', code:'gte'})
          operands.push({name: 'Inférieur =', code:'lte'})
          operands.push({name: 'Entre', code:'between'})
          break
        case 'varchar':
        case 'text':
          operands.push({name: 'Egal', code:'equals'})
          operands.push({name: 'Différent', code:'not-equal'})
          operands.push({name: 'Est null', code:'isNull'})
          operands.push({name: 'Diff. de null', code:'isNotNull'})
          operands.push({name: 'Contient', code:'contains'})
          operands.push({name: 'Commence par', code:'start'})
          operands.push({name: 'Fini par', code:'end'})
          break
        case 'bool':
          operands.push({name: 'Egal', code:'equals'})
          operands.push({name: 'Différent', code:'not-equal'})
          operands.push({name: 'Est null', code:'isNull'})
          operands.push({name: 'Diff. de null', code:'isNotNull'})
          break
      }
      return operands
    },

    isNumeric(){

      let type = get(this.item.column, 'type', '')
      let val = false
      switch (type){
        case 'float4':
        case 'numeric':
        case 'int4':
          val = true
          break
        case 'date':
        case 'varchar':
        case 'text':
          val = false
          break
      }
      return val
    },

    isText(){

      let type = get(this.item.column, 'type', '')
      let val = false
      switch (type){
        case 'float4':
        case 'numeric':
        case 'int4':
        case 'date':
        case 'timestamptz':
          val = false
          break
        case 'varchar':
        case 'text':
          val = true
          break
      }
      return val
    },

    isDate(){
      let type = get(this.item.column, 'type', '')
      let val = false
      switch (type){
        case 'float4':
        case 'numeric':
        case 'int4':
        case 'varchar':
          val = false
          break
        case 'date':
        case 'timestamptz':
          val = true
          break
      }

      return val
    },

    getInputValue(){
      let type = 'text'
      if(this.isNumeric)
        type =  'number'
      else if(this.isDate)
        type =  ''
      else if(this.isText)
        type = ''

      return type
    },

    isOperandNull(){
      return (get(this.item,'operand.code') === 'isNull' || get(this.item,'operand.code') === 'isNotNull')
    },

    hasData(){
      let temoin = false
      if(get(this.item, 'column.data'))
        temoin = true
      return temoin
    },

    selectedRange() {
      if (!!this.datesRange) {
        if (typeof this.datesRange === 'string') {
          return this._formatDate(this.datesRange, 'DD-MM-YYYY')
        }
        if (typeof this.datesRange === 'object') {
          let from = get(this.datesRange, 'from') ? this._formatDate(this.datesRange.from, 'DD-MM-YYYY') : ''
          let to = get(this.datesRange, 'to') ? this._formatDate(this.datesRange.to, 'DD-MM-YYYY') : ''
          return from + ' - ' + to
        }
      }
      return 'Selectionner une date'
    },

  },

  mounted(){
    if(this.hasData){
      this.dataItem = get(this.item, 'column.data', []).find(x => x.code === this.item.value)
    }
    if(get(this.item, 'operand.code') === 'between'){
      this.datesRange.from = this.item.value[0]
      this.datesRange.to = this.item.value[1]
    }
    //this.selectedOperand = this.item.operand
  },

  watch: {

    'datesRange':{
      handler: function(val, oldVal){
        if(this.isDate){
          if (!!this.datesRange) {
            if (typeof this.datesRange === 'string') {
              this.item.value = this.datesRange ? this.datesRange: ''
            }
            if (typeof this.datesRange === 'object') {
              if(val.to && val.from){
                this.item.value = []
                this.item.value.push(val.from)
                this.item.value.push(val.to)
              }
            }
          }
        }

      },
      deep: true,
      immediate: true
    },

  }


}
</script>

<style scoped>

</style>
