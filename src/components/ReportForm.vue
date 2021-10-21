<template>
  <div class="row q-mb-sm q-mt-xs">
    <div class="col-12">

        <q-btn-dropdown
          ref="dialog"
          flat color="white" dense stretch
          text-color="black" size="md"
          class="float-right on-right q-pt-xs"
          label="GENERATEUR">

          <q-card class="my-card">

            <q-card-section>

              <div class="col-12 q-ma-none q-px-lg text-center q-pt-sm" v-if="loading">
                <q-spinner-ios color="primary" size="2em"/>
                Chargement en cours...
                <q-tooltip :offset="[0, 8]">Veuillez patienter . . .</q-tooltip>
              </div>

              <div class="row no-wrap q-pt-md q-pl-md">


                <div class="col-md-6">
                  <q-select  dense outlined class="q-mr-md"
                             label="Module"
                             v-model="mReport"
                             :options="reportList"
                             :hide-bottom-space="true"
                             option-label="table_description" option-value="table_name"
                             :options-dense="true"> </q-select>
                </div>
                <div class="col-md-6">
                  <q-select v-if="newFilter"   dense outlined class="q-mr-md"
                             label="Date du Rapport"
                             v-model="newFilter.dateReport"
                             :options="dateColumns"
                             :hide-bottom-space="true"
                             option-label="name" option-value="code"
                             @m-blur="$v.newFilter.dateReport.$touch"
                             :error="$v.newFilter.dateReport.$error"
                             :options-dense="true"> </q-select>
                </div>

              </div>

              <div class="row no-wrap q-pa-md">
                <div class="col-md-10">
                  <span class="text-h7 col-md-8"><q-input v-if="newFilter" class="q-mr-md" dense label="Titre" v-model="newFilter.title" @m-blur="$v.newFilter.title.$touch"
                                                          :error="$v.newFilter.title.$error" /></span>
                </div>
                <div class="col-md-2">
                  <q-checkbox  class="q-mt-lg" dense v-model="is_all" label="Toutes usines" left-label />
                </div>
              </div>

              <div class="row no-wrap q-pa-md">
                <div class="col-2"> Mise en page</div>
                <div class="col-5">

                  <q-select  dense outlined class="q-mr-md" clearable
                             v-model="pageSizeSelected"
                             label="Choisir le champ"
                             :options="pageSizeList"
                             :hide-bottom-space="true"
                             option-label="name" option-value="code"
                             :options-dense="true"
                             use-input input-debounce="0">
                    <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          Pas de résultats
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>

                </div>
                <div class="col-5 justify-start">

                  <q-select  dense outlined class="" clearable
                             v-model="pageOrientationSelected"
                             label="Orientation"
                             :options="pageOrientationList"
                             :hide-bottom-space="true"
                             option-label="name" option-value="code"
                             :options-dense="true"
                  > </q-select>
                </div>

              </div>

              <div class="row no-wrap q-pa-md">

                <div class="col-md-12" style="min-width: 900px ">
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
                             :validator="$v"
                             :available-columns="availableColumns"/>
                          </template>
                        </q-card>
                      </q-item-section>
                    </q-item>

                  </q-list>

                </div>

              </div>

              <div class="row no-wrap q-pa-md">
                <div class="col-md-12" style="min-width: 900px ">
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
                              :validator="$v"
                              :available-columns="columns" />
                          </template>
                        </q-card>
                      </q-item-section>
                    </q-item>

                  </q-list>
                </div>
              </div>

              <div class="row no-wrap q-pa-md">
                <div class="col-md-12" style="min-width: 900px ">
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
                              :validator="$v"
                              :available-columns="getColumnsGroupBy"/>

                          </template>
                        </q-card>
                      </q-item-section>
                    </q-item>

                  </q-list>
                </div>
              </div>

              <div class="row no-wrap q-pa-md">
                <div class="col-md-12" style="min-width: 900px ">
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
                              :validator="$v"
                              :available-columns="getColumnsGroupBy"/>
                          </template>
                        </q-card>
                      </q-item-section>
                    </q-item>

                  </q-list>
                </div>
              </div>

            </q-card-section>



            <q-card-actions class="q-pr-md items-center" align="right">
              <div class="row">
                <q-btn class="q-pr-xs" icon="fa fa-eye" flat align="right" @click="showPreview" v-if="canSave">

                  <q-tooltip>
                    Prévisualisation
                  </q-tooltip>
                </q-btn>

                <q-btn class="q-pr-xs" icon="fa fa-save" flat align="right" @click="submit" v-if="canSave">
                  SAUVEGARDER
                  <q-tooltip>
                    Sauvegarder le rapport en cours
                  </q-tooltip>
                </q-btn>

