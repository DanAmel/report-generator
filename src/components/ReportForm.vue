<template>
  <div class="row q-mb-sm q-mt-xs">
    <div class="col-12">

        <q-btn-dropdown
          ref="dialog"
          flat color="white" dense stretch
          text-color="black" size="md"
          class="float-right on-right q-pt-xs"
          label="GENERATEUR">

          <q-card class="my-card" style="min-width: 950px" >

            <q-card-section>

              <div class="col-12 q-ma-none q-px-lg text-center q-pt-sm" v-if="loading">
                <q-spinner-ios color="primary" size="2em"/>
                Chargement en cours...
                <q-tooltip :offset="[0, 8]">Veuillez patienter . . .</q-tooltip>
              </div>

              <div class="row no-wrap q-pt-md q-pl-md">


                <div class="col-md-5">
                  <q-select  dense outlined class="q-mr-md"
                     label="Module"
                     v-model="mReport"
                     :options="reportList"
                     :hide-bottom-space="true"
                     option-label="table_description" option-value="table_name"
                     :options-dense="true"> </q-select>
                </div>
                <div class="col-md-4">
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

                <div class="col-md-3">

                  <q-select  dense outlined class="" clearable
                             v-model="newFilter.operand_date"
                             label="Type de filtre"
                             :options="getAvailaibleOperands('date')"
                             :hide-bottom-space="true"
                             option-label="name" option-value="code"
                             @m-blur="$v.newFilter.operand_date.$touch"
                             :error="$v.newFilter.operand_date.$error"
                             :options-dense="true"
                  > </q-select>

                </div>


              </div>

              <div class="row no-wrap q-pa-md">
                <div class="col-md-10">
                  <span class="text-h7 col-md-8"><q-input v-if="newFilter" class="q-mr-md" dense label="Titre" v-model="newFilter.title" @m-blur="$v.newFilter.title.$touch"
                                                          :error="$v.newFilter.title.$error" /></span>
                </div>
                <div class="col-md-2">
                  <q-checkbox  class="q-mt-lg" dense v-model="is_all" :label="labelFiltreBoolean" left-label />
                </div>
              </div>

              <div class="row no-wrap q-pa-md" v-if="false">
                <div class="col-md-10">
                  <q-select  dense outlined class="q-mr-md"
                             v-if="apply_filter"
                             label="Filtrer Sans"
                             v-model="reportFilter"
                             :options="filterDatas"
                             :hide-bottom-space="true"
                             option-label="name" option-value="id"
                             use-chips
                             :multiple="true"
                             :options-dense="true"> </q-select>
                </div>
                <div class="col-md-2">
                  <q-checkbox  class="q-mt-lg" dense v-model="apply_filter" label="Appliquer le filtre" left-label />
                </div>
              </div>

              <div class="row no-wrap q-pa-md">

                <div class="col-6">

                  <q-select  dense outlined class="q-mr-md" clearable
                             v-model="pageSizeSelected"
                             label="Format papier du rapport"
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
                <div class="col-6 justify-start">

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

              </div>

              <q-tabs
                v-model="tab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                inline-label
                align="justify"
                narrow-indicator>
                <q-tab name="tab-data" label="Source de Données" />
                <q-tab name="tab-cross" label="Tableau croisé dynamique" />
              </q-tabs>

              <q-separator />
              <q-tab-panels v-model="tab" animated>

                <q-tab-panel name="tab-data">
                  <TabData
                    :newFilter="newFilter"
                    :columns="columns"
                    :validator="$v"
                  />
                </q-tab-panel>

                <q-tab-panel name="tab-cross">

                  <TabCross
                    :newFilter="newFilter"
                    :columns="columns"
                    :validator="$v" />
                </q-tab-panel>

              </q-tab-panels>


            </q-card-section>



            <q-card-actions class="q-pr-md items-center" align="right">
              <div class="row">
                <q-btn class="q-pr-xs" :icon="iconType+'eye'" flat align="right" @click="showPreview" v-if="canCreate">

                  <q-tooltip>
                    Prévisualisation
                  </q-tooltip>
                </q-btn>

                <q-btn class="q-pr-xs" :icon="iconType+'save'" flat align="right" @click="submit" v-if="canCreate">
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
import {mapActions, mapState} from "vuex";
import {required, requiredIf} from 'vuelidate/lib/validators'
import {Parser} from 'expr-eval'

const expression = (value) => {
  try{
    let parser = new Parser()
    let expr = parser.parse(value)
    return true
  }catch (e){
    return false
  }
}

const checkVariable = (value) => {
  let temoin = true
  if(value.length > 0){
    for(let i=0; i<value.length; i++){
      if(!value[i].column || !value[i].variable)
        temoin =  false
      if(!temoin)
        break;
    }
  }
  else
    temoin =  false

  return temoin
}

