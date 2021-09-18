// let trace=1, title=""
// trace ? console.log(title,"") : null;
let trace=1, title="toSVG.js:"


function saveSvg(svgEl, name) {
    let trace=1, title="saveSVG():"
    trace ? console.log(title,"---- Started ----") : null;
    trace ? console.log(title,"svgEl=",svgEl) : null;
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgEl.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
