<template>
  <q-page class="flex flex-block">
    <div class="row full-width">
      <div class="col-xs-12">

        <div class="row no-wrap shadow-1">
          <q-toolbar class="col-12 bg-grey-e3">
            <q-toolbar-title class="text-body2">
              <q-breadcrumbs class="text-subtitle text-weight-medium" active-color="primary"
                             color="breadcrumb-inactive"
                             separator="/">
                <div slot="separator" slot-scope="props" style="font-size: medium">/</div>
                <q-breadcrumbs-el
                  class="text-body"
                  style="font-size: 17px"
                  icon="fa fa-arrow-circle-left" label="Rapports" :to="returnUrl"/>
                <q-breadcrumbs-el
                  class="text-body"
                  style="font-size: 17px"
                  :label="filter? filter.title : ''" />

              </q-breadcrumbs>
            </q-toolbar-title>

            <ReportForm
              v-show="true"
              ref="ReportForm"
              v-model="filter"
              :label-filtre-boolean="labelFiltreBoolean"
              :redirect-url="redirectUrl"
              :report-list="reportList"
              :filter-datas="filterDatas"
              :create-report-api="createReportApi"
              :update-report-api="updateReportApi"
              :return-url="updateReportApi"
              :can-create="canCreate"
              :can-update="canUpdate"
              v-on:reloadPage="reloadPage"
              v-on:showPreview="getStatsData('PDF')"
              v-on:showNotification="showNotification"
              v-on:showHideLoading="showHideLoading"
            />

            <q-btn :label="selectedRange" class="q-ml-sm q-px-md float-right" :color="buttonColorPrimary"
                   dense icon="fa fa-calendar-alt" unelevated>
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

      <div class="col-12 q-pb-xs q-pt-xs  q-mt-xs q-mb-xs">

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
          size="11px" icon="fa fa-trash"
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

        <div slot="content" style="background-color: white; height:1000px" id="iframeContainer">
          <div class="row items-center justify-center ">
          </div>


          <!--          <div ref="pdfv"></div>-->
          <object width="100%" height="1000px" ref="pdfv" :data="content"></object>

          <!--          <pdf height="1000px"
                         :url="content"></pdf>-->
        </div>

      </div>

    </div>
  </q-page>
</template>

<script>

import {mapActions, mapState} from "vuex";
import get from "lodash/get";
import assign from "lodash/assign"
import moment from "moment";
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.pdfMake.vfs

import ReportForm from "./ReportForm";
import RenderReport from "../render/render.js"
import dataGeneretor from "../render/generator"
import {ExcelConverter} from 'pdfmake-to-excel';
//import RenderReport from "../render/generator"


