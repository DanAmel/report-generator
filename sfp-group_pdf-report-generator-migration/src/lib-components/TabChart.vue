<template>
  <div class="row q-mb-sm q-mt-xs">

    <div class="col-12">


      <div class="row no-wrap q-pa-md">
        <div class="col-md-6">
          <q-input  class="q-mr-md" dense label="Label axe X *" v-model="newFilter.chart.xaxisname"
                    @m-blur="validator.newFilter.chart.xaxisname.$touch"
                    :error="validator.newFilter.chart.xaxisname.$error"
          />
        </div>
        <div class="col-md-6">
          <q-input  class="q-mr-md" dense label="Label axe Y *" v-model="newFilter.chart.yaxisname"
                    @m-blur="validator.newFilter.chart.yaxisname.$touch"
                    :error="validator.newFilter.chart.yaxisname.$error"
          />
        </div>
      </div>


      <div class="row no-wrap q-pa-md">
        <div class="col-md-6">
          <q-input  class="q-mr-md" dense label="Sous titre" v-model="newFilter.chart.subcaption" />
        </div>
        <div class="col-md-3">
          <q-input  class="q-mr-md" dense label="Préfixe valeur" v-model="newFilter.chart.numberprefix"  />
        </div>
        <div class="col-md-3">
          <q-input  class="q-mr-md" dense label="Suffixe valeur" v-model="newFilter.chart.numbersuffix"  />
        </div>

      </div>



      <div class="row no-wrap q-pa-md">

        <div class="col-md-6">

          <q-select  dense outlined class="q-mr-md" clearable
                     ref="mySelect"
                     v-model="mChartComplexity"
                     label="Complexité"
                     :options="chartComplexity"
                     :hide-bottom-space="true"
                     option-label="name" option-value="name"
                     :options-dense="true"
                     use-input input-debounce="0"
                     error-message="Champ requis."
                     @m-blur="validator.newFilter.chart.chartComplexity.$touch"
                     :error="validator.newFilter.chart.chartComplexity.$error"
                     @input="changeChartComplexity"
                     >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Pas de résultats
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-md-6">

          <q-select  dense outlined class="q-mr-md" clearable
                     ref="mySelect"
                     v-model="mChartType"
                     label="Type de graphe"
                     :options="chartTypeOptions"
                     :hide-bottom-space="true"
                     option-label="name" option-value="name"
                     :options-dense="true"
                     use-input input-debounce="0"
                     error-message="Champ requis."
                     @m-blur="validator.newFilter.chart.chartType.$touch"
                     :error="validator.newFilter.chart.chartType.$error"
                     @input="changeChartType" >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Pas de résultats
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

      </div>


      <div class="row no-wrap q-pa-md">

        <div class="col-md-6">

          <q-select  dense outlined class="q-mr-md" clearable
                     v-model="mCategory"
                     label="Data/Catégorie"
                     :options="availableColumns"
                     use-chips
                     :hide-bottom-space="true"
                     option-label="name" option-value="name"
                     :options-dense="true"
                     use-input input-debounce="0"
                     error-message="Champ requis."
                     @m-blur="validator.newFilter.chart.category.$touch"
                     :error="validator.newFilter.chart.category.$error"
                     @input="changeCategory"
          >
            <q-tooltip>
              Cette donnée correspond à l'axe des abscisses
            </q-tooltip>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Pas de résultats
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-md-6">

          <q-select  dense outlined class="q-mr-md" clearable
                     v-model="mSeries"
                     label="Série(s)"
                     :options="availableColumns"
                     :hide-bottom-space="true"
                     option-label="name" option-value="code"
                     :options-dense="true"
                     use-input input-debounce="0"
                     error-message="Champ requis."
                     @m-blur="validator.newFilter.chart.series.$touch"
                     :error="validator.newFilter.chart.series.$error"
                     :multiple="multiple"
                     use-chips
                     @input="changeSeries" >
            <q-tooltip>
              Représente une sous catégorie de la catégorie selectionnée précédement.<br/> Pour les graphes complexes vous pouvez choisir une ou plusieurs séries différentes.
              <br/>
            </q-tooltip>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Pas de résultats
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

      </div>


      <div class="row no-wrap q-pa-md">

        <div class="col-md-6" v-if="canUseValue">

          <q-select  dense outlined class="q-mr-md" clearable
                     v-model="mValues"
                     label="Valeur(s)"
                     :options="availableColumns"
                     :hide-bottom-space="true"
                     option-label="name" option-value="code"
                     :options-dense="true"
                     use-input input-debounce="0"
                     use-chips
                     @input="changeValues" >
            <q-tooltip>
              Représente la valeur à calculer pour une série sélectionnée. <br/>
              Ne fonctionne que lorsqu'une seule série est sélectionnée.
              <br/>
            </q-tooltip>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Pas de résultats
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-md-6">


        </div>

      </div>


    </div>
  </div>
