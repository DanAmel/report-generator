<template>
  <div class="row q-mb-sm q-mt-xs">
    <div class="col-12">

      <div class="row no-wrap q-pa-md">

        <div class="col-md-12">
          <q-btn size="sm" flat @click="add('column')" class="text-green" :icon="iconType+'plus'">Ajouter une colonne</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'columns', []).length >0">
            <q-item v-for="(item, index) in newFilter.columns" v-bind:key="index">
              <q-item-section dense>
                <q-card flat  >
                  <template>
                    <ColumnReport
                      ref="column_report"
                      :item="item"
                      :items="newFilter.columns"
                      :index="index"
                      :validator="validator"
                      :isRequestMode = "isRequestMode"
                      v-on:removeColumn="removeColumn"
                      :icon-type="iconType"
                      :available-columns="availableColumns"/>
                  </template>
                </q-card>
              </q-item-section>
            </q-item>

          </q-list>
        </div>

      </div>


      <div class="row no-wrap q-pa-md">

        <div class="col-md-12">
          <q-btn size="sm" flat @click="add('formula')" class="text-green" :icon="iconType+'plus'">Ajouter une formule</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'formulas', []).length >0">
            <q-item v-for="(item, index) in newFilter.formulas" v-bind:key="index">
              <q-item-section dense>
                <q-card flat  >
                  <template>
                    <FormulaReport
                      ref="formula_report"
                      :item="item"
                      :items="newFilter.formulas"
                      :index="index"
                      :validator="validator"
                      :icon-type="iconType"
                      :available-columns="newFilter.columns"/>
                  </template>
                </q-card>
              </q-item-section>
            </q-item>

          </q-list>
        </div>

      </div>

      <div class="row no-wrap q-pa-md">
        <div class="col-md-12">
          <q-btn size="sm" flat :icon="iconType+'plus'" class="text-green" @click="add('condition')">Ajouter une Condition</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'conditions', []).length >0">
            <q-item v-for="(item, index) in newFilter.conditions" v-bind:key="index">
              <q-item-section dense>
                <q-card flat  >
                  <template>
                    <ConditionReport
                      ref="condition_report"
                      :item="item"
                      :items="newFilter.conditions"
                      :index="index"
                      :validator="validator"
                      :icon-type="iconType"
                      :available-columns="columns" />
                  </template>
                </q-card>
              </q-item-section>
            </q-item>

          </q-list>
        </div>
      </div>

      <div class="row no-wrap q-pa-md" v-if="!newFilter.isChart">
        <div class="col-md-12">
          <q-btn size="sm" flat @click="add('groupBy')" class="text-green" :icon="iconType+'plus'"> Ajouter un groupe</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'groupBy', []).length >0">
            <q-item v-for="(item, index) in newFilter.groupBy" v-bind:key="index">
              <q-item-section dense>
                <q-card flat>
                  <template>

                    <GroupByReport
                      ref="group_by_report"
                      :item="item"
                      :items="newFilter.groupBy"
                      :index="index"
                      :validator="validator"
                      :icon-type="iconType"
                      :available-columns="getColumnsGroupBy"/>

                  </template>
                </q-card>
              </q-item-section>
            </q-item>

          </q-list>
        </div>
      </div>

      <div class="row no-wrap q-pa-md">
        <div class="col-md-12">
          <q-btn size="sm" flat @click="add('orderBy')" class="text-green" :icon="iconType+'plus'"> Ajouter un ordre</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'orderBy', []).length >0">
            <q-item v-for="(item, index) in newFilter.orderBy" v-bind:key="index">
              <q-item-section dense>
                <q-card flat >
                  <template>
                    <OrderByReport
                      ref="order_by_report"
                      :item="item"
                      :items="newFilter.orderBy"
                      :index="index"
                      :validator="validator"
                      :icon-type="iconType"
                      :available-columns="getColumnsGroupBy"/>
                  </template>
                </q-card>
              </q-item-section>
            </q-item>

          </q-list>
        </div>
      </div>

    </div>
  </div>
</template>

<script>

import get from "lodash/get";
import clone from 'lodash/cloneDeep'