export default {

  name: "GeneratorIndex",
  // eslint-disable-next-line vue/no-unused-components
  components: {ReportForm},

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
      default: '',
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
      type: Promise,
    },
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
      type: String,
      default: '',
    },
    getDataReportApi: {
      type: String,
      default: '',
    },
    deleteReportApi: {
      type: String,
      default: '',
    },
    validateReportApi: {
      type: String,
      default: '',
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
    }
  },

  data() {
    return {
      date_production: null,
      content: null,
      datesRange: {
        from: null,
        to: null,
      },
      filter:null,
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

    _formatDate(date, format = 'YYYY-MM-DD HH:mm') {
      //return date ? moment(date).tz(moment.tz.guess()).format(format) : date;
      return date ? moment(date).format(format) : date;
    },

    //Fonction qui recharge la page
    async reloadPage(id) {
      await this.$store.dispatch(this.viewReportApi, {id}).then(value => {
        this.filter = this.generateFilter(value)
      })

    },

    //Fonction qui génère le filtre au format du composant au format en fonction du
    generateFilter(reportPdf) {

      let mFilter = {}
      mFilter.id = get(reportPdf, 'id')
      mFilter.column_date = get(reportPdf, 'column_date')
      mFilter.dateReport = {}
      mFilter.table = get(reportPdf, 'report_table')
      mFilter.title = get(reportPdf, 'report_title')
      mFilter.operand_date = get(reportPdf, 'payload_query.operand_date')
      mFilter.columns = get(reportPdf, 'payload_query.columns')
      mFilter.conditions = get(reportPdf, 'payload_query.conditions')
      mFilter.groupBy = get(reportPdf, 'payload_query.groupBy')
      mFilter.orderBy = get(reportPdf, 'payload_query.orderBy')
      mFilter.column_cross = get(reportPdf, 'payload_query.column_cross')
      mFilter.line_cross = get(reportPdf, 'payload_query.line_cross')
      mFilter.value_cross = get(reportPdf, 'payload_query.value_cross')
      mFilter.options = get(reportPdf, 'payload_query.options')
      mFilter.is_all = get(reportPdf, 'payload_query.is_all')
      mFilter.apply_filter = get(reportPdf, 'payload_query.filterBy') ? true : false
      mFilter.filterBy = get(reportPdf, 'payload_query.filterBy')
      mFilter.isValid = true
      mFilter.app_code = get(reportPdf, 'app_code')
      mFilter.options = get(reportPdf, 'payload_query.options')

      return mFilter
    },

    ...mapActions({
    }),

    //Appel des fonction d'affichage du PDF
    async setupPdf(payload) {

      this.loading = true
      payload.campaign = get(this.currentCampaign, 'name')
      payload.user_name = get(this._currentUser, 'account.employee.full_name')
      payload.production_chain_name = get(this.productionChainUser, 'name')
      payload.start_date = this.datesRange.from ? moment(this.datesRange.from).format("DD/MM/YYYY") : moment(this.datesRange).format("DD/MM/YYYY")
      payload.end_date = this.datesRange.to ? moment(this.datesRange.to).format("DD/MM/YYYY") : moment(this.datesRange).format("DD/MM/YYYY")

      payload.periode = this.getLibelleDate(payload.start_date, payload.end_date,  _.get(payload, "filter.operand_date.code", "between"))


      //payload.campaign = this.currentCampaign

       let dat =  await this.otherDatas.then(val => val)
      //console.log("this.otherDatas", dat)

       payload = assign(payload, dat)

      let docDefinition = RenderReport(payload)
      const pdfDocGenerator = pdfMake.createPdf(docDefinition)

      pdfDocGenerator.getBlob(async (blob) => {

        if (this.content)
          window.URL.revokeObjectURL(this.content)

        const url = window.URL.createObjectURL(blob)
        this.content = url
        this.dataUrl = await this.blobToBase64(blob)

        this.loading = false

      })

    },

    downloadExcelFile(value) {
     let content = dataGeneretor(value)
      let contentDefinition = {
       title: content.title,
        logo: this.logo,
        data: get(content, 'table.table.body')
      }
      console.log("content", contentDefinition)
      const exporter = new ExcelConverter(contentDefinition.title, contentDefinition);
      exporter.downloadExcel();
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
      this.$refs.ReportForm.change()
      if (!this.filter || !this.filter.isValid) {
        //this.Motify(false, 'Veuillez remplir toutes les données')
        this.showNotification({type: false,  message: 'Veuillez remplir toutes les données'})
        return null
      }

      let start_date = this.datesRange.from ? this._formatDate(this.datesRange.from, 'YYYY-MM-DD') : this._formatDate(this.datesRange, 'YYYY-MM-DD')
      let end_date = this.datesRange.to ?  this._formatDate(this.datesRange.to, 'YYYY-MM-DD') : this._formatDate(this.datesRange, 'YYYY-MM-DD')


      if(start_date !== end_date &&  get(this.filter, 'operand_date.code') !== "between"){
        this.showNotification({type: false,  message: "Changez le type de filtre à Entre ou choissiez une date unique"})
        return null
      }

      this.loading = true

      //console.log(" get(this.filter, 'app_code')",  get(this.filter, 'app_code'))
      let form = {
        start_date: start_date,
        end_date: end_date,

        //production_chain_id: get(this.productionChainUser, "id"),
        //campaign_id: this.currentCampaign.id,
        filter: this.filter,
        title: get(this.filter, 'title'),
        table: get(this.filter, 'table'),
        column_date: get(this.filter, 'column_date'),
        operand_date: get(this.filter, 'operand_date.code', "between"),
        app_code: get(this.filter, 'app_code', 'SERP'),
        is_all: get(this.filter, 'is_all', true)
      }
      let dat =  await this.otherDatas.then(val => val)
      //console.log("this.otherDatas", dat)

      form = assign(form, dat)

      this.$store.dispatch(this.getDataReportApi, form)
        .then(value => {
          //console.log('value', value)
          //console.log('this.statsData', value)
          if(type === "PDF")
            this.setupPdf(value)
          else
            this.downloadExcelFile(value)

        })
        .catch(err =>{

          console.error('err', err)
          this.showNotification({type: false,  message: 'Une erreur est survenue : Veuillez contactez votre correspondant IT'})
        })
        .finally(() => this.loading = false)


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
        let result =  await this.$store.dispatch(this.deleteReportApi, {id: this.currentId})
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
          await this.$store.dispatch(this.validateReportApi, {id: this.currentId, status: status})
              .then(async (value) => {
                //On actualise le rapport
                await this.$store.dispatch(this.viewReportApi, {id: value.data.id})
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

    }

  },

  computed: {

    _isDraft() {
      return  this.currentReport && get(this.currentReport, 'status') === 'draft'
    },

    _isValidated() {
     return this.currentReport && get(this.currentReport, 'status') === 'validated'
    },

    ...mapState({
      productionChainUser: state => get(state, 'productionChainUser.item'),
      statsData: state => get(state, 'reports.dataReport'),
      currentCampaign: state => get(state, 'campaign.item'),
      currentUser: state => get(state, 'authentification.user'),
    }),

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

  async mounted() {

    if( get(this.currentReport, "payload_query.operand_date.code", "between") === 'between'){
      let dateRange = this.getMonthDateRange(new Date())
      this.datesRange.from = dateRange.start
      this.datesRange.to = dateRange.end
    }
    else{
      this.datesRange = moment().format("YYYY-MM-DD")
    }

    if (this.pageState === 'view') {
      await this.$store.dispatch(this.viewReportApi, {id: this.currentId}).then(value => {
        this.filter = this.generateFilter(value)
      })
      await this.getStatsData('PDF')
    }
  },

  beforeDestroy() {
    if (this.content)
      window.URL.revokeObjectURL(this.content)
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
