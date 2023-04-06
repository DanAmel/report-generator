import separatorNumber from "./separatorNumber";
import get from 'lodash/get'
import moment from 'moment-timezone'
import _groupBy from 'lodash/groupBy'
import _reduce from 'lodash/reduce'
import _clone from 'lodash/cloneDeep'
import _toPairs from 'lodash/toPairs'
import _round from 'lodash/round'
import {Parser} from 'expr-eval'
import _filter from "lodash/filter"
import _sumBy from "lodash/sumBy"


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

function getHeader(columnList, formulas=[]){
  let header = []
  let width = []
  let mapHeader = []
  columnList.forEach(column =>{
    let label = get(column, 'alias')
    header.push({ text: label && label !== ''? label : get(column, 'name'), style: ['header']})
    width.push('*')
    mapHeader.push(label && label !== ''? label : get(column, 'name'))
  })
  formulas.forEach(column => {
    let label = get(column, 'alias')
    header.push({ text: label, style: ['header']})
    width.push('*')
    mapHeader.push(label)
  })

  return {header: [header], width: width, headerRows: 1, mapHeader}
}

function getContent(dataRows, columnList, isGrouped = false, counterKey=0, acc= [], sumAllContent = {}, formulas=[]){

  let tempData = []
  let mapBody = []
  let mapValue = {}

  if(dataRows.length === 0){
    let result2 = []
    let result = []
    columnList.forEach((x, index) =>{
      if(index === 0)
        result.push({text: `AUCUN RESULTAT`, style: ['element'], border:[1,1,1,1], bold: true, colSpan: (columnList.length+ formulas.length)})
      else
        result.push({})
    })
    result2.push(result)
    return result2
  }

  if(!isGrouped){ // Si pas de groupage
    acc = printCells(dataRows, columnList, counterKey, mapBody, formulas)
  }
  else{
    dataRows.forEach((data, key) =>{

      //Affichage de la clé (groupe)
      let border = counterKey === 0 ? [0,1,0,0] : [0,0,0,0]
      columnList.forEach((column, idx) => {
        if(idx === counterKey)
          tempData.push({ text:  `${formatData(data[0], column)}`, style:['key'], border: border, type: get(column, 'type')})
        else
          tempData.push({ text:  ``, style:['element'], border: border})
      })
      formulas.forEach((column, idx) => {
          tempData.push({ text:  ``, style:['element'], border: border})
      })
      acc.push(tempData)
      tempData = []


      //Affichage des datas
      if(Array.isArray(data[1])){

        let arrays = printCells(data[1], columnList, counterKey, mapBody, formulas)
        arrays.forEach(y => acc.push(y))
        //acc.push(tempData)
        tempData = []

      }
      else{
        getContent(_toPairs(data[1]), columnList, true, counterKey+1, acc, sumAllContent, formulas)
      }

      if(columnList.some(x => x.sumData)) {

        //On fait la somme des data du groupe
        let values = {}
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

            values[column.code] = sum
            tempData.push({text: `${formatData(sum, 'int4')}`, style: ['total'], border:[0,1,0,0]})
          }

          else{
            tempData.push({text: ``, style: ['total'], border:[0,1,0,0]})
          }

        })

        evaluateExpression(formulas, values, [0,1,0,0]).forEach(x => tempData.push(x))
        acc.push(tempData)
        tempData = []

        //On fait les pourcentages des data du groupe
        values = {}
        columnList.forEach((column, idx) =>   {
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

            let resultSum = sumAllContent[get(column, 'code')] !== 0 ? (sum/sumAllContent[get(column, 'code')] ) : 0
            values[column.code] = resultSum
            let percent = sumAllContent[get(column, 'code')] !== 0 ? (sum/sumAllContent[get(column, 'code')] ) * 100 : 0
            tempData.push({text: `${separatorNumber(_round(percent, 2))}%`, style: ['total'], border:[0,0,0,1]})


          }

          /* else if (idx > counterKey && !isNumeric(column)){
             //console.log('col', column)
             tempData.push({text: ``, style: ['total'], border:[0,0,0,1]})
           }*/


          else{
            tempData.push({text: ``, style: ['total'], border:[0,0,0,1]})
          }
        })
        formulas.forEach(x => tempData.push({text : '', border:[0,0,0,1]}))

        acc.push(tempData)
        tempData = []

      }

    })
  }

  return acc
}

