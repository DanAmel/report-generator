import ReportTemplate from './template'
import separatorNumber from "src/plugins/separatorNumber";
import get from 'lodash/get'
import moment from 'moment-timezone'
import _groupBy from 'lodash/groupBy'
import _reduce from 'lodash/reduce'
import _clone from 'lodash/cloneDeep'
import _toPairs from 'lodash/toPairs'
import _round from 'lodash/round'

function objectToArray(mObject) {
  return Object.entries(mObject).map(([k, v]) => ({key: k, ...v}))
}

function groupData(myObject, acc,  elementGroup){

  return _reduce(myObject, function(res, value, key){
    if(Array.isArray(value)) res[key] =  _groupBy(value, elementGroup)
    else res[key] = groupData(value, _clone(value), (elementGroup))

    return res
  }, acc)
}

function getDataRows(elementGroup, payloadData ){

 return _reduce(elementGroup, function (result, value, key){

    let data = key === 0 ? payloadData : result

    if(key === 0) return _groupBy(data, value.column)
    else{
      return _reduce(data, (res, v, k) => {

        if(Array.isArray(data[k])) res[k] = _groupBy(v, value.column)
        else  res[k] =  groupData(v, _clone(data[k]), value.column)

        return res}, result)
    }

  }, {})
}

function getHeader(columnList){
  let header = []
  let width = []
  columnList.forEach(column =>{
    let label = get(column, 'alias')
    header.push({ text: label && label !== ''? label : get(column, 'name'), style: ['header']})
    width.push('*')
  })
  return {header: header, width: width}
}

function getContent(dataRows, columnList, isGrouped = false, counterKey=0, acc= [], sumAllContent = {}){

  let tempData = []

  if(dataRows.length === 0){
    let result2 = []
    let result = []
    columnList.forEach((x, index) =>{
      if(index === 0)
        result.push({text: `AUCUN RESULTAT`, style: ['element'], border:[1,1,1,1], bold: true, colSpan:columnList.length})
      else
        result.push({})
    })
    result2.push(result)
    return result2
  }

  if(!isGrouped){ // Si pas de groupage
    acc = printCell(dataRows, columnList, counterKey)
  }
  else{
    dataRows.forEach((data, key) =>{

      //Affichage de la clé (groupe)
      columnList.forEach((column, idx) => {
        if(idx === counterKey)
          tempData.push({ text:  `${formatData(data[0], column)}`, style:['key'], border: [0,0,0,0]})
        else
          tempData.push({ text:  ``, style:['element'], border: [0,0,0,0]})
      })
      acc.push(tempData)
      tempData = []


      //Affichage des datas
      if(Array.isArray(data[1])){
        data[1].forEach((x, idx) => {
          columnList.forEach((column, idx) => {
            if (idx > counterKey)
              tempData.push({text: `${formatData(get(x, get(column, 'code', ''), ''), column)}`, style: ['element'], border:[0,0,0,0]})
            else
              tempData.push({text: ``, style: ['element'], border:[0,0,0,0]})
          })
          acc.push(tempData)
          tempData = []
        })
        tempData = []

      }
      else{
        getContent(_toPairs(data[1]), columnList, true, counterKey+1, acc, sumAllContent)
      }

      //On fait la somme des data du groupe
      columnList.forEach((column, idx) => {
        let sum = 0
        if(idx === counterKey){
          tempData.push({text: `Total ${formatData(data[0], column)} `, style: ['totalKey'], border:[0,1,0,0]})
        }
        else if (idx > counterKey && isNumeric(column) && column.sumData){

          if(Array.isArray(data[1]))
            sum += getSumContent(data[1], column, sum)
          else
            sum += getSumContent(_toPairs(data[1]), column, sum, true)

          tempData.push({text: `${separatorNumber(_round(sum, 3))}`, style: ['total'], border:[0,1,0,0]})
        }
        else{
          tempData.push({text: ``, style: ['total'], border:[0,1,0,0]})
        }

      })
      acc.push(tempData)
      tempData = []

      //On fait les pourcentages des data du groupe
      columnList.forEach((column, idx) => {
        let sum = 0
        if(idx === counterKey){
          tempData.push({text: `Pourcentage `, style: ['totalKey'], border:[0,0,0,1]})
        }
        else if (idx > counterKey && isNumeric(column) && column.sumData){
          //console.log('col', column)

          if(Array.isArray(data[1]))
            sum += getSumContent(data[1], column, sum)
          else
            sum += getSumContent(_toPairs(data[1]), column, sum, true)

          let percent = sumAllContent[get(column, 'code')] !== 0 ? (sum/sumAllContent[get(column, 'code')] ) * 100 : 0
          tempData.push({text: `${separatorNumber(_round(percent, 2))}%`, style: ['total'], border:[0,0,0,1]})
        }
        else{
          tempData.push({text: ``, style: ['total'], border:[0,0,0,1]})
        }
      })
      acc.push(tempData)
      tempData = []
    })
  }

  return acc
}

function getSumContent(dataRows, column, acc=0, isPair=false){

  if(isPair){
    dataRows.forEach(x =>{
      if(Array.isArray(x[1])){
        acc += _reduce(x[1], function(res, current, k){
          //let val = parseFloat(get(current, get(column, 'code', ''), 0))
          //if (isNaN(val)) val = 0
          res +=  parseFloat(get(current, get(column, 'code', ''), 0))
          return res
        }, 0)
      }
      else{
        let val = _toPairs(x[1])
        acc += getSumContent(val, column, 0 , true)
      }
    })
  }
  else{
    acc += _reduce(dataRows, function(res, current, k){
      //let val = parseFloat(get(current, get(column, 'code', ''), 0))
      //if (isNaN(val)) val = 0
      res +=  parseFloat(get(current, get(column, 'code', ''), 0))
      return res
    }, 0)
  }

  return acc
}

