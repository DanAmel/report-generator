<template>
  <q-page class="flex-block">
    <div class="row full-width">
      <div class="col-xs-12">

        <div class="row no-wrap shadow-1">
          <q-toolbar class="col-12 bg-grey-e3">
            <q-toolbar-title class="text-body2">
              <q-breadcrumbs class="text-subtitle text-weight-medium" active-color="primary"
                             color="breadcrumb-inactive"
                             separator="/">
                <div slot="separator"  style="font-size: medium">/</div>
                <q-breadcrumbs-el
                  class="text-body"
                  style="font-size: 17px"
                  :icon="iconType+'arrow-circle-left'" label="Rapports" :to="returnUrl"/>
                <q-breadcrumbs-el
                  class="text-body"
                  style="font-size: 17px"
                  :label="filter? filter.title : ''" />

              </q-breadcrumbs>
            </q-toolbar-title>


            <ReportForm
              v-if="loadingComponent"
              v-show="canCreate"
              ref="ReportForm"
              v-model="filter"
              :icon-type="iconType"
              :label-filtre-boolean="labelFiltreBoolean"
              :redirect-url="redirectUrl"
              :report-list="reportList"
              :filter-datas="filterDatas"
              :create-report-api="createReportApi"
              :update-report-api="updateReportApi"
              :check-sql-api="checkSqlApi"
              :app-notice="appNotice"
              :return-url="updateReportApi"
              :request-params="params"
              :can-create="canCreate"
              :can-update="canUpdate"
              :can-edit-request="canEditRequest"
              v-on:reloadPage="reloadPage"
              v-on:showPreview="getStatsData('PDF')"
              v-on:showNotification="showNotification"
              v-on:showHideLoading="showHideLoading"
            />

            <q-btn :label="selectedRange" class="q-ml-sm q-px-md float-right" :color="buttonColorPrimary"
                   dense :icon="iconType+'calendar-alt'" unelevated>
              <q-popup-proxy transition-hide="scale" transition-show="scale" @before-show="updateProxy">
                <q-date v-model="datesRange" range :color="buttonColorPrimary">
                  <div class="row items-enter  q-gutter-sm">
<!--                    <q-btn v-close-popup :color="buttonColorSecondary" flat label="Annuler"/> -->
                    <q-btn v-close-popup :color="buttonColorPrimary" flat label="PDF" @click="getStatsData('PDF')"/>
                    <q-btn v-close-popup :color="buttonColorPrimary" flat label="Excel" @click="getStatsData('EXCEL')"/>
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-btn>

          </q-toolbar>
        </div>

      </div>

      <div class="col-12 q-ma-none q-px-lg text-center q-pt-sm" v-if="loading">
        <q-spinner-ios color="primary" size="2em"/>
        Chargement du rapport en cours
        <q-tooltip :offset="[0, 8]">Chargement du rapport en cours . . .</q-tooltip>
      </div>

      <div class="col-12 q-pb-xs q-pt-xs q-mt-xs q-mb-xs">

        <q-btn
          color="green" class="q-ml-sm"
          size="11px"
          v-if="_isDraft && canValidate && currentId"
          label="Valider" outline
          @click="validate('validated')"
          text-height="11">
          <q-tooltip>Valider le rapport. Après validation le rapport sera disponible pour les utilisateurs
          </q-tooltip>
        </q-btn>


        <q-btn
          color="red" class="q-ml-sm"
          size="11px"
          v-if="_isValidated && canCancel"
          label="ANNULER" outline
          @click="validate('draft')"
          text-height="11" >
          <q-tooltip>Annuler un rapport.
          </q-tooltip>
        </q-btn>

        <q-btn
          color="red" class="q-ml-sm"
          size="11px" :icon="iconType+'trash'"
          label="SUPPRIMER" outline
          v-if="canDelete && currentId"
          @click="onDelete"
          text-height="11"
        >
          <q-tooltip>Supprimer le rapport.
          </q-tooltip>
        </q-btn>



        <q-btn-group flat push class="float-right on-left">

          <q-btn push label="Brouillon" size="sm"
                 :color="_isDraft  ? 'grey-7' :'white'"
                 :text-color="_isDraft ? 'white' :'faded'"
          />

          <q-btn push label="Validé" size="sm"
                 :color="_isValidated ? 'green-7' :'white'"
                 :text-color="_isValidated ? 'white' :'faded'"
          />
        </q-btn-group>
      </div>

      <div class="col-12 ">

        <div slot="content"  id="iframeContainer" v-if="filter && !filter.isChart">
          <div class="row items-center justify-center ">
          </div>

          <object width="100%" style="height: calc(100vh - 180px)" ref="pdfv" :data="content"></object>
          <object ref="pdfv2" :data="content_xls"></object>

        </div>


        <div  style="background-color: white;" v-if="filter && filter.isChart">
          <q-card bordered class="q-ma-sm " flat >

            <fuse-chart
              :dataSource="chartDefinition.dataSource"
              :dataFormat="chartDefinition.dataFormat"
              :type="chartDefinition.type"
              height="500"
            />
          </q-card>
        </div>

      </div>

    </div>
  </q-page>
</template>

<script>

import get from "lodash/get";
import omit from "lodash/omit"
import assign from "lodash/assign"
import moment from "moment";

import chartGeneretor from "../render/chart"
import myLoadingComponent from "./loading"
import myErrorComponent from "./error"

const ReportForm = () => ({
  // The component to load (should be a Promise)
  component: import('./ReportForm'),
  // A component to use while the async component is loading
  loading: myLoadingComponent,
  // A component to use if the load fails
   error: myErrorComponent,
  // Delay before showing the loading component. Default: 200ms.
  delay: 10,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 1000 * 60 * 3
})


export default {

  name: "GeneratorIndex",
  // eslint-disable-next-line vue/no-unused-components
  components: {
    //ReportForm: () => import('./ReportForm'),
    ReportForm,
    FuseChart: () => import('./FuseChart')
  },

  async preFetch({store, currentRoute, previousRoute, redirect, ssrContext}) {
    let id = this.currentId

    /*if (id) {
      await store.dispatch(this.viewReportApi, {id})
    }*/
  },
  mixins: [],

  props: {

    canExport: {
      type: Boolean,
      default: false,
    },
    canValidate: {
      type: Boolean,
      default: false,
    },
    canCancel: {
      type: Boolean,
      default: false,
    },
    canCreate: {
      type: Boolean,
      default: false,
    },
    canUpdate: {
      type: Boolean,
      default: false,
    },
    canDelete: {
      type: Boolean,
      default: false,
    },
    canEditRequest: {
      type: Boolean,
      default: false,
    },
    pageState: {
      type: String,
      default: '',
    },
    currentId: {
      type: Number,
      default: null,
    },
    isElectron: {
      type: Boolean,
      default: false,
    },
    otherDatas: {
      type: Object,
    },
    /*otherDatas: {
      type: Promise,
    },
    */
    redirectUrl: {
      type: String,
      default: '',
    },
    buttonColorPrimary: {
      type: String,
      default: 'primary',
    },
    buttonColorSecondary: {
      type: String,
      default: 'secondary',
    },
    viewReportApi: {
      type: [String, Function],
      default: '',
    },
    getDataReportApi: {
      type: [String, Function],
      default: '',
    },
    getPdfReportApi: {
      type: [String, Function],
      default: '',
    },
    deleteReportApi: {
      type: [String, Function],
      default: '',
    },
    validateReportApi: {
      type: [String, Function],
      default: '',
    },
    createReportApi: {
      type: [String, Function],
      default: '',
    },
    updateReportApi: {
      type: [String, Function],
      default: '',
    },
    getModuleReportApi: {
      type: [String, Function],
      default: '',
    },
    checkSqlApi: {
      type: [String, Function],
      default: '',
    },
    returnUrl: {
      type: String,
      default: '',
    },
    labelFiltreBoolean: {
      type: String,
      default: '',
    },
     logo: {
      type: String,
      default: '',
    },
    reportList: {
      type: [Object, Array],
      default: ()=>[],
    },
    dataReport: {
      type: [Object, Array],
      default: ()=>[],
    },
    filterDatas: {
      type: Array,
      default: ()=>[],
    },
    currentReport: {
      type: Object,
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
      loadingComponent: false,
      isLoadingComponent: true,
      date_production: null,
      content: null,
      content_xls: null,
      datesRange: {
        from: null,
        to: null,
      },
      filter:null,
      chartDefinition: {
        dataFormat: "json",
        dataSource: {},
      },
      /*filter: {
        id: null,
        column_date: '',
        table: '',
        title: 'NOUVEAU RAPPORT',
        columns: [],
        conditions: [],
        groupBy: [],
        orderBy: [],
        is_all: true,
        isValid: true,
        options: {}
      },*/
      loading: false,
      actions: [],
      dataUrl: null,
      search: null,
      selected: [],
      grid: false,
      display: '',
    }
  },

  methods: {
    onDateChanged() {
    },

    updateProxy() {
      this.proxyTime = this.time
    },

    get,

    //Fonction qui recharge la page
    async reloadPage(id) {

      let promise
      if(typeof this.viewReportApi === 'string')
        promise = this.$store.dispatch(this.viewReportApi, {id})
      else
        promise = this.viewReportApi({id})

      await promise.then(value => { this.filter = this.generateFilter(value) })


    },

    //Fonction qui génère le filtre au format du composant au format en fonction du
    generateFilter(reportPdf) {

      let mFilter = {}
      mFilter.id = get(reportPdf, 'id')
      mFilter.column_date = get(reportPdf, 'column_date')
      mFilter.dateReport = {}
      mFilter.table = get(reportPdf, 'report_table')
      mFilter.title = get(reportPdf, 'report_title')
      mFilter.request_mode = get(reportPdf, 'payload_query.request_mode')
      mFilter.request_editor = get(reportPdf, 'payload_query.request_editor')
      mFilter.isChart = !!get(reportPdf, 'payload_query.isChart')
      mFilter.operand_date = get(reportPdf, 'payload_query.operand_date')
      mFilter.columns = get(reportPdf, 'payload_query.columns')
      mFilter.formulas = get(reportPdf, 'payload_query.formulas')
      mFilter.conditions = get(reportPdf, 'payload_query.conditions')
      mFilter.groupBy = get(reportPdf, 'payload_query.groupBy')
      mFilter.orderBy = get(reportPdf, 'payload_query.orderBy')
      mFilter.column_cross = get(reportPdf, 'payload_query.column_cross')
      mFilter.line_cross = get(reportPdf, 'payload_query.line_cross')
      mFilter.value_cross = get(reportPdf, 'payload_query.value_cross')
      mFilter.chart = get(reportPdf, 'payload_query.chart', {})
      mFilter.options = get(reportPdf, 'payload_query.options')
      mFilter.is_all = get(reportPdf, 'payload_query.is_all')
      mFilter.apply_filter = !!get(reportPdf, 'payload_query.filterBy')
      mFilter.filterBy = get(reportPdf, 'payload_query.filterBy')
      mFilter.isValid = true
      mFilter.app_code = get(reportPdf, 'app_code')
      mFilter.app_notice = get(reportPdf, 'app_notice')
      mFilter.options = get(reportPdf, 'payload_query.options')

      //Récupération de la date du rapport pour les conditions
      mFilter.conditions.forEach(x =>{
        if( (x.type === "timestamptz" || x.type === "date") &&  get(mFilter, "operand_date.code") === x.operand){

          let start_date = this.datesRange.from ? moment(this.datesRange.from).format("YYYY-MM-DD") : moment(this.datesRange).format("YYYY-MM-DD")
          let end_date = this.datesRange.to ? moment(this.datesRange.to).format("YYYY-MM-DD") : moment(this.datesRange).format("YYYY-MM-DD")

          if(x.operand === "between")
            x.value = `${start_date},${end_date}`
        }
      })

      return mFilter
    },


    //Appel des fonctions d'affichage du PDF
    async setupPdf(payload, type='PDF') {

      this.loading = true
      if(this.content)
        window.URL.revokeObjectURL(this.content)

      const url = window.URL.createObjectURL(payload)
      if(type === 'PDF')
        this.content = url
      else
        this.content_xls = url
      //this.dataUrl = await this.blobToBase64(payload)
      this.loading = false

    },

    //Appel des fonctions pour la génération de graphiques
    async setupChart(payload) {

      this.loading = true
      //console.log("payload", payload)

      let chartDefinition = chartGeneretor(payload)

      this.chartDefinition = {
        dataSource: chartDefinition.dataSource,
        type: chartDefinition.type,
      }

    },

    showNotification(notification) {
      this.$emit('showNotification', notification)
    },

    showHideLoading(show) {
      this.$emit('showHideLoading', show)
    },

    //Récupère les données du rapport provenant du backend
    async getStatsData(type = "PDF") {
      //console.log('this.filter.isValid', this.filter.isValid)

      try{
        if(this.$refs.ReportForm)
          this.$refs.ReportForm.change()
      }catch (e){
        //Le composant n'est pas encore disponible...
        return null
      }

      if (!this.filter || !this.filter.isValid) {
        //this.Motify(false, 'Veuillez remplir toutes les données')
        this.showNotification({type: false,  message: 'Veuillez remplir toutes les données'})
        return null
      }

      let start_date = this.datesRange.from ? moment(this.datesRange.from).format( 'YYYY-MM-DD') : moment(this.datesRange).format( 'YYYY-MM-DD')
      let end_date = this.datesRange.to ?  moment(this.datesRange.to).format( 'YYYY-MM-DD') : moment(this.datesRange).format('YYYY-MM-DD')

      if(start_date !== end_date &&  get(this.filter, 'operand_date.code', "between") !== "between"){
        this.showNotification({type: false,  message: "Changez le type de filtre à Entre ou choissiez une date unique"})
        return null
      }

      this.loading = true
      this.filter.conditions.forEach(x =>{
        if( (x.type === "timestamptz" || x.type === "date") &&  get(this.filter, "operand_date.code") === x.operand && !x.use_variable){

          let start_date = this.datesRange.from ? moment(this.datesRange.from).format("YYYY-MM-DD") : moment(this.datesRange).format("YYYY-MM-DD")
          let end_date = this.datesRange.to ? moment(this.datesRange.to).format("YYYY-MM-DD") : moment(this.datesRange).format("YYYY-MM-DD")
          if(x.operand === "between"){
            x.value = []
            x.value.push(start_date)
            x.value.push(end_date)
          }
          else
            x.value = start_date
        }

      })

      //console.log(" get(this.filter, 'app_code')",  get(this.filter, 'app_code'))
      //console.log("get(this.filter, 'request_mode')", get(this.filter, 'request_mode'))
      let params = null
      if(get(this.filter, 'request_mode') === "sql"){
        this.filter.request_editor.params = this.params
        params = this.params
      }
      else
        params = omit(this.params, ['start_date', 'end_date'])

      let form = {
        start_date: start_date,
        end_date: end_date,
        filter: this.filter,
        title: get(this.filter, 'title'),
        table: get(this.filter, 'table'),
        column_date: get(this.filter, 'column_date'),
        operand_date: get(this.filter, 'operand_date.code', "between"),
        app_code: get(this.filter, 'app_code', 'SERP'),
        app_notice: this.appNotice,
        is_all: get(this.filter, 'is_all', true),
        type: type === "PDF" ? 'pdf' : 'xls'
      }

      //console.log("this.params", this.params)
      form = assign(form, params)


      //console.log("this.filter.isChart", this.filter.isChart)
      if(this.filter.isChart){ //Affichage des graphes
        let promise
        if(typeof this.getDataReportApi === "string")
          promise = this.$store.dispatch(this.getDataReportApi, form)
        else
          promise = this.getDataReportApi(form)

        promise
          .then(value => {
            this.setupChart(value)
          })
          .catch(err =>{
            console.error('err', err)
            this.showNotification({type: false,  message: 'Une erreur est survenue : Veuillez contactez votre correspondant IT'})
          })
          .finally(() => this.loading = false)
      }
      else {
        let promise
        if(typeof this.getPdfReportApi === "string")
          promise = this.$store.dispatch(this.getPdfReportApi, form)
        else
          promise = this.getPdfReportApi(form)

        promise
          .then(value => {
            this.setupPdf(value, type)
          })
          .catch(err =>{
            console.error('err', err)
            this.showNotification({type: false,  message: 'Une erreur est survenue : Veuillez contactez votre correspondant IT'})
          })
          .finally(() => this.loading = false)
      }

    },

    //Impression du rapport (uniquement pour le mode Electron)
    onPrint() {

      /*this.$q.dialog({
        title: 'Confirmer',
        message: 'Voulez-vous imprimer ce document ?',
        cancel: true,
        persistent: false
      }).onOk(() => {
        if (this.isElectron) {
          //console.log("in electron")
          const {ipcRenderer} = require('electron')
          ipcRenderer.on('asynchronous-reply', (event, arg) => {
           // console.log(arg)
          })
          ipcRenderer.send('print-pdf', this.dataUrl)
          console.log("send dataUrl", this.dataUrl)
        }
      })*/

    },

    onDelete() {

      this.$q.dialog({
        title: 'Confirmer la suppression',
        message: 'Voulez-vous supprimer ce rapport ?',
        cancel: true,
        persistent: false
      }).onOk(async () => {
        let result

        if(typeof this.deleteReportApi === "string")
          result = this.$store.dispatch(this.deleteReportApi, {id: this.currentId})
        else
          result = this.deleteReportApi({id: this.currentId})

        await result
          .then(async (value) => {
            //this.Motify('success', "Le rapport a bien été supprimé", '/generate/reports')
            this.showNotification({type: true,  message: "Le rapport a bien été supprimé",  path: "/apps/statistics/reports-list"})

          })
          .catch(error =>{
            //this.Motify('error', "Impossible de supprimer le rapport")
            this.showNotification({type: false,  message: "Impossible de supprimer le rapport"})
            console.log('error', error)
          })
      })

    },

    getMonthDateRange(date) {
      const startDate = moment(date).clone().startOf('month').format('YYYY-MM-DD');
      const endDate = moment(date).clone().endOf('month').format('YYYY-MM-DD');
      return {start: startDate, end: endDate};
    },

    async validate(status) {
      if(this.currentId) {

        this.$q.dialog({
          title: "Voulez-vous changer le statut",
          message: 'Voulez-vous changer le statut de ce rapport ?',
          cancel: true,
          persistent: false
        }).onOk(async () => {
          let promise
          if(typeof this.validateReportApi === "string")
            promise = this.$store.dispatch(this.validateReportApi, {id: this.currentId, status: status})
          else
            promise = this.validateReportApi({id: this.currentId, status: status})
          await promise
              .then(async (value) => {
                //On actualise le rapport
                let promise2
                if(typeof this.viewReportApi === "string")
                  promise2 = this.$store.dispatch(this.viewReportApi, {id: value.data.id})
                else
                  promise2 = this.viewReportApi({id: value.data.id})

                await promise2
                //this.Motify('success', "Opération réussie")
                this.showNotification({type: true,  message: "Opération réussie", path: null, query: null}, )
              })
        })

      }
    },

    async blobToBase64(blob) {
      var reader = new FileReader();

      reader.readAsDataURL(blob);
      return new Promise(resolve => reader.onloadend = function () {
        var base64data = reader.result;
        resolve(base64data)
      })
    },

    getLibelleDate(start_date, end_date, operand){
      let libelle = ''

      switch (operand){
        case 'not-equal':
          libelle = `différente de ${end_date}`
          break;
        case 'gt':
          libelle = `à date supérieure à ${end_date}`
          break;
        case 'lt':
          libelle = `antérieure à ${end_date}`
          break;
        case 'gte':
          libelle = `à date supérieure ou égale à ${end_date}`
          break;
        case 'lte':
          libelle = `au ${end_date}`
          break;

        case 'between':
        default:
          libelle = `du ${start_date} au ${end_date}`
          break;
      }
      return libelle

    },

    async prefetchData(){
      if (this.pageState === 'view') {
        let promise
        if(typeof this.viewReportApi === "string")
          promise = this.$store.dispatch(this.viewReportApi, {id: this.currentId})
        else
          promise = this.viewReportApi({id: this.currentId})

        await promise.then(value => {
          this.filter = this.generateFilter(value)
        })
        await this.getStatsData('PDF')
      }
    }

  },

  computed: {

    _isDraft() {
      return  this.currentReport && get(this.currentReport, 'status') === 'draft'
    },

    _isValidated() {
     return this.currentReport && get(this.currentReport, 'status') === 'validated'
    },


    selectedDates() {
      if (!!this.datesRange) {
        if (typeof this.datesRange === 'string') {
          return {from: this.datesRange, to: this.datesRange}
        }
        if (typeof this.datesRange === 'object') {
          return {
            from: this.datesRange.from, to: this.datesRange.to
          }
        }
      }
      return null
    },

    selectedRange() {
      if (!!this.datesRange) {
        if (typeof this.datesRange === 'string') {
          return moment(this.datesRange).format( 'DD-MM-YYYY')
        }
        if (typeof this.datesRange === 'object') {
          let from = get(this.datesRange, 'from') ? moment(this.datesRange.from).format('DD-MM-YYYY') : ''
          let to = get(this.datesRange, 'to') ? moment(this.datesRange.to).format('DD-MM-YYYY') : ''
          return from + ' - ' + to
        }
      }
      return 'Selectionner une date'
    },

    params(){
      let dat =   this.otherDatas


      let start_date = this.datesRange.from ? moment(this.datesRange.from).format( 'YYYY-MM-DD') : moment(this.datesRange).format( 'YYYY-MM-DD')
      let end_date = this.datesRange.to ?  moment(this.datesRange.to).format( 'YYYY-MM-DD') : moment(this.datesRange).format('YYYY-MM-DD')

      if(start_date !== end_date &&  get(this.filter, 'operand_date.code', "between") !== "between"){
        this.showNotification({type: false,  message: "Changez le type de filtre à Entre ou choissiez une date unique"})
        return null
      }

      dat.start_date = `'${start_date}'`
      dat.end_date = `'${end_date}'`
      //console.log("dat",dat)
      return dat
    }
  },

  async mounted() {


    //chargement du Module report
    this.loadingComponent = true
    //this.loading = true
    //loadReportGenerator().finally(() => this.loading = false)

    if( get(this.currentReport, "payload_query.operand_date.code", "between") === 'between'){
      let dateRange = this.getMonthDateRange(new Date())
      this.datesRange.from = dateRange.start
      this.datesRange.to = dateRange.end
    }
    else{
      this.datesRange = moment().format("YYYY-MM-DD")
    }

    //console.log("pageState", this.pageState)
    //this.prefetchData()
  },

  beforeDestroy() {
    if (this.content)
      window.URL.revokeObjectURL(this.content)
  },

  watch: {
    'pageState': {
      handler: async function (val, oldVal){
        if(val) {
          this.prefetchData()
        }
      },
      deep: true,
      immediate: true,
    },
  }
}
</script>

<style scoped lang="scss">
.l-border {
  border-left: 1px solid #e9e9e9;
}

.r-border {
  border-right: 1px solid #e9e9e9;
}

.b-border {
  border-bottom: 1px solid #e9e9e9;
}

.t-border, {
  border-top: 1px solid #e9e9e9;
}

</style>
