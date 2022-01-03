<template>
  <div class="row q-mb-sm q-mt-xs">
    <div class="col-12">

      <div class="row no-wrap q-pa-md">

        <div class="col-md-12">
          <q-btn size="sm" flat @click="add('column')" class="text-green" icon="fa fa-plus">Ajouter une colonne</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'columns', []).length >0">
            <q-item v-for="(item, index) in newFilter.columns" v-bind:key="index">
              <q-item-section dense>
                <q-card flat  >
                  <template>
                    <ColumnReport
                      :item="item"
                      :items="newFilter.columns"
                      :index="index"
                      :validator="validator"
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
          <q-btn size="sm" flat icon="fa fa-plus" class="text-green" @click="add('condition')">Ajouter une Condition</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'conditions', []).length >0">
            <q-item v-for="(item, index) in newFilter.conditions" v-bind:key="index">
              <q-item-section dense>
                <q-card flat  >
                  <template>
                    <ConditionReport
                      :item="item"
                      :items="newFilter.conditions"
                      :index="index"
                      :validator="validator"
                      :available-columns="columns" />
                  </template>
                </q-card>
              </q-item-section>
            </q-item>

          </q-list>
        </div>
      </div>

      <div class="row no-wrap q-pa-md">
        <div class="col-md-12">
          <q-btn size="sm" flat @click="add('groupBy')" class="text-green" icon="fa fa-plus"> Ajouter un groupe</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'groupBy', []).length >0">
            <q-item v-for="(item, index) in newFilter.groupBy" v-bind:key="index">
              <q-item-section dense>
                <q-card flat>
                  <template>

                    <GroupByReport
                      :item="item"
                      :items="newFilter.groupBy"
                      :index="index"
                      :validator="validator"
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
          <q-btn size="sm" flat @click="add('orderBy')" class="text-green" icon="fa fa-plus"> Ajouter un ordre</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'orderBy', []).length >0">
            <q-item v-for="(item, index) in newFilter.orderBy" v-bind:key="index">
              <q-item-section dense>
                <q-card flat >
                  <template>
                    <OrderByReport
                      :item="item"
                      :items="newFilter.orderBy"
                      :index="index"
                      :validator="validator"
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
    ColumnReport: () => import('./ColumnReport.vue'),
    ConditionReport: () => import('./ConditionReport.vue'),
    GroupByReport: () => import('./GroupByReport.vue'),
    OrderByReport: () => import('./OrderByReport.vue')},
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
          this.newFilter.columns.unshift({column: null, aggregat: null, type: null, data: null, sumData: false})
          break
        case 'condition':
          this.newFilter.conditions.unshift({condition: null, column: null, operand: null, value:null})
          break
        case 'groupBy':
          this.newFilter.groupBy.unshift({column: null, name: null, sumData: false})
          break
        case 'orderBy':
          this.newFilter.orderBy.unshift({column: null, name: null})
          break
      }

    },

    removeItem(data, index){
      data.splice(index, 1)
    },

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
      return this.newFilter.columns.map(x =>{
        return {code: get(x, 'column.code'), name: get(x, 'column.name'), sumData: false}
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