function sumAllContent(rows, columns){
  let sumObject = {}
  columns.forEach(column =>{
    sumObject[get(column,'code')] = 0
  })

  let data = _reduce(rows, function(result, value, key){
    columns.forEach(column =>{
      if(isNumeric(column)){
        let val =  parseFloat(value[get(column,'code')])
        if (isNaN(val)) val = 0
        sumObject[get(column,'code')] += val
      }
    })
  }, sumObject)

  return sumObject
}

function formatData(data, column){

  let type = get(column, 'type', 'varchar')
  let value = ''
  switch (type){
    case 'float4':
    case 'numeric':
    case 'int4':
      value = data ? separatorNumber(_round(parseFloat(data), 3)) : 0
      break
    case 'date':
      value = moment(data).isValid() ? moment(data).tz(moment.tz.guess()).format('YYYY-MM-DD') : 'N/A'
      break
    case 'timestamptz':
      value = moment(data).isValid() ? moment(data).tz(moment.tz.guess()).format('YYYY-MM-DD HH:mm:ss'): 'N/A'
      break
    case 'interval':
      if(data && data.hours)
        value += `${data.hours}H`
      if (data && data.minutes)
        value += ` ${data.minutes} min`
      break
    case 'bool':
      data = data ? 'true' : 'false'
      break
    default:
      value = (!!data && data !== 'null')  ? data : 'N/A'
      break
  }

  if(Array.isArray(column.data) && column.data.length > 0){
    let elmt = column.data.find(x => x.code === data)
    value = get(elmt, 'name')
  }

  return value
}

function isNumeric(column){
  let type = get(column, 'type', 'varchar')
  let value = false
  switch (type){
    case 'float4':
    case 'numeric':
    case 'int4':
      value = true
      break
    default:
      value = false
      break
  }
  return value

}

function printCell(data, columnList, counterKey){

  let acc = []
  let tempData = []
  data.forEach((x, idx) =>{
    columnList.forEach((column, idx) => {
      if (idx > counterKey){
        let val = formatData(get(x, get(column, 'code', ''), ''), column)
        tempData.push({text: `${val}`, style: ['element'], border:[1,1,1,1]})
      }
      else
        tempData.push({text: ``, style: ['element'], border:[1,1,1,1]})
    })
    acc.push(tempData)
    tempData = []
  })
  return acc

}

function printTotalG(sumAllContent, columnList, acc, isGrouped = true){
  //On affiche le total général
  let tempData = []
  let border = [0,1,0,0]
  if(isGrouped)
    border = [0,1,0,0]
  else
    border = [1,1,1,1]

  columnList.forEach((column, idx) => {
    if(idx === 0){
      tempData.push({text: `Total Général `, style: ['totalG'], border:border})
    }
    else if (idx > 0 && isNumeric(column) && column.sumData){
      tempData.push({text: `${separatorNumber(_round(sumAllContent[get(column, 'code')], 3))}`, style: ['total'], border:border})
    }
    else{
      tempData.push({text: ``, style: ['total'], border:border})
    }

  })
  acc.push(tempData)
  return acc
}

let f = function (payload) {

  let payloadData = get(payload, 'rows')

  let filter = (get(payload, 'filter'))
  let column = get(filter, 'columns')
  let title = get(filter, 'title')
  let groupBy = get(filter, 'groupBy', [])
  let counterKey = groupBy.length > 0 ? 0 : -1


  /*console.log('payloadData', payloadData)
  console.log('filter', filter)
  console.log('column', column)
  console.log('groupBy', groupBy)
  console.log('title', title)
  console.log('groupBy.length', groupBy.length)*/

  let rows = groupBy.length > 0 ? getDataRows(groupBy, payloadData) : payloadData
  let rowsArray = groupBy.length > 0 ? _toPairs(rows) : rows
  let isGrouped = groupBy.length > 0
  let sumContent = null
  /*if(isGrouped){
    sumContent = sumAllContent(payloadData, column)
  }*/
  sumContent = sumAllContent(payloadData, column)
  let header = getHeader(column)
  let content = getContent(rowsArray, column, isGrouped, counterKey, [],  sumContent)

  //Ajout du total général
  if(payloadData.length > 0)
    content = printTotalG(sumContent, column, content, isGrouped)

  let pageSize = get(filter, 'options.pageSize', 'A4')
  let pageOrientation = get(filter, 'options.pageOrientation', 'portrait')


  /*console.log('header', header)
  console.log('rows', rows)
  console.log('content', content)*/

  let body = []
  body.push(get(header,'header',[]))
  body.push(...content)
  let table = {
    table:{
      widths: get(header, 'width', []),
      headerRows: 1,
      body: body
    }
  }

  moment.locale('fr');
  let data = {
    start_date: get(payload, 'start_date'),
    end_date: get(payload, 'end_date'),
    docHeaderTitle: title.toUpperCase(),
    impression_date: moment().format('LLLL'),
    table: table,
    user_name: get(payload, 'user_name'),
    production_chain: get(payload, 'production_chain_name'),
    campaign: get(payload, 'campaign'),
    title: title
  };
  //console.log('data', data)


  return {
    info: ReportTemplate.info,
    content: ReportTemplate.content(data),
    footer: ReportTemplate.footer(data),
    header: ReportTemplate.header,
    styles: ReportTemplate.styles,
    defaultStyle: ReportTemplate.defaultStyle,
    pageOrientation: ReportTemplate.pageOrientation(pageOrientation),
    pageMargins: ReportTemplate.pageMargins,
    pageSize: ReportTemplate.pageSize(pageSize),
    permissions: ReportTemplate.permissions,
  }
}

export default f