<!--                <q-btn icon="fa fa-file-pdf" flat align="right" @click="submit">
                  <q-tooltip>
                    Afficher le rapport
                  </q-tooltip>
                </q-btn>-->
              </div>

            </q-card-actions>


          </q-card>
        </q-btn-dropdown>

    </div>
  </div>
</template>

<script>

import get from "lodash/get";
import clone from 'lodash/cloneDeep'
import ColumnReport from "./ColumnReport";
import ConditionReport from "./ConditionReport";
import GroupByReport from "./GroupByReport";
import OrderByReport from "./OrderByReport";
import {mapActions, mapState} from "vuex";
import {required, requiredIf} from 'vuelidate/lib/validators'

export default {
  name: 'ReportForm',
  components: {ColumnReport, ConditionReport, GroupByReport, OrderByReport},
  model: {
    prop: 'value',
    event: 'input',
  },
  mixins: [],
  props: {
    model: {
      type: [Array, String, Object],
    },
    value: {
      type: [Object, Array, Number, String],
      default: '',
    },
    reportList: {
      type: [Array, Object],
      default: ()=>[],
    },
    createReportApi: {
      type: String,
      default: '',
    },
    updateReportApi: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      mReport: null,
      is_all: true,
      loading: false,
      conditionList: [
        {name: 'ET', code:'and'},
        {name: 'OU', code:'or'},
      ],
      pageSizeSelected: {code: 'A4', name: 'A4'},
      pageOrientationSelected: {code: 'portrait', name: 'Portrait'},
      pageSizeList:[
        {code: 'A4', name: 'A4'},
        {code: 'A3', name: 'A3'},
        {code: 'A2', name: 'A2'},
        {code: 'A1', name: 'A1'},
        {code: 'A0', name: 'A0'},
      ],
      pageOrientationList:[
        {code: 'portrait', name: 'Portrait'},
        {code: 'landscape', name: 'Paysage'},
      ],
      operandList: [
        {name: 'Egal', code:'equals'},
        {name: 'Différent', code:'not-equal'},
        {name: 'Contient', code:'contains'},
        {name: 'Supérieur', code:'gt'},
        {name: 'Inférieur', code:'lt'},
        {name: 'Supérieur =', code:'gte'},
        {name: 'Inférieur =', code:'lte'},
        {name: 'Commence par', code:'start'},
        {name: 'Fini par', code:'end'},
        {name: 'Entre', code:'between'},
        {name: 'Est null', code:'isNull'},
        {name: 'Diff. de null', code:'isNotNull'}
      ],
      aggregatList: [
        {name: 'MIN', code:'min'},
        {name: 'MAX', code:'max'},
        {name: 'NOMBRE', code:'count'},
        {name: 'SOMME', code:'sum'},
        {name: 'DISTINCT', code:'distinct'},
        {name: 'MOYENNE', code:'avg'},
      ],
      orderList: [
        { name: 'ASC', code: 'asc'},
        { name: 'DESC', code: 'desc'},
      ],
      newFilter:  {
          isValid: false,
          title: null,
          dateReport: null,
          columns: [],
          conditions: [],
          groupBy: [],
          orderBy: [],
          options: {},
        }
    }
  },

  validations:{
    mReport: {required},
    newFilter:{
      title: {required},
      dateReport: {required},
      columns: {
        $each:{
          column: {required},
        }
      },
      conditions:{
        $each: {
          condition: {required},
          column: {required},
          operand: {required},
          //value: {required}
        }
      },
      orderBy:{
        $each: {
          column: {required},
          sens: {required},
        }
      },
      groupBy:{
        $each: {
          column: {required}
        }
      },

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
          this.newFilter.columns.push({column: null, aggregat: null, type: null, data: null, sumData: false})
          break
        case 'condition':
          this.newFilter.conditions.push({condition: null, column: null, operand: null, value:null})
          break
        case 'groupBy':
          this.newFilter.groupBy.push({column: null, name: null, sumData: false})
          break
        case 'orderBy':
          this.newFilter.orderBy.push({column: null, name: null})
          break
      }

    },

    removeItem(data, index){
      data.splice(index, 1)
    },

    //GESTION DES AGREGATS
    getAvailaibleAgregats(type){
      let agreg = []
      switch (type){
        case 'float4':
        case 'numeric':
        case 'int4':
          agreg.push({name: 'MIN', code:'min'})
          agreg.push({name: 'MAX', code:'max'})
          agreg.push({name: 'NOMBRE', code:'count'})
          agreg.push({name: 'SOMME', code:'sum'})
          agreg.push({name: 'MOYENNE', code:'avg'})
          break
        case 'date':
          agreg.push({name: 'MIN', code:'min'})
          agreg.push({name: 'MAX', code:'max'})
          agreg.push({name: 'NOMBRE', code:'count'})
          break
        case 'text':
        case 'varchar':
          agreg.push({name: 'NOMBRE', code:'count'})
          break
      }
      return agreg
    },


    //GESTION DES OPERANDES
    getAvailaibleOperands(type){
      let operands = []
      switch (type){
        case 'float4':
        case 'numeric':
        case 'int4':
          operands.push({name: 'Différent', code:'not-equal'})
          operands.push({name: 'Egal', code:'equals'},)
          operands.push({name: 'Supérieur', code:'gt'})
          operands.push({name: 'Inférieur', code:'lt'})
          operands.push({name: 'Supérieur =', code:'gte'})
          operands.push({name: 'Inférieur =', code:'lte'})
          operands.push({name: 'Est null', code:'isNull'})
          operands.push({name: 'Diff. de null', code:'isNotNull'})
          break
        case 'date':
        case 'timestamptz':
          operands.push({name: 'Egal', code:'equals'})
          operands.push({name: 'Différent', code:'not-equal'})
          operands.push({name: 'Supérieur', code:'gt'})
          operands.push({name: 'Inférieur', code:'lt'})
          operands.push({name: 'Supérieur =', code:'gte'})
          operands.push({name: 'Inférieur =', code:'lte'})
          operands.push({name: 'Entre', code:'between'})
          operands.push({name: 'Est null', code:'isNull'})
          operands.push({name: 'Diff. de null', code:'isNotNull'})
          break
        case 'varchar':
        case 'text':
          operands.push({name: 'Egal', code:'equals'})
          operands.push({name: 'Différent', code:'not-equal'})
          operands.push({name: 'Contient', code:'contains'})
          operands.push({name: 'Commence par', code:'start'})
          operands.push({name: 'Fini par', code:'end'})
          operands.push({name: 'Est null', code:'isNull'})
          operands.push({name: 'Diff. de null', code:'isNotNull'})
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

    generateFilter(){
      let columns = []
      let conditions = []
      let groupBy = []
      let orderBy = []
      let options = {}
      this.newFilter.isValid = !this.$v.$invalid
      this.newFilter.table = get(this.mReport,'table_name')
      columns = this.newFilter.columns.map(x => {
        return  {name: get(x, 'column.name'), code: get(x,'column.code'), aggregate: get(x, 'column.aggregat.code'), type: get(x, 'column.type'),
          data: get(x, 'column.data'), alias: get(x, 'column.alias'), sumData: get(x, 'column.sumData', true)}
      })
      conditions = this.newFilter.conditions.map(x => {
        return  {condition: get(x, 'condition.code'), name: get(x, 'column.code'), operand: get(x, 'operand.code'), value: get(x, 'value') }
      })
      groupBy = this.newFilter.groupBy.map(x =>{

        return {column: get(x, 'column.code'), sumData: get(x, 'sumData')}
      })
      orderBy = this.newFilter.orderBy.map(x =>{
        return {column: get(x, 'column.code'), order: get(x, 'sens.code')}
      })
      options = { pageSize: get(this.pageSizeSelected,'code'), pageOrientation: get(this.pageOrientationSelected, 'code')}

      return {
          id: get(this.newFilter, 'id'),
          table: get(this.mReport,'table_name'),
          title: get(this.newFilter, 'title'),
          column_date: get(this.newFilter, 'dateReport.code'),
          columns: columns,
          conditions: conditions,
          groupBy: groupBy,
          orderBy: orderBy,
          options: options
      }
    },

    change () {
      let val = this.filterReport
      this.$emit('input', clone(val))
    },

    reloadPage(id) {
      this.$emit('reloadPage', id)
    },

    showPreview(id) {
      this.change()
      this.$emit('showPreview', id)
      this.hide()
    },


    async submit(){

      this.$v.$touch()
      if (this.$v.$invalid) {
        this.Motify('error', 'Vérifiez si tous les champs sont correctement remplis!')
        return null
      }

      //IF VALIDATION IS OK
      let filter = this.filterReport

      let payload = {
        id: this.newFilter.id,
        report_table: get(this.mReport,'table_name'),
        table_description: get(this.mReport,'table_description'),
        report_title: get(this.newFilter,'title'),
        column_date: get(this.newFilter, 'dateReport.code'),
        is_all: this.is_all,
        //production_chain_id: this.productionChainUser.id,
        payload_query: filter
      }

      const msg = payload.id ? 'Rapport mis à jour' : 'Rapport créé!'
      let promise = payload.id ? this.createReportApi: this.updateReportApi
      this.hide()
      await this.$store.dispatch(promise, payload).then(async (res) => {

        await this.reloadPage(res.data.id)
        this.Loader.hide()
        this.change()
        this.Motify('success', msg)

      }).catch(err => {
        this.Motify('error', this._getErrorMessage(err))
        console.error(err);
        this.Loader.hide()

      })



    },

    //FONCTION DEPART
    ...mapActions({
      getReport: 'reports/getModulesReport',
      create: 'reports/saveReport',
      update: 'reports/updateReport',
    }),

    async mapForm(){

      this.mReport = this.reportList.find(x => get(x,'table_name') === get(this.newFilter,'table'))
      let temp = this.dateColumns.find(x => x.code === get(this.newFilter,'column_date'))
      //this.newFilter.dateReport = temp ? temp : null
      this.newFilter = {...this.newFilter, dateReport: temp ? temp : null}


      this.newFilter.columns = get(this.newFilter, 'columns', []).map(x => {
        return {
          column: {
            name: get(x, 'name'),
            code: get(x, 'code'),
            aggregat: this.aggregatList.find(y => y.code === get(x, 'aggregate')),
            type: get(x, 'type'),
            data: get(x, 'data'),
            alias: get(x, 'alias', ''),
            availaibleAggregat: this.getAvailaibleAgregats(get(x, 'type')),
            sumData: get(x, 'sumData', true),
          }
        }
      })

      this.newFilter.conditions= get(this.newFilter, 'conditions', []).map(x =>{
        return {
          condition: this.conditionList.find(y => y.code === get(x, 'condition')),
          column: this.columns.find(y => y.code === get(x, 'name')),
          operand: this.operandList.find(y => y.code === get(x, 'operand')),
          value: get(x, 'value')
        }
      })

      this.newFilter.groupBy =  get(this.newFilter, 'groupBy', []).map(x =>{
        return {
          column: this.columns.find(y => y.code === get(x, 'column')),
          sumData: get(x, 'sumData'),
        }
      })

      this.newFilter.orderBy =  get(this.newFilter, 'orderBy', []).map(x =>{
        return {
          column: this.columns.find(y => y.code === get(x, 'column')),
          sens: this.orderList.find(y => y.code === get(x, 'order')),
        }
      })

      //Les options
      this.pageSizeSelected = this.pageSizeList.find(x => x.code === get(this.newFilter, 'options.pageSize', 'A4'))
      this.pageOrientationSelected = this.pageOrientationList.find(x => x.code === get(this.newFilter, 'options.pageOrientation', 'portrait'))
    },

  },

  computed: {

    ...mapState({
      //reportList: state => get(state, `${this.reportState}.moduleList`),
      //dataReport: state => get(state, `${this.dataReportState}.dataReport`),
      //productionChainUser: state => state.productionChainUser.item,
    }),

    columns(){
      let data = []
      try{

        data = get(this.mReport, 'columns', []).map(x =>{

          let comment = JSON.parse(get(x, 'column_comment'))
          let agregats = this.getAvailaibleAgregats(get(x,'type'))
          let operands = this.getAvailaibleOperands(get(x,'type'))

        return {
          name: get(comment,'comment'),
          code: get(x,'column_name'),
          type: get(x,'type'),
          data: get(comment, 'value'),
          aggregats: agregats,
          operands: operands,
        }
        })
      }catch (error){
        console.log('error', error)
      }

      return data
    },

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

    filterReport(){
      this.$v.$touch()

      let data = this.generateFilter()
      data.isValid = !this.$v.$invalid
      this.$emit('input', clone(data))
      return data
    },

    canSave(){
      return this._can('create_pdf_params') || this._can('update_pdf_params')
    },

  },


  async mounted() {
    await this.getReport()

  },

  watch: {

    'value': {
      handler: async function (val, oldVal){
        if(val){
          this.newFilter = clone(val)
          if(Array.isArray(this.reportList) && this.reportList.length <= 0){
            this.loading = true
            await this.getReport()
            .finally(val => {
              this.loading = false
          })
          }
          await this.mapForm()
        }
      },
      deep: true,
      immediate: true,
    },

  }

}
</script>
