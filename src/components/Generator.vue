<template>
  <q-page class="bg-white" padding>
    <div class="row">
      <div class="col-xs-12 col-sm-12 col-md-8 col-lg-8 text-left ">
        <h6 v-if="filter" class="q-ma-none"><strong>{{ filter.title }}
        </strong></h6>
      </div>

      <div class="col-xs-12 col-sm-4 col-md-4 col-lg-4 q-pt-xs">

        <div class="col-12 q-pb-xs q-mb-xs">

          <q-btn :label="selectedRange" class="q-ml-sm q-px-md float-right" :color="buttonColorPrimary"
                 dense icon="fa fa-calendar-alt" unelevated>
            <q-popup-proxy transition-hide="scale" transition-show="scale" @before-show="updateProxy">
              <q-date v-model="datesRange" range :color="buttonColorPrimary">
                <div class="row items-enter  q-gutter-sm">
                  <q-btn v-close-popup :color="buttonColorSecondary" flat label="Cancel"/>
                  <q-btn v-close-popup :color="buttonColorPrimary" flat label="OK" @click="getStatsData"/>
                </div>
              </q-date>
            </q-popup-proxy>
          </q-btn>

          <ReportForm
            v-model="filter"
            :report-list="reportList"
            :create-report-api="createReportApi"
            :update-report-api="updateReportApi"
            v-on:reloadPage="reloadPage"
            v-on:showPreview="getStatsData"
          />

        </div>

      </div>

      <div class="col-12 q-ma-none q-px-lg text-center q-pt-sm" v-if="loading">
        <q-spinner-ios color="primary" size="2em"/>
        Chargement du rapport en cours
        <q-tooltip :offset="[0, 8]">Chargement du rapport en cours . . .</q-tooltip>
      </div>

      <div class="col-12 q-pb-xs q-pt-xs  q-mt-xs q-mb-xs">

        <q-btn
          color="secondary" class="q-ml-sm"
          size="11px"
          v-if="_isDraft && canValidate"
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
          v-if="canDelete"
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

      <div class="col-12 q-my-sm">

        <div slot="content" style="background-color: white; height:1000px" id="iframeContainer">
          <div class="row items-center justify-center q-pa-sm">
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
import moment from "moment";
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
pdfMake.vfs = pdfFonts.pdfMake.vfs

import ReportForm from "./ReportForm";
import RenderReport from "../render/generator"


export default {

  name: "GeneratorIndex",
  // eslint-disable-next-line vue/no-unused-components
  components: {ReportForm},

  async preFetch({store, currentRoute, previousRoute, redirect, ssrContext}) {
    let id = this.currentId
    console.log('this.viewReport', this.viewReportApi)
    if (id) {
      await store.dispatch(this.viewReportApi, {id})
    }
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
      type: Array,
      default: [],
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
    reportList: {
      type: [Object, Array],
      default: ()=>[],
    },
    dataReport: {
      type: [Object, Array],
      default: ()=>[],
    },

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

    async reloadPage(id) {
      await this.$store.dispatch(this.viewReportApi, {id}).then(value => {
        this.filter = this.generateFilter(value)
      })
    },

    generateFilter(reportPdf) {

      let mFilter = {}
      mFilter.id = get(reportPdf, 'id')
      mFilter.column_date = get(reportPdf, 'column_date')
      mFilter.dateReport = {}
      mFilter.table = get(reportPdf, 'report_table')
      mFilter.title = get(reportPdf, 'report_title')
      mFilter.columns = get(reportPdf, 'payload_query.columns')
      mFilter.conditions = get(reportPdf, 'payload_query.conditions')
      mFilter.groupBy = get(reportPdf, 'payload_query.groupBy')
      mFilter.orderBy = get(reportPdf, 'payload_query.orderBy')
      mFilter.options = get(reportPdf, 'payload_query.options')
      mFilter.is_all = get(reportPdf, 'is_all')
      mFilter.isValid = true
      mFilter.options = get(reportPdf, 'payload_query.options')

      return mFilter
    },

    ...mapActions({
    }),

    async setupPdf(payload) {

      this.loading = true
      payload.campaign = get(this.currentCampaign, 'code')
      payload.user_name = get(this.currentUser, 'employee.full_name')
      payload.production_chain_name = get(this.productionChainUser, 'name')
      payload.start_date = this.datesRange.from
      payload.end_date = this.datesRange.to
      payload.campaign = this.currentCampaign
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

    getStatsData() {
      //console.log('this.filter.isValid', this.filter.isValid)
      if (!this.filter || !this.filter.isValid) {
        this.Motify(false, 'Veuillez remplir toutes les données')
        return null
      }
      this.loading = true
      let form = {
        start_date: this.datesRange.from,
        end_date: this.datesRange.to,
        production_chain_id: this.productionChainUser.id,
        campaign_id: this.currentCampaign.id,
        filter: this.filter,
        title: get(this.filter, 'title'),
        table: get(this.filter, 'table'),
        column_date: get(this.filter, 'column_date')
      }
      //console.log('form', form)
      this.$store.dispatch(this.getDataReportApi, form)
        .then(value => {
          //console.log('value', value)
          //console.log('this.statsData', value)
          this.setupPdf(value)
        })
        .catch(err =>{
          this.Motify('error', 'Une erreur est survenue : Veuillez contactez votre correspondant IT')
        })
        .finally(() => this.loading = false)


    },

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
        let result =  await this.$store.dispatch(this.deleteReportApi, {id: this.report.id})
          .then(async (value) => {
            this.Motify('success', "Le rapport a bien été supprimé", '/generate/reports')
          })
          .catch(error =>{
            this.Motify('error', "Impossible de supprimer le rapport")
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
      if (this.report) {
        await this.$store.dispatch(this.validateReportApi, {id: this.report.id, status: status})
          .then(async (value) => {
            //On actualise le rapport
            await this.$store.dispatch(this.viewReportApi, {id: value.data.id})
            this.Motify('success', "Opération réussie")
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
    }

  },

  computed: {


    _isDraft() {
      return get(this.report, 'status', 'draft') === 'draft'
    },

    _isValidated() {
     return get(this.report, 'status') === 'validated'
    },

    ...mapState({
      productionChainUser: state => get(state, 'productionChainUser.item'),
      report: state => get(state, 'reports.report'),
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
    let dateRange = this.getMonthDateRange(new Date())
    this.datesRange.from = dateRange.start
    this.datesRange.to = dateRange.end

    if (this.pageState === 'view') {
      await this.$store.dispatch(this.viewReportApi, {id: this.currentId}).then(value => {
        this.filter = this.generateFilter(value)
      })
      this.getStatsData()
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