function getSumContent(dataRows, column, acc=0, isPair=false){

  if(isPair){
    dataRows.forEach(x =>{
      if(Array.isArray(x[1])){
        //console.log('column', column)
        acc += _reduce(x[1], function(res, current, k){
          let val = parseFloat(get(current, get(column, 'code', ''), 0))
          if (isNaN(val)) val = 0
          //res +=  parseFloat(get(current, get(column, 'code', ''), 0))
          res +=  val
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
      let val = parseFloat(get(current, get(column, 'code', ''), 0))
      if (isNaN(val)) val = 0
      //res +=  parseFloat(get(current, get(column, 'code', 0), 0))
      res +=  val
      return res
    }, 0)
  }

  return acc
}

function evaluateExpression(formulas, values, border = [1,1,1,1]){

  let tempData = []
  formulas.forEach(formula =>{

    //Formation des variables
    let variables = {}

    formula.variables.forEach(x => {
      variables[get(x, 'variable')] = values[get(x, 'column.code')]
    })
    let parser = new Parser()
    let expr = parser.parse(formula.expression)
    let val = expr.evaluate(variables)
    val = isNaN(val) ? 0 : val
    tempData.push({text: `${separatorNumber(_round(val, 6))}`, style: ['element'], border:border, type: 'int'})
  })
  return tempData
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

  let type = ''
  if(typeof column === 'object')
    type = get(column, 'type', 'varchar')
  else
    type = column

  let value = ''
  switch (type){
    case 'float8':
    case 'float4':
    case 'numeric':
    case 'int4':
    case 'int8':
    case 'int':
      value = data ? separatorNumber(_round(parseFloat(data), 5)) : 0
      break
    case 'date':
      value = moment(data).isValid() ? moment(data).tz(moment.tz.guess()).format('DD-MM-YYYY') : 'N/A'
      //value = moment(data).isValid() ? moment(data).tz(moment.tz.guess()).format('YYYY-MM-DD') : 'N/A'
      break
    case 'timestamptz':
      //value = moment(data).isValid() ? moment(data).tz(moment.tz.guess()).format('DD/MM/YYYY'): 'N/A'
      value = moment(data).isValid() ? moment(data).tz(moment.tz.guess()).format('DD/MM/YYYY HH:mm:ss'): 'N/A'
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

  if(column.data && Array.isArray(column.data) && column.data.length > 0){
    let elmt = column.data.find(x => x.code === data)
    if(elmt)
      value = get(elmt, 'name')
  }

  return value
}

function isNumeric(column){
  let type = get(column, 'type', 'varchar')
  let value = false
  switch (type){
    case 'float4':
    case 'float8':
    case 'numeric':
    case 'int8':
    case 'int4':
      value = true
      break
    default:
      value = false
      break
  }
  return value

}

function printCells(data, columnList, counterKey, mapBody =[], formulas=[]){

  let acc = []
  let tempData = []
  let values = {}
  data.forEach((x, idx) =>{
    columnList.forEach((column, idx) => {
      if (idx > counterKey){
        mapBody.push(get(x, get(column, 'code', ''), ''))
        values[column.code] = get(x, get(column, 'code', ''))
        let val = formatData(get(x, get(column, 'code', ''), ''), column)
        tempData.push({text: `${val}`, style: ['element'], border:[1,1,1,1], type: get(column, 'type')})
      }
      else
        tempData.push({text: ``, style: ['element'], border:[1,1,1,1]})
    })
    evaluateExpression(formulas, values, [1,1,1,1]).forEach(x => tempData.push(x))

    //console.log("tempData", tempData)
    acc.push(tempData)
    tempData = []
  })
  return acc

}

function printTotalG(sumAllContent, columnList, acc, isGrouped = true, formulas =[]){
  //On affiche le total général
  let tempData = []
  let border = [0,1,0,0]
  let values = {}
  if(isGrouped)
    border = [0,1,0,0]
  else
    border = [1,1,1,1]

  if(columnList.some(x => x.sumData)) {
    columnList.forEach((column, idx) => {
      if(idx === 0){
        tempData.push({text: `Total Général `, style: ['totalG'], border:border})
      }
      else if (idx > 0 && isNumeric(column) && column.sumData){
        values[column.code] = sumAllContent[get(column, 'code')]
        tempData.push({text: `${separatorNumber(_round(sumAllContent[get(column, 'code')], 6))}`, style: ['total'], border:border, type: get(column, 'type')})
      }
      else{
        tempData.push({text: ``, style: ['total'], border:border})
      }

    })

    evaluateExpression(formulas, values, border).forEach(x => tempData.push(x))


    acc.push(tempData)
  }

  return acc
}

function orderColumn(groupBy, columns){

  let newArray = _clone(columns)
  //Remove groupBy element
  groupBy.forEach(x =>{
    let index = newArray.findIndex(y => y.code === x.column)
    newArray.splice(index, 1)
  })

  //Add groupBy element to top
  for(let i=groupBy.length-1; i>=0; --i){
    let index = columns.findIndex(y => y.code === groupBy[i].column)
    newArray.unshift(columns[index])
  }
  return newArray
}


//Fonctions Tableau Croisé Dymamique

function countChild(nodes, total=0, temoin = false){

  return _reduce(nodes, function(result, node, key){
    if(Array.isArray(node[1])){
      //console.log("(node[1]!!!", node)
      //console.log("result + _keys(node[1]).length", result + _keys(node[1]).length)
      return result + 1
      //return result + _keys(node[1]).length
    }
    else{
      //console.log("_toPairs(node[1]",_toPairs(node[1]))
      return countChild(_toPairs(node[1]), result, true)
    }

  }, total)

}

function getDynamikHeader(nodes, column_cross,  value_cross =[], columns=[]){
  let header = []
  let width = []
  let dataMap = []
  let dataSum = []

  //console.log('column_cross', column_cross)
  let value_cross_lenght = value_cross.length
  let totalColumnsInitial = countChild(nodes)
  let totalColumns = value_cross_lenght >= 1 ? totalColumnsInitial * value_cross_lenght : totalColumnsInitial


  //console.log('totalColumns', totalColumns)
  for(let i=0; i<totalColumns; i++){
    width.push("*")
    dataMap.push({})
  }

  //Ajout des totaux de fin de ligne
    for(let i=0; i<value_cross_lenght; i++){
      width.push("*")
    }

  //Ligne des colonnes
  width.push("*")
  //console.log('dataMap',dataMap)

  let headerRows = value_cross_lenght > 1 ? column_cross.length +1 : column_cross.length

  column_cross.forEach((col, k) =>{
    let temp = []
    let indexMap = 0

    //Ajout de la Colonne des lignes
    //console.log("rowSpan", rowSpan)
    if(k===0)
      temp.push({ text: "Etiquette colonne" , style: ['header'], rowSpan: headerRows })
    else
      temp.push({text: ''})

    _reduce(nodes, function (result, node, key) {

      let childs = getLevel(node, k)

      let col_name = column_cross[k]["column"]
      let currentColumn = columns.find(x => x.code === col_name)

      if(childs) {


        childs.forEach(child => {

          let paired = _toPairs(child)
          paired.forEach(x => {

            let celNumber = countChild([x])
            celNumber =  value_cross_lenght > 0 ? value_cross_lenght * celNumber : celNumber
            //console.log("celNumber", celNumber)
            //let colSpan = celNumber > 1 && (column_cross.length - 1) !== k ? celNumber : 1
            let colSpan = celNumber

            temp.push({text: formatData(x[0], currentColumn), style: ['header'], colSpan: colSpan > 1 ? colSpan : null})
            dataMap[indexMap][`${col_name}`] = x[0]
            indexMap++

            if (celNumber > 1) {
              for (let i = 0; i < (celNumber - 1); i++) {
                temp.push({text: ''})
                //console.log("indexMap", indexMap)
                dataMap[indexMap][`${col_name}`] = x[0]
                indexMap++
              }
            }

          })
        })


        //Ajout des totaux intermediaires
        //if(column_cross.length >1 )
        //  totalColumns +=  (column_cross.length *value_cross_lenght)


      }
      /*else{
          let celNumber = countChild(_toPairs(data))
          //console.log("yesss", celNumber)
          //for(let x=0; x<celNumber ; x++)
          temp.push({ text: 'iii' , style: ['header'] })
        }*/


//ok
      return node
    }, null)


    //Ajout des totaux de lignes
    value_cross.forEach(x =>{
      let col = columns.find(y => y.code === x.column)
      let alias = get(col, 'alias')
      alias = alias && alias !== ''? alias : get(col, 'name')
      if(k===0)
        temp.push({ text: `Total Somme ${alias}` , style: ['header'], rowSpan: headerRows })
      else
        temp.push({text: ''})
    })

    header.push(temp)


    //console.log('header', header)
  })

  //Ajout de la ligne des colonnes valeurs
  if(value_cross_lenght > 1){
    let temp = []
    temp.push({text: ' '})
    for(let i=0; i<totalColumnsInitial; i++){

      value_cross.forEach(x=>{
        let col = columns.find(y => y.code === x.column)
        let alias = get(col, 'alias')
        alias = alias && alias !== ''? alias : get(col, 'name')
        temp.push({ text: `${alias}` , style: ['header'] })
      })
    }

    //Ajout des colonne des totaux par ligne
    value_cross.forEach(x => temp.push({text: ''}) )
    header.push(temp)
  }


  // temp = []
  // temp.push({text: ' '})
  // for(let i=0; i<totalColumnsInitial; i++)
  // {
  //   value_cross.forEach(x=>{
  //     temp.push({ text: `OK`  })
  //   })
  // }
  // header.push(temp)



  //console.log("dataMap", dataMap)

  return {header: _clone(header), width: width, dataMap: dataMap, headerRows: headerRows}
}

function getLevel(nodes, level){

  let childs = []
  let _nodes  =  _clone(nodes)
  //console.log('level', level)

  if(level === 0){
    let obj = {}
    obj[nodes[0]] = nodes[1]
    childs.push(obj)
    return childs
  }
  else{
    //console.log('nodesssss', nodes)
    let paired =  _toPairs(_nodes[1])
    //console.log('paired', paired)
    paired.forEach((x, k) =>{
      /*console.log('xxxx', x)
      console.log('new level', level-1)*/
      //console.log("yeahhhhh", childs.push(getLevel(x, level-1)))
      let obj =  (getLevel(x, level-1))
      let keys = Object.keys(obj)
      let data = {}
      keys.forEach(k =>{
        data =obj[k]
        childs.push(data)
      })
    })

  }
  //console.log("childssss", childs)
  return childs

}

function getDynamikContent(nodes, line_cross, column_list, dataMap, datas, level=0, value_cross =[], content = [], previousValue = null){

  let temp = []
  let blank = '    '
  //console.log('nodes', nodes)
  //console.log('line_cross', line_cross)


  _reduce(nodes, function (result, node, key) {
    //console.log('node', node)
    //console.log('initial result', _clone(result))
    let col = line_cross[level]
    let line_name = get(col, 'name')
    let line = node[0]


   /* console.log('line_cross', line_cross)
    console.log('col', col)
    console.log('level', level)
    console.log('line', line)
    console.log('previousValue', previousValue)*/
    /*console.log('line_cross', line_cross)

    console.log('line_name', line_name)

    console.log('initial previousValue', previousValue)*/

    let filter = {}



    if(previousValue && level !== 0)
      filter = {...filter, ...previousValue}
    else
      previousValue = {}

    filter[get(col, 'column')] = node[0]


    for(let i=0; i<level; i++)
      line = blank+line

    result.push(printDynamikLine(line, column_list, value_cross, datas, dataMap, filter, level))

    //Mise a jour de la valeur de filtre de ligne
   // console.log('get(line_cross[level-1], \'column\')', line_cross[level-1])

    //if(level-1 >= 0)
    previousValue[get(line_cross[level], 'column')] =  node[0]

    /*console.log("level", level)
    console.log("line_cross[level]", line_cross[level])
    console.log("prevprevprevprevprev", _clone(previousValue))*/

    //console.log("_clone(result)", _clone(result))
    /*console.log("node[1]", node[1])
    console.log("!Array.isArray(node[1])", !Array.isArray(node[1]))*/
    if(!Array.isArray(node[1])){
      //console.log("_toPairs(node[1]", _toPairs(node[1]))
      //console.log("getDynamikContent(_toPairs(node[1]), line_cross, dataMap, datas, level+1, value_cross)", getDynamikContent(_toPairs(node[1]), line_cross, dataMap, datas, level+1, value_cross))
      //temp = get(getDynamikContent(_toPairs(node[1]), line_cross, column_list,  dataMap, datas, level+1, value_cross, []), "[0]")
      temp = getDynamikContent(_toPairs(node[1]), line_cross, column_list,  dataMap, datas, level+1, value_cross, content, _clone(previousValue))
      //console.log("yooo", temp)
      //result.push(temp)
    }
    /*else{
      console.log("yesssssss")
      previousValue = {}
    }*/

    //console.log("result", result)

    return result
  }, content)

  //console.log("content", content)
  //content.push(newContent)
  //console.log("my content",   content)
  return content

}

function printDynamikLine(line, column_list, value_cross, datas, dataMap, filter_line = {}, level=0){

  let temp = []
  let total_acc = []
  //console.log("value_cross", value_cross)
  //console.log("dataMap", dataMap)

  //Initialisation de l'accumulateur total
  value_cross.forEach(x => total_acc.push(0))


  //Ajout de la premiere colonne
  let border = [1,1,1,1]

  if(level === 0)
    border = [1,1,1,0]
  else
    border = [1,0,1,0]

  temp.push({text: `${line}`, margin: [10*level, 0,0,0], border: border, bold: level===0})

  let indexValue = 0
  dataMap.forEach(x =>{

    //console.log("xxxxxx", x)
    //On forme l'objet du filtre
    let filter = {}
    let keys = Object.keys(x)
    keys.forEach(y => {
      let col = column_list.find(cl => cl.code === y)
      isNumeric(col) ? filter[y] = parseFloat(x[y]) : filter[y] = x[y]
    })
    //console.log("filter_line", filter_line)
    //console.log("filter", filter)
    let mergeFilter = {...filter, ...filter_line}
    //console.log("mergeFilter", mergeFilter)
    let filterData = _filter(datas, _clone(mergeFilter))
    //console.log("filterData", filterData)

    //On calcule les datas
    if(value_cross.length >0){
      let data = ''
      if(isNumeric(value_cross[indexValue])){
        data = _sumBy(filterData, value_cross[indexValue].column)
      }
      else{
        data = filterData.length
      }
      /*console.log("line",line)
      if(line === "Bohicon"){
        console.log('Data', data)
      }*/

      temp.push({ text: `${formatData(data, value_cross[indexValue])}`, style: ['element'] , bold: level===0, type: 'int' })
      /*if(line === "Bohicon"){
        console.log('tab', { text: `${formatData(data, value_cross[indexValue])}`, style: ['element'] , bold: level===0, type: 'int' })
      }*/
      total_acc[indexValue] += data

      //console.log("data", data)
      indexValue++
      if(indexValue >= value_cross.length)
        indexValue = 0

    }
    else {
      temp.push({ text: ``})
    }


  })

  //Ajout des dernières lignes
  for(let i=0; i<value_cross.length; i++)
    temp.push({ text: `${formatData(total_acc[i], 'int')}`, style: ['element'] , bold: true, type: 'int' })


  return temp
}

function sumAllDynamikContent(datas, dataMap, column_list, value_cross){

  let totalGeral =[]
  let total_acc = []

  //Initialisation de l'accumulateur total
  value_cross.forEach(x => total_acc.push(0))

  totalGeral.push({text: `Total Général`,  style: ['totalG']})
  let indexValue = 0
  dataMap.forEach(x =>{

    //console.log("xxxxxx", x)
    //On forme l'objet du filtre
    let filter = {}
    let keys = Object.keys(x)
    keys.forEach(y => {
      let col = column_list.find(cl => cl.code === y)
      isNumeric(col) ? filter[y] = parseFloat(x[y]) : filter[y] = x[y]
    })
    //console.log("filter", filter)
    let filterData = _filter(datas, filter)
    //console.log("filterData", filterData)

    //On calcule les datas
    if(value_cross.length >0){
      let data = ''
      if(isNumeric(value_cross[indexValue])){
        data = _sumBy(filterData, value_cross[indexValue].column)
      }
      else{
        data = filterData.length
      }
      totalGeral.push({ text: `${formatData(data, value_cross[indexValue])}`, style: ['element'], type: 'int'})
      //console.log("data", data)

      total_acc[indexValue] += data

      indexValue++
      if(indexValue >= value_cross.length)
        indexValue = 0
    }
    else {
      totalGeral.push({ text: ``, style: ['element']})
    }


  })

  //console.log("totalGeral", totalGeral)

  //Ajout des dernières lignes
  for(let i=0; i<value_cross.length; i++)
    totalGeral.push({ text: `${formatData(total_acc[i], 'int')}`, style: ['element'] , bold: true, type: 'int' })

  return totalGeral
}


let f = function (payload) {

  //console.log('payload', payload)
  let payloadData = get(payload, 'rows')


  let filter = (get(payload, 'filter'))
  let columns = get(filter, 'columns')
  let formulas = get(filter, 'formulas')
  let title = get(filter, 'title')
  let groupBy = get(filter, 'groupBy', [])
  let counterKey = groupBy.length > 0 ? 0 : -1

  //On ordonne les colonnes en fonction des colonnes
  if(counterKey === 0)
    columns = orderColumn(groupBy, columns)

  //Tableau croisé dynamique
  let column_cross = get(filter, 'column_cross', [])
  let column_cross_grouped = []
  let column_cross_paired = []

  let line_cross = get(filter, 'line_cross', [])
  let line_cross_grouped = []
  let line_cross_paired = []

  let value_cross = get(filter, 'value_cross', [])

  let isDynamik = column_cross.length >0 || line_cross.length >0 ? true : false

  if(column_cross.length >0){
    column_cross_grouped = getDataRows(column_cross, payloadData)
    column_cross_paired = _toPairs(column_cross_grouped)
  }

  if(line_cross.length >0){
    line_cross_grouped = getDataRows(line_cross, payloadData)
    line_cross_paired = _toPairs(line_cross_grouped)
    //console.log('line_cross_paired', line_cross_paired)
  }


  /*console.log('payloadData', payloadData)
  console.log('filter', filter)
  console.log('columns', columns)
  console.log('groupBy', groupBy)
  console.log('title', title)
  console.log('groupBy.length', groupBy.length)*/

  let rows = groupBy.length > 0 ? getDataRows(groupBy, payloadData) : payloadData
  let rowsArray = groupBy.length > 0 ? _toPairs(rows) : rows
  let isGrouped = groupBy.length > 0
  let sumContent = null
  /*if(isGrouped){
    sumContent = sumAllContent(payloadData, columns)
  }*/
  sumContent = sumAllContent(payloadData, columns)
  //let header =  getHeader(columns)
  let header = isDynamik ? getDynamikHeader(column_cross_paired, column_cross, value_cross, columns) : getHeader(columns, formulas)
  let content = isDynamik
    ? getDynamikContent(line_cross_paired, line_cross, columns, get(header, 'dataMap', []), get(payload, 'rows'),0, value_cross)
    : getContent(rowsArray, columns, isGrouped, counterKey, [],  sumContent, formulas)

  //content = getDynamikContent(line_cross_paired, line_cross, columns, get(header, 'dataMap', []), get(payload, 'rows'),0, value_cross)

  //Ajout du total général
  if(isDynamik)
    content.push(sumAllDynamikContent( get(payload, 'rows'), get(header, 'dataMap', []), columns, value_cross))
  else if(payloadData.length > 0)
    content = printTotalG(sumContent, columns, content, isGrouped, formulas)


  let pageSize = get(filter, 'options.pageSize', 'A4')
  let pageOrientation = get(filter, 'options.pageOrientation', 'portrait')

  /*console.log('header', header)
  console.log('rows', rows)
  console.log('content', content)*/

  let body = []
  body.push(...get(header,'header',[]))
  //body.push(...content)
  content.forEach(x => body.push(x))

  let table = {
    table:{
      widths: get(header, 'width', []),
      headerRows: get(header, 'headerRows', 1),
      body: body
    }
  }

  //console.log("table", table)
  moment.locale('fr');
  //console.log("payload", payload)

  let data = {
    start_date: get(payload, 'start_date'),
    end_date: get(payload, 'end_date'),
    periode: get(payload, 'periode'),
    docHeaderTitle: title.toUpperCase(),
    impression_date: moment().format('LLLL'),
    table: table,
    user_name: get(payload, 'user_name'),
    production_chain: get(payload, 'production_chain_name'),
    campaign_name: get(payload, 'campaign_name'),
    title: title,
    pageSize: pageSize,
    pageOrientation: pageOrientation
  };
  //console.log('data', data)


  return data

  /*return {
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
  }*/
}

export default f
