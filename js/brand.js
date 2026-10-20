/* Shared profile identity and safely decoded raster uploads. */
var BizBrand = (function(){
  function esc(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function validLogo(value){return typeof value==='string' && value.length<=750000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);}
  function header(s){
    var hasLogo = validLogo(s.logo_data_url);
    var logoImg = hasLogo ? '<img src="'+s.logo_data_url+'" alt="Business logo" style="height:50px;max-width:130px;object-fit:contain;flex-shrink:0"/>' : '';
    var brandDetails = '<div style="display:flex;flex-direction:column;justify-content:center">' +
      '<div style="font-size:20px;font-weight:800;color:#0B163F;line-height:1.2">'+esc(s.business_name)+'</div>' +
      (s.email || s.phone ? '<div style="font-size:10px;color:#64748b;margin-top:3px">'+esc([s.email,s.phone].filter(Boolean).join(' · '))+'</div>' : '') +
      '</div>';
    return hasLogo
      ? '<div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">'+logoImg+brandDetails+'</div>'
      : '<div style="margin-bottom:8px">'+brandDetails+'</div>';
  }
  function readImage(file,logo){return new Promise(function(resolve,reject){
    if(!file || !['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>5*1024*1024){reject(new Error('Choose PNG, JPG or WebP up to 5 MB.'));return;}
    var url=URL.createObjectURL(file),img=new Image();
    img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('Cannot open this image.'));};
    img.onload=function(){URL.revokeObjectURL(url);try{
      if(!img.width||!img.height||img.width*img.height>40000000)throw new Error('Image dimensions are too large.');
      var scale=Math.min(1,(logo?600:1600)/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
      var ctx=canvas.getContext('2d');if(!logo){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(img,0,0,canvas.width,canvas.height);
      var data=canvas.toDataURL(logo?'image/png':'image/jpeg',0.8);if(data.length>750000)throw new Error('Please crop or resize this image before uploading.');
      resolve({name:file.name,dataUrl:data,mimeType:logo?'image/png':'image/jpeg',data:data.split(',')[1]});
    }catch(error){reject(error);}};img.src=url;
  });}
  function context(s){var data={};['business_name','address','phone','email','gst_number','currency','currency_symbol','default_gst_bp','default_validity_days'].forEach(function(key){data[key]=s[key];});return data;}
  return {header:header,validLogo:validLogo,readImage:readImage,context:context};
})();
