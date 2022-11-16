import ReportTemplate from './template'
import separatorNumber from "src/plugins/separatorNumber";
import get from 'lodash/get'
import _orderBy from "lodash/orderBy"
import moment from 'moment-timezone'
import _groupBy from 'lodash/groupBy'
import _reduce from 'lodash/reduce'
import _clone from 'lodash/cloneDeep'
import _toPairs from 'lodash/toPairs'
import _round from 'lodash/round'
import {Parser} from 'expr-eval'
import _filter from "lodash/filter"
import _sumBy from "lodash/sumBy"


function getDataSource(payload, complexity, chartType, category, series, valuesSeries, options){

  let data = []
  let categories = []
  let dataSource = {}
  let dataset = {}
  switch (complexity){
    case "simple":
      data = getSimpleDataFC(payload, category, series, options)
      dataSource = getSimpleDataSourceFC(data, options)
      break;
    case "complex":
      categories = getCategoriesFC(payload, category)
      console.log("categories", categories)
      dataset = getDatasetFC(payload, category.code, categories, series, valuesSeries)
      dataSource = getComplexDataSourceFC(categories, dataset, options)
      break;

  }

  //dataSource = getSimpleDataSourceFC(data, options)

  return dataSource
}


function getSimpleDataFC(payload, category, serie){
  let temp = []
  let code_serie = serie.code
  let groupData = _groupBy(payload, category.code)
  let keys = Object.keys(groupData)
  keys.forEach(x => temp.push({label: x, value: _sumBy(groupData[x], code_serie)}) )
  let data = _orderBy(temp, 'value', "desc")

  return data
}

function  getSimpleDataSourceFC(data, options){

  return {
    chart: {
      caption: options.title,
      subcaption: options.subcaption,
      xaxisname: options.xaxisname,
      yaxisname: options.yaxisname,
      pyaxisname: options.yaxisname,
      numbersuffix: get(options, "numbersuffix", ''),
      numberprefix: get(options, "numberprefix", ''),
      theme: "fusion",
      showsecondarylimits: "0",
      showdivlinesecondaryvalue: "0",
      drawcrossline: "1"
    },
    data: data
  }
}

function getCategoriesFC(payload, category){

  let temp = []
  let code_category = category.code
  let categories = []
  console.log('code_category', code_category)
  let groupData = _groupBy(payload, category.code)
  let keys = Object.keys(groupData)
  keys.forEach(x => temp.push({label: x}) )
  categories.push({ category: temp})
  return categories
}

function getDatasetFC(payload, category_code, categories, series, valuesSeries=null){
  let dataset = []

  if(!valuesSeries){
    series.forEach((serie, index) => {
      let data = []
      let temp = []

      let category_values = categories[0].category
      category_values.forEach(value => {
        let filter = {}
        filter[category_code] = value.label
        let filterCategory = _filter(payload, filter)
        let val = _sumBy(filterCategory, serie.code)
        data.push({value: val})

        //On ordonne
        if(index === 0)
          temp.push({label: value.label, value: val})
      })

      //On ordonne les categories et datas
      if(index === 0){
        temp = _orderBy(temp, "value", "desc")
        category_values = []
        temp.forEach(x => category_values.push({label: x.label}))
        categories[0].category = category_values
        data = _orderBy(data, 'value', "desc")
      }

      dataset.push({
        seriesname: serie.alias ? serie.alias : serie.name,
        data
      })

    })
  }
  else{
    series.forEach((serie, index) => {

      let temp = []
      let groupedSerie = _groupBy(payload, serie.code)

      let keys = Object.keys(groupedSerie)

      keys.forEach((key, index) => {
        let data = []
        let category_values = categories[0].category

        category_values.forEach(value => {

          let filter = {}
          filter[category_code] = value.label
          filter[serie.code] = key
          let filterCategory = _filter(payload, filter)
          let val = _sumBy(filterCategory, valuesSeries.code)
          data.push({value: val})
        })

        dataset.push({
          seriesname: key,
          data
        })
      })

    })
  }
  console.log("dataset", dataset)
  return dataset

}


function  getComplexDataSourceFC(categories, dataset, options){

  return {
    chart: {
      caption: options.title,
      subcaption: options.subcaption,
      xaxisname: options.xaxisname,
      yaxisname: options.yaxisname,
      pyaxisname: options.yaxisname,
      numbersuffix: get(options, "numbersuffix", ''),
      numberprefix: get(options, "numberprefix", ''),
      theme: "fusion",
      showsecondarylimits: "0",
      showdivlinesecondaryvalue: "0",
      drawcrossline: "1"
    },
    categories,
    dataset,
  }
}


let f = function (payload) {

  //console.log('payload', payload)
  let payloadData = get(payload, 'rows')


  let filter = (get(payload, 'filter'))
  let category = get(filter, 'chart.category')
  let series = get(filter, 'chart.series')
  let valuesSeries = get(filter, 'chart.valuesSeries')
  let xaxisname = get(filter, 'chart.xaxisname')
  let yaxisname = get(filter, 'chart.yaxisname')
  let subcaption = get(filter, 'chart.subcaption')
  let numberprefix = get(filter, 'chart.numberprefix')
  let numbersuffix = get(filter, 'chart.numbersuffix')
  let chartComplexity = get(filter, 'chart.chartComplexity')
  let chartType = get(filter, 'chart.chartType')
  let title = get(filter, 'title')

  //console.log("get(chartType, \"code\")", get(chartType, "code"))
  let dataSource = getDataSource(payloadData, get(chartComplexity, "name"), get(chartType, "code"), category, series, valuesSeries, {xaxisname, yaxisname, subcaption, numberprefix, numbersuffix, title})


  let data = {
    dataSource: dataSource,
    type: get(chartType, "code"),
    title: title,
    dataFormat: "json"
  };
  //console.log('data', data)


  return data

}

export default f