/* Offline A4 PDF export. Vendors are bundled locally, never loaded from a CDN. */
var BizPDF = (function () {
  var busy = false;
  async function download(element, filename) {
    if (busy) return;
    if (!element || !element.textContent.trim()) { BizToast.show('Create a document preview first.', 'warning'); return; }
    busy = true;
    var stage = document.createElement('div'); stage.className = 'pdf-stage';
    stage.style.cssText = 'position:absolute;left:-10000px;top:0;width:794px;background:white;';
    var clone = element.cloneNode(true); clone.removeAttribute('id'); clone.classList.remove('print-area');
    clone.style.cssText = 'width:794px;background:white;color:#0b163f;';
    clone.querySelectorAll('[style]').forEach(function(node){
      if(node.style.backgroundClip === 'text' || node.style.webkitBackgroundClip === 'text') {
        node.style.background='none';node.style.color='#5357d8';node.style.webkitTextFillColor='#5357d8';node.style.backgroundClip='border-box';node.style.webkitBackgroundClip='border-box';
      }
    });
    clone.querySelectorAll('th').forEach(function(node){node.style.setProperty('background','transparent','important');node.style.setProperty('color','#ffffff','important');});
    clone.querySelectorAll('td').forEach(function(node){node.style.setProperty('padding-top','8px','important');node.style.setProperty('padding-bottom','8px','important');});
    stage.appendChild(clone); document.body.appendChild(stage);
    try {
      BizToast.show('Preparing your A4 PDF…', 'info');
      await Promise.all(Array.from(clone.querySelectorAll('img')).map(function(i){
        return i.decode ? i.decode().catch(function(){}) : (i.complete ? Promise.resolve() : new Promise(function(r){i.onload=i.onerror=r;}));
      }));
      var canvas = await html2canvas(clone, {scale:2,backgroundColor:'#ffffff',logging:false,windowWidth:1200,scrollX:0,scrollY:0});
      var pdf = new jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
      // Fit each page to A4; use row boundaries to avoid splitting a line item.
      var pxPerMm = canvas.width / 186, maxSlice = Math.floor(273 * pxPerMm), offset = 0;
      var rect = clone.getBoundingClientRect();
      var boundaries = Array.from(clone.querySelectorAll('tr,p')).map(function(row){return Math.round((row.getBoundingClientRect().bottom-rect.top)*2);}).sort(function(a,b){return a-b;});
      while (offset < canvas.height) {
        var end = Math.min(offset+maxSlice,canvas.height);
        if (end < canvas.height) {var safe=boundaries.filter(function(y){return y>offset+maxSlice*.6 && y<=end;});if(safe.length)end=safe[safe.length-1];}
        var page=document.createElement('canvas');page.width=canvas.width;page.height=end-offset;
        page.getContext('2d').drawImage(canvas,0,offset,canvas.width,page.height,0,0,page.width,page.height);
        if(offset)pdf.addPage();
        pdf.addImage(page.toDataURL('image/png'),'PNG',12,12,186,page.height/pxPerMm,undefined,'FAST');offset=end;
      }
      pdf.setProperties({title:filename,author:BizStorage.getSettings().business_name,creator:'BizDocs AI'});
      pdf.save(String(filename||'BizDocs-Document').replace(/[^a-zA-Z0-9_-]/g,'-')+'.pdf');
      BizToast.show('PDF downloaded.', 'success');
    } catch(error) { console.error('PDF export failed',error); BizToast.show('PDF export failed. Use Print → Save as PDF instead.', 'error'); }
    finally {stage.remove();busy=false;}
  }
  return {download:download};
})();