export default {
  name: 'ReportForm',
  components: {
    TabData: () => import('./TabData'),
    TabCross: () => import('./TabCross')
  },
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
    getModuleReportApi: {
      type: String,
      default: '',
    },
    canCreate: {
      type: Boolean,
      default: false,
    },
    canUpdate: {
      type: Boolean,
      default: false,
    },
    redirectUrl: {
      type: String,
      default: '',
    },
    filterDatas: {
      type: Array,
      default: ()=>[],
    },
    labelFiltreBoolean: {
      type: String,
      default: '',
    },
    appNotice: {
      type: String,
      default: '',
    },
    iconType: {
      type: String,
      default: 'fa fa-',
    },
  },

  data() {
    return {
      mReport: null,
      is_all: true,
      apply_filter: false,
      loading: false,
      tab: 'tab-data',
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
      newFilter:  {
          isValid: false,
          title: null,
          dateReport: null,
          operand_date: null,
          columns: [],
          conditions: [],
          groupBy: [],
          orderBy: [],
          column_cross: [],
          line_cross: [],
          value_cross: [],
          formulas: [],
          app_code: '',
          app_notice: '',
          options: {},
        },
      validator: this.$v,
      conditionList: [
        {name: 'ET', code:'and'},
        {name: 'OU', code:'or'},
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
      reportFilter: []
    }
  },

  validations:{
    mReport: {required},
    newFilter:{
      title: {required},
      dateReport: {required},
      operand_date: {required},
      columns: {
        $each:{
          column: {required},
        }
      },
      formulas: {
        $each:{
          expression: {required, expression},
          alias: {required},
          variables: {checkVariable},
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

      column_cross: {
        $each: {
          column: {required},
        }
      },

      line_cross: {
        $each: {
          column: {required},
        }
      },

      value_cross: {
        $each: {
          column: {required},
          //aggregat: {required},
        }
      },

    }
  },

  methods: {
    get,

    hide(evt){
      this.$refs.dialog.hide()
    },

    showNotification(notification) {
      this.$emit('showNotification', notification)
    },

    showHideLoading(show) {
      this.$emit('showHideLoading', show)
    },

    //GESTION DES AGREGATS
    getAvailaibleAgregats(type){
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
        case 'float8':
        case 'numeric':
        case 'int4':
        case 'int8':
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

    //Fonction qui transforme la donnée en donnée exploitable par le generateur
    generateFilter(){

      let columns = []
      let conditions = []
      let groupBy = []
      let orderBy = []
      let column_cross = []
      let line_cross = []
      let value_cross = []
      let formulas = []
      let options = {}
      this.newFilter.isValid = !this.$v.$invalid
      this.newFilter.table = get(this.mReport,'table_name')

      columns = this.newFilter.columns.map(x => {

        return  {name: get(x, 'column.name'), code: get(x,'column.code'), aggregate: get(x, 'column.aggregat.code'), type: get(x, 'column.type'),
          data: get(x, 'column.data'), alias: get(x, 'column.alias'), sumData: get(x, 'column.sumData')}
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

      column_cross = this.newFilter.column_cross.map(x => {
        return  {name: get(x, 'column.name'), column: get(x,'column.code'), aggregate: get(x, 'aggregat.code'), type: get(x, 'column.type'),
          }
      })
      line_cross = this.newFilter.line_cross.map(x => {
        return  {name: get(x, 'column.name'), column: get(x,'column.code'), aggregate: get(x, 'aggregat.code'), type: get(x, 'column.type'),
          }
      })
      value_cross = this.newFilter.value_cross.map(x => {
        return  {name: get(x, 'column.name'), column: get(x,'column.code'), aggregate: get(x, 'aggregat.code'), type: get(x, 'column.type'),
          alias: get(x, 'column.alias')
        }
      })

      formulas = this.newFilter.formulas.map(x => {
        return  {expression: get(x, 'expression'), alias: get(x,'alias'), sumData: get(x, 'sumData') , variables: get(x, 'variables')}
      })

      return {
          id: get(this.newFilter, 'id'),
          table: get(this.mReport,'table_name'),
          title: get(this.newFilter, 'title'),
          operand_date: get(this.newFilter, 'operand_date'),
          column_date: get(this.newFilter, 'dateReport.code'),
          app_code: get(this.mReport, 'app_code'),
          app_notice: this.appNotice,
          is_all: this.is_all,
          columns: columns,
          conditions: conditions,
          groupBy: groupBy,
          orderBy: orderBy,
          column_cross: column_cross,
          line_cross: line_cross,
          value_cross: value_cross,
          formulas: formulas,
          options: options
      }
    },

    change () {
      //console.log(`in change`, this.filterReport)
      let val = this.filterReport
      this.$emit('input', clone(val))
    },

    reloadPage(id) {
      this.$emit('reloadPage', id)
    },

    showPreview(id) {
      //console.log("1 showPreview")
      this.change()

      this.$v.$touch()
      console.log("this.$v", this.$v)
      if (this.$v.$invalid) {
        this.showNotification({type: false,  message: 'Vérifiez si tous les champs sont correctement remplis!'})
        return null
      }

      this.$emit('showPreview', id)
      this.hide()
    },

    async submit(){

      this.$v.$touch()
      console.log("this.$v", this.$v)
      if (this.$v.$invalid) {
        //this.Motify('error', 'Vérifiez si tous les champs sont correctement remplis!')
        this.showNotification({type: false,  message: 'Vérifiez si tous les champs sont correctement remplis!'})
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
        operand_date: get(this.newFilter, 'operand_date.code'),
        is_all: this.is_all,
        app_code: get(this.mReport,'app_code'),
        app_notice: this.appNotice,
        //production_chain_id: this.productionChainUser.id,
        payload_query: filter
      }

      const msg = payload.id ? 'Rapport mis à jour avec succès' : 'Rapport créé avec succès!'

      let promise = !payload.id? this.createReportApi: this.updateReportApi
      this.hide()
      //console.log("payload",  payload.id ? this.createReportApi: this.updateReportApi)
      await this.$store.dispatch(promise, payload).then(async (res) => {

        //await this.reloadPage(res.data.id)

        //this.Loader.hide()
        this.showHideLoading(false)
        this.change()
        //this.Motify('success', msg)
        this.showNotification({type: true,  message: msg, path: this.redirectUrl, query: {id: get(res, "data.id"), desc: get(res, "data.report_title")}})

      }).catch(err => {
        //this.Motify('error', this._getErrorMessage(err))
        this.showNotification({type: false,  message:  get(err, 'response.data.message', '') })
        console.error(err);
        //this.Loader.hide()
        this.showHideLoading(false)
      })


    },

    //FONCTION DEPART
    ...mapActions({
    }),

    //Fonction qui transforme la donnée en objet exploitable par le générateur
    async mapForm(){

      this.mReport = this.reportList.find(x => get(x,'table_name') === get(this.newFilter,'table'))
      let temp = this.dateColumns.find(x => x.code === get(this.newFilter,'column_date'))
      //this.newFilter.dateReport = temp ? temp : null

      this.newFilter = {...this.newFilter, dateReport: temp ? temp : null}

      this.is_all = get(this.newFilter,'is_all')

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
            sumData: get(x, 'sumData'),
          }
        }
      })

      this.newFilter.conditions= get(this.newFilter, 'conditions', []).map(x =>{

        return {
          column: this.columns.find(y => y.code === get(x, 'name')),
          condition: this.conditionList.find(y => y.code === get(x, 'condition')),
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

      //Données du tableau croisé dynamique
      this.newFilter.column_cross = get(this.newFilter, 'column_cross', []).map(x => {

        return {
          //column: this.columns.find(y => y.code === get(x, 'column')),
          column: {
            name: get(x, 'name'),
            code: get(x, 'column'),
            //aggregat: this.aggregatList.find(y => y.code === get(x, 'aggregate')),
            type: get(x, 'type'),
            //data: get(x, 'data'),
            //availaibleAggregat: this.getAvailaibleAgregats(get(x, 'type')),
            sumData: get(x, 'sumData'),
          },
          aggregat: this.aggregatList.find(y => y.code === get(x, 'aggregat')),
          sumData: get(x, 'sumData'),
        }
      })

      this.newFilter.line_cross = get(this.newFilter, 'line_cross', []).map(x => {
        return {
          //column: this.columns.find(y => y.code === get(x, 'column')),
          column: {
            name: get(x, 'name'),
            code: get(x, 'column'),
            //aggregat: this.aggregatList.find(y => y.code === get(x, 'aggregate')),
            type: get(x, 'type'),
            data: get(x, 'data'),
            //availaibleAggregat: this.getAvailaibleAgregats(get(x, 'type')),
            sumData: get(x, 'sumData'),
          },
          aggregat: this.aggregatList.find(y => y.code === get(x, 'aggregat')),
        }
      })

      this.newFilter.value_cross = get(this.newFilter, 'value_cross', []).map(x => {
        //console.log('qqqqqqq',x)
        return {
          //column: this.columns.find(y => y.code === get(x, 'column')),
          column: {
            name: get(x, 'name'),
            code: get(x, 'column'),
            aggregat: this.aggregatList.find(y => y.code === get(x, 'aggregate')),
            type: get(x, 'type'),
            data: get(x, 'data'),
            //availaibleAggregat: this.getAvailaibleAgregats(get(x, 'type')),
            sumData: get(x, 'sumData'),
          }
        }
      })

      this.newFilter.formulas = get(this.newFilter, 'formulas', []).map(x => {
        //console.log('qqqqqqq',x)
        return {
          expression: get(x, 'expression'),
          alias: get(x, 'alias'),
          variables: get(x, 'variables'),
          sumData: get(x, 'sumData'),
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
  },

  watch: {

    'value': {
      handler: async function (val, oldVal){
        if(val){
          this.newFilter = clone(val)
          if(Array.isArray(this.reportList) && this.reportList.length <= 0){

          }
          await this.mapForm()
        }
      },
      deep: true,
      immediate: true,
    },

    'reportList': {
      handler: async function (val, oldVal){
        if(val){
          this.mReport = this.reportList.find(x => get(x,'table_name') === get(this.newFilter,'table'))
          let temp = this.dateColumns.find(x => x.code === get(this.newFilter,'column_date'))
          this.newFilter = {...this.newFilter, dateReport: temp ? temp : null}
        }
      },
      deep: true,
      immediate: true,
    },

  }

}
</script>
