<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
    <PageContainer :titles="titles">
      <template slot="header">
  <!--        <MControlPanel
            :state="currentState"
            :can-update="canUpdate"
            :can-create="canCreate"
            @on-button1-clicked="onButton1Clicked"
            @on-button2-clicked="onButton2Clicked"
            :actions="actions">
          </MControlPanel>-->
      </template>

      <template slot="content">


        <div class="row q-ma-md q-pa-md" style="border: lightgray solid thin; background-color: white">
          <div class="col-sm-12 col-xs-12 full-width">

            <div class=" justify-center">

              <Generator
                :can-cancel="canCancel"
                :can-delete="canDelete"
                :can-export="canExport"
                :can-validate="canValidate"
                :page-state="currentState"
                :current-id="currentId"
                :is-electron="isElectron"
                :other-datas="[]"
                button-color-primary="primary"
                button-color-secondary="black"
                view-report-api="reports/viewReport"
                get-data-report-api="reports/getDataReport"
                delete-report-api="reports/deleteReport"
                validate-report-api="reports/validateReport"
                create-report-api="createReportApi"
                update-report-api="reports/updateReport"
                :report-list="[]"
              />

            </div>
          </div>

        </div>

      </template>

    </PageContainer>

  </template>


<script>

import {mapActions, mapState} from "vuex";
import PageContainer from '@/components/PageContainer'
import MControlPanel from '@/components/MControlPanel'
import Generator from './components/Generator'
import get from 'lodash/get'

export default {
  name: "ReportIndex",
  // eslint-disable-next-line vue/no-unused-components
  components: {PageContainer, MControlPanel, Generator},

  async preFetch({store, currentRoute, previousRoute, redirect, ssrContext}) {
    let id = currentRoute.query.id || currentRoute.params.id
    if (id) {
      await store.dispatch('reports/viewReport', {id}).then(value => {
        //this.filter = this.generateFilter(value)
      })
    }
  },
  mixins: [],

  data() {
    return {
      titles: [],
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

  },

  computed: {

    currentState() {
      return this.$router.currentRoute.query.type || this.$router.currentRoute.params.type
    },

    currentId() {
      console.log("this.$route.params.id || this.$route.query.id", this.$route.params.id || this.$route.query.id)
      return this.$route.params.id || this.$route.query.id
    },

    canExport() {
      return this._can('factory_data_exportation')
    },
    canValidate() {
      return this._can('state_pdf_params') && this.currentId
    },

    canCancel() {
      return this._can('state_pdf_params')
    },

    canDelete() {
      return this._can('delete_pdf_params') && this.currentId &&  this.$route.query.id
    },

    isElectron() {
      return process.env.MODE === 'electron'
    },

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
    }),

  },

  async mounted() {

    this.titles = [
      {id: 1, title: 'Liste des rapports', icon: 'fas fa-arrow-circle-left', to: `/apps/${this.$attrs.appId}/reports-list`},
      {id: 2, title: this.$router.currentRoute.query.desc, to: '#'},
    ]
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