</template>

<script>

import get from "lodash/get";

export default {
  name: 'TabChart',
  model: {
    prop: 'value',
    event: 'input',
  },
  mixins: [],
  props: {

    newFilter: {
      type: [Array, Object],
      default: ()=> {},
    },
    chart: {
      type: [Array, Object],
      default: ()=> {},
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
      mValues: null,

      mChartType: null,

      mChartComplexity: null,

      mCategory: null,

      mSeries: [],

      chartComplexity: [
        {
          name: "simple",
        },
        {
          name: "complex"
        }
      ],

      chartSimpleType: [
        {
          name: "Batonnet 2d",
          code: "column2d",
        },
        {
          name: "Camembert 2d",
          code: "pie2d",
        },
        {
          name: "Donnut 2d",
          code: "doughnut2d",
        },
        {
          name: "Pareto 2d",
          code: "pareto2d",
        },
        {
          name: "Batonnet horizontal",
          code: "bar2d",
        },
        {
          name: "Batonnet 3d",
          code: "column3d",
        },
        {
          name: "Ligne",
          code: "line",
        },
        {
          name: "Courbe",
          code: "spline",
        },
        {
          name: "Aires",
          code: "splinearea",
        },



      ],

      chartComplexType: [
        {
          name: "Batonnet multisérie",
          code: "mscolumn2d",
        },
        {
          name: "Batonnet multisérie (scroll)",
          code: "scrollcolumn2d",
        },
        {
          name: "Batonnet multisérie",
          code: "mscolumn2d",
        },
        {
          name: "Batonnet horizontal multisérie (scroll)",
          code: "msbar2d",
        },
        {
          name: "Multi ligne",
          code: "msline",
        },
        {
          name: "Courbe",
          code: "scrollline2d",
        },
        {
          name: "Aires multisérie",
          code: "msarea",
        },
        {
          name: "Batonnet empilé",
          code: "stackedcolumn2dline",
        },

      ],

      chartTypeOptions: [],
    }
  },

  methods: {
    get,

    hide(evt){
      this.$refs.dialog.hide()
    },

    selectComplexity(){

      this.newFilter.chart.chartType = null
      this.mChartType = null

      switch (get(this.newFilter, "chart.chartComplexity.name")){
        case "simple":
          this.chartTypeOptions = this.chartSimpleType
          break;
        case "complex":
          this.chartTypeOptions = this.chartComplexType
          break;
      }
    },

    changeChartComplexity(value){
      this.newFilter.chart.chartComplexity = value

      this.mChartType = null
      this.newFilter.chart.chartType = null
      this.mSeries = null
      this.newFilter.chart.series = null

      if(value && value.name === "simple")
        this.chartTypeOptions = this.chartSimpleType
      else
        this.chartTypeOptions = this.chartComplexType
    },

    changeCategory(value){
      this.newFilter.chart.category = value
    },

    changeSeries(value){
      this.newFilter.chart.series = value

      this.mValues = null
      this.newFilter.chart.valuesSeries = null
    },

    changeChartType(value){
      this.newFilter.chart.chartType = value
    },

    changeValues(value){
      this.newFilter.chart.valuesSeries = value
    },

  },

  computed: {

    multiple(){
      return get(this.newFilter, "chart.chartComplexity.name") === 'complex'
    },

    canUseValue(){
      return this.newFilter.chart.series && this.newFilter.chart.series.length === 1
    },

    availableColumns(){

      return  this.newFilter.columns.map( x =>{
        return {
          name: get(x, "column.name"),
          code: get(x, "column.code"),
          type: get(x, "column.type"),
          alias: get(x, "column.alias")
        }
      })
    },

    dateColumns(){
      let data = []
      if(this.columns){
        data = this.columns.filter(x => (x.type === 'date' || x.type === 'timestamptz'))
      }
      return data
    },

  },


  async mounted() {

    this.chartTypeOptions = []

    /*if(this.newFilter.chart.chartComplexity && this.newFilter.chart.chartComplexity.name === "simple")
      this.chartTypeOptions = this.chartSimpleType
    else if(this.newFilter.chart.chartComplexity && this.newFilter.chart.chartComplexity.name === "complex")
      this.chartTypeOptions = this.chartComplexType*/

    if(!this.newFilter.chart)
      this.newFilter.chart = {}

    this.mChartType = get(this.newFilter, "chart.chartType")
    this.mChartComplexity = get(this.newFilter, "chart.chartComplexity")
    this.mCategory= get(this.newFilter, "chart.category")
    this.mSeries= get(this.newFilter, "chart.series")
    this.mValues = get(this.newFilter, "chart.valuesSeries")


  },

  watch: {
  }

}
</script>
