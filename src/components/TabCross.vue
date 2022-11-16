<template>
  <div class="row q-mb-sm q-mt-xs">
    <div class="col-12">

      <div class="row no-wrap q-pa-md">

        <div class="col-md-12">
          <q-btn size="sm" flat @click="add('column_cross')" class="text-green" :icon="iconType+'plus'">Ajouter une colonne</q-btn>
          <q-list dense bordered padding v-if="get(newFilter, 'column_cross', []).length >0">
            <q-item v-for="(item, index) in newFilter.column_cross" v-bind:key="index">
              <q-item-section dense>
                <q-card flat>
                  <template>
                    <ColumnCross
                      ref="column_cross"
                      :item="item"
                      :items="newFilter.column_cross"
                      :index="index"
                      :validator="validator"
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
        <q-btn size="sm" flat @click="add('line_cross')" class="text-green" :icon="iconType+'plus'">Ajouter une Ligne</q-btn>
        <q-list dense bordered padding v-if="get(newFilter, 'line_cross', []).length >0">
          <q-item v-for="(item, index) in newFilter.line_cross" v-bind:key="index">
            <q-item-section dense>
              <q-card flat>
                <template>
                  <LineCross
                    ref="line_cross"
                    :item="item"
                    :items="newFilter.line_cross"
                    :index="index"
                    :validator="validator"
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
        <q-btn size="sm" flat @click="add('value_cross')" class="text-green" :icon="iconType+'plus'">Ajouter une valeur</q-btn>
        <q-list dense bordered padding v-if="get(newFilter, 'value_cross', []).length >0">
          <q-item v-for="(item, index) in newFilter.value_cross" v-bind:key="index">
            <q-item-section dense>
              <q-card flat>
                <template>
                  <ValueCross
                    ref="value_cross"
                    :item="item"
                    :items="newFilter.value_cross"
                    :index="index"
                    :validator="validator"
                    :icon-type="iconType"
                    :available-columns="availableColumns"/>
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
import difference from 'lodash/difference'

export default {
  name: 'TabCross',
  components: {
    ColumnCross: () => import('./ColumnCross'),
    LineCross: () => import('./LineCross'),
    ValueCross: () => import('./ValueCross')
  },
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

        case 'column_cross':
          //this.newFilter.column_cross.unshift({column: null, aggregat: null, type: null, data: null, sumData: false})
          this.newFilter.column_cross.push({column: null, aggregat: null, type: null, data: null, sumData: false})
          if(this.$refs.column_cross){
            setTimeout(() =>{
              let index = this.$refs.column_cross.length - 1
              this.$refs.column_cross[index].focus()
            }, 0)
          }
          break
        case 'line_cross':
          //this.newFilter.line_cross.unshift({column: null, aggregat: null, type: null, data: null, sumData: false})
          this.newFilter.line_cross.push({column: null, aggregat: null, type: null, data: null, sumData: false})
          if( this.$refs.line_cross){
            setTimeout(() =>{
              let index = this.$refs.line_cross.length - 1
              this.$refs.line_cross[index].focus()
            }, 0)
          }
          break
        case 'value_cross':
          //this.newFilter.value_cross.unshift({column: null, name: null, aggregat: {name: 'SOMME', code:'sum'}, sumData: false})
          this.newFilter.value_cross.push({column: null, name: null, aggregat: {name: 'SOMME', code:'sum'}, sumData: false})
          if(this.$refs.value_cross){
            setTimeout(() =>{
              let index =  this.$refs.value_cross.length - 1
              this.$refs.value_cross[index].focus()
            }, 0)
          }
          break
      }
      //console.log('yes',  this.newFilter.column_cross)

    },

    removeItem(data, index){
      data.splice(index, 1)
    },


  },

  computed: {

    availableColumns(){
      let codes =  get(this.newFilter, 'columns', []).map(x => get(x, 'column.name'))
      let code_col =  get(this.newFilter, 'column_cross', []).map(x => get(x, 'column.name'))
      let code_line =  get(this.newFilter, 'line_cross', []).map(x => get(x, 'column.name'))
      let diff = difference(codes, [].concat(code_col, code_line)  )
      return  clone(this.columns.filter(v => diff.includes(v.name) ))
    },



  },


  async mounted() {

  },

  watch: {

    'newFilter': {
      handler: async function (val, oldVal){
        if(val){
        }
      },
      deep: true,
      immediate: true,
    },

  }

}
</script>
