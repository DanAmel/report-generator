import ReportTemplate from './template'
import generator from "./generator";


let f = function (payload) {

  let data = generator(payload)


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
