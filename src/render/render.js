import ReportTemplate from './template'
import generator from "./generator";


let f = function (payload) {



  let data = generator(payload)

  /*let data = {
    start_date: get(payload, 'start_date'),
    end_date: get(payload, 'end_date'),
    periode: get(payload, 'periode'),
    docHeaderTitle: title.toUpperCase(),
    impression_date: moment().format('LLLL'),
    table: table,
    user_name: get(payload, 'user_name', ''),
    production_chain: get(payload, 'production_chain_name'),
    campaign_name: get(payload, 'campaign_name'),
    title: title
  };*/
  //console.log('data', data)


  return {
    info: ReportTemplate.info,
    content: ReportTemplate.content(data),
    footer: ReportTemplate.footer(data),
    header: ReportTemplate.header,
    styles: ReportTemplate.styles,
    defaultStyle: ReportTemplate.defaultStyle,
    pageOrientation: ReportTemplate.pageOrientation(data.pageOrientation),
    pageMargins: ReportTemplate.pageMargins,
    pageSize: ReportTemplate.pageSize(data.pageSize),
    permissions: ReportTemplate.permissions,
  }
}

export default f