export default {
  name: 'TabData',
  components: {
    ColumnReport: () => import('./ColumnReport'),
    FormulaReport: () => import('./FormulaReport'),
    ConditionReport: () => import('./ConditionReport'),
    GroupByReport: () => import('./GroupByReport'),
    OrderByReport: () => import('./OrderByReport')},
  model: {
    prop: 'value',
    event: 'input',
  },
  mixins: [],
  props: {

    newFilter: {
      type: [Array, Object],
      default: ()=>[],
    },
    columns: {
      type: [Array, Object],
      default: ()=>[],
    },
    validator: {
      type: Object,
    },

    iconType: {
      type: String,
      default: 'fa fa-',
    },
    isRequestMode: {
      type: Boolean,
      default: false,
    },

  },
  data() {
    return {

    }
  },

  methods: {
    get,

    hide(evt){
      this.$refs.dialog.hide()
    },

    add(type){

      //console.log('this.newFilter', this.newFilter)
      switch (type){
        case 'column':
          //this.newFilter.columns.unshift({column: null, aggregat: null, type: null, data: null, sumData: false})
          this.newFilter.columns.push({column: null, aggregat: null, type: null, data: null, sumData: false})

          if(this.$refs.column_report){
            setTimeout(() =>{
              let index = this.$refs.column_report.length - 1
              this.$refs.column_report[index].focus()
            }, 0)
          }
          break
        case 'condition':
          //this.newFilter.conditions.unshift({condition: null, column: null, operand: null, value:null})
          this.newFilter.conditions.push({condition: null, column: null, operand: null, value:null})
          if(this.$refs.condition_report){
            setTimeout(() =>{
              let index = this.$refs.condition_report.length - 1
              this.$refs.condition_report[index].focus()
            }, 0)
          }
          break
        case 'groupBy':
          //this.newFilter.groupBy.unshift({column: null, name: null, sumData: false})
          this.newFilter.groupBy.push({column: null, name: null, sumData: false, use_variable: false, attribut: null, column_attribut: null})
          if(this.$refs.group_by_report){
            setTimeout(() =>{
              let index = this.$refs.group_by_report.length - 1
              this.$refs.group_by_report[index].focus()
            }, 0)
          }
          break
        case 'orderBy':
          //this.newFilter.orderBy.unshift({column: null, name: null})
          this.newFilter.orderBy.push({column: null, name: null})
          if(this.$refs.order_by_report){
            setTimeout(() =>{
              let index = this.$refs.order_by_report.length - 1
              this.$refs.order_by_report[index].focus()
            }, 0)
          }
          break
        case 'formula':
          this.newFilter.formulas.push({expression: null, sumData: false, variables: []})

          if(this.$refs.formula_report){
            setTimeout(() =>{
              let index = this.$refs.formula_report.length - 1
              this.$refs.formula_report[index].focus()
            }, 0)
          }
          break
      }

    },

    removeColumn(data){
      this.deleteFormulaElements(data)
      this.deleteGroupByElements(data)
    },

    deleteFormulaElements(data){
      get(this.newFilter, "formulas", []).forEach(x =>{
        let elem = get(x, "variables", []).filter(y => y.column.code === get(data, "column.code"))
        if(elem && elem.length >0){
          x.expression = ''
          x.variables = []
        }
      })
    },

    deleteGroupByElements(data){
      get(this.newFilter, "groupBy", []).forEach((x, index) =>{

        let indexToRemove = []
        let elem = get(x, "column.code") === get(data, "column.code")
        if(elem)
          indexToRemove.push(index)

        indexToRemove.forEach(y => this.newFilter.groupBy.splice(y, 1))
      })
    }

  },

  computed: {

    availableColumns(){
      return  clone(this.columns)
    },

    dateColumns(){
      let data = []
      if(this.columns){
        data = this.columns.filter(x => (x.type === 'date' || x.type === 'timestamptz'))
      }
      return data
    },

    getColumnsGroupBy(){
      /*return this.newFilter.columns.map(x =>{
        return {code: get(x, 'column.code'), name: get(x, 'column.name'), sumData: false}
      })*/

      return this.columns.map(x =>{
        return x
      })

    },

    /*filterReport(){
      this.$v.$touch()

      let data = this.generateFilter()
      data.isValid = !this.$v.$invalid
      this.$emit('input', clone(data))
      return data
    },*/

  },


  async mounted() {

  },

  watch: {
  }

}
</script>
