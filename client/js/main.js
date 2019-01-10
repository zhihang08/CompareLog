var checkwarning = false;
function TryParseInt(str,defaultValue) {
    var retValue = defaultValue;
    if(str !== null) {
        if(str.length > 0) {
            if (!isNaN(str)) {
                retValue = parseInt(str);
            }
        }
    }
    return retValue;
}
function filterColumn (id, i, val) {
    if($('#' + id).DataTable() != undefined){
        $('#' + id).DataTable().column( i ).search(
            val,
            $('#col'+i+'_regex').prop('checked'),
            $('#col'+i+'_smart').prop('checked')
        ).draw();
    }
}
function setHeight() {
    var $tabPane = $('.tab-pane'),
        tabsHeight = $('.nav-tabs').height();
    
    $tabPane.css({
      height: tabsHeight
    });
}
function exportToCSV(data, name) {
    var csvData = $.csv.fromArrays(data);
    var blob = new Blob([csvData]);
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = (name) ? (name + ".csv") : ("temp" + ".csv");
    link.click();
}

$(function(){
    // checkDuplicate.init();
    mAC.init();
    setHeight();
});
