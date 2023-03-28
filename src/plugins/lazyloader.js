export function prefetchLoaderReport(render, payload, key) {
  return import(`../render/${render}.js`).then((mod) => defMod(mod)(payload, key));
}

export function lazyXLSX() {
  return import( /* webpackPrefetch: true */'xlsx').then((mod) => defMod(mod));
}

export function pdfMakeToExcel() {
  return import( /* webpackPrefetch: true */'pdfmake-to-excel').then((mod) => defMod(mod));
}


export function loadReportGenerator() {
  return import( /* webpackPrefetch: true */'../components/ReportForm').then((mod) => defMod(mod));
}



export function lazyJsPDF() {
  return import(/* webpackPrefetch: true */'jspdf').then(async (jsPDF) => {
    await import('jspdf-autotable')
    return defMod(jsPDF)
  });
}

export function defMod(mod) {
  return mod.default || mod
}
