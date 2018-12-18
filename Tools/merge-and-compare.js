var mAC = function(){
    return{
        hdfsColumnDef:[
            {title: "index"},
            {title: "fileSize"},
            {title: "updateDate"},
            {title: "updateTime"},
            {title: "filePath"},
            {title: "fileDetail"},
            {title: "fileCategory"},
            {title: "fileDate"},
            {title: "fileName"},
            {title: "engine"},
            {title: "warning"},
            {title: "token"},
            {title: "mergeDetail"},
            {title: "hasDateFolder"},
        ],
        cibColumnDef:[
            {title: "index"},
            {title: "fileSize"},
            {title: "updateDate"},
            {title: "updateTime"},
            {title: "fileDate"},
            {title: "fileName"},
            {title: "engine"},
            {title: "compareResult"}
        ],
        csvfile: null,
        filterData: null,
        mergedData: null,
        cibData: null,
        resultTable: null,
        init: function(){
            //mAC.initUploadFile();
            mAC.initHDFSFileReader();
            mAC.initCibFileReader();
            $("#exportData").hide();
        },

        initUploadFile: function(){
            $("#uploadFile").ajaxForm(function(data){
                console.log(data);
            })
        },

        initHDFSFileReader: function(){
            $("#hdfsFile").on('change', function(){
                var fileReader  = new FileReader();
                fileReader.onload = function() {
                    //read file content
                    var arrayBuffer  = this.result;
                    var csvfile =  $.csv.toArrays(arrayBuffer);

                    //handle content
                    var handleFilePromise = new Promise(function(resolve, reject){
                        resolve(hDFSFileHandler.hdfsFileManager(csvfile));
                    })

                    //filter Date
                    handleFilePromise.then(function(value) {
                        var data = mAC.filterDate(value, $("#beginDate").val(), $("#endDate").val(), 2);
                        mAC.filterData = data;
                        $(".controlPanel-hdfs").find("span").text("Uploaded");
                        // mAC.generateTable(data, mAC.hdfsColumnDef);
                    });
                    
                    // var warningData = hdfsHandler.checkWarning(filterResult, null);
                    // var mergedFiles = hdfsHandler.mergeSize(hdfsHandler.linuxRepo);
                }
                if(this.files.length > 0)
                    fileReader.readAsBinaryString(this.files[0]);
            });
            $("#mergeHDFSData").click(function(){
                if(mAC.filterData != null)
                {
                    $(".controlPanel-hdfs").find("span").text("Start to merge data");
                    var mergePromise = new Promise((resolve, reject)=>{
                        mAC.mergedData = hDFSFileHandler.fileMerge(mAC.filterData);
                        resolve(mAC.mergedData);
                    })
                    mergePromise.then((value)=>{
                        mAC.filterData = value;
                        $(".controlPanel-hdfs").find("span").text("Finish merge data");
                    })
                }
                else{
                    alert("Table not ready yet!")
                }
            });
            $("#checkDuplicateHDFSData").click(function(){
                mAC.filterData = hDFSFileHandler.fileCheck(mAC.filterData);
                $(".controlPanel-hdfs").find("span").text("Finish Check warning");
            });
            $("#clearHDFSData").click(function() {
                $("#hdfsFile").val('');
                mAC.filterData = mAC.mergedData = [];
                $(".controlPanel-hdfs").find("span").text("Empty");
                $(".controlPanel-merge").find("span").text("Not ready");
                $("#exportData").hide();
            });
            $("#gernateHDFSData").click(function(){
                $("#exportData").click(function(){
                    exportToCSV(mAC.filterData, "hdfsFilterData");
                }).show();
                $(".select-engine").unbind().change(function(){
                    var engine = $(this).val().trim();
                    mAC.filterEngine(engine, "hdfs");
                });
                $(".select-warning").unbind().change(function(){
                    var status = $(this).val().trim();
                    mAC.filterWarning(status, "hdfs");
                });
                mAC.generateColumnList(mAC.hdfsColumnDef ,"detail-filter-panel");
                mAC.generateTable(mAC.filterData, mAC.hdfsColumnDef);
            })
        },

        initCibFileReader: function(){
            $("#cibFile").on('change', function(){
                mAC.cibData = [];
                var files = this.files;
                var fileReader  = new FileReader();
                function readFile(index) {
                    if( index >= files.length ) return;
                    var file = files[index];
                    fileReader.fileName = file.name;
                    fileReader.onload = function(e){
                        var arrayBuffer = e.target.result;
                        var csvfile =  $.csv.toArrays(arrayBuffer);
                        //handle content
                        var internalData = cibFileHandler.cibFileManager(csvfile, fileReader.fileName.split('.')[0]);
                        //filter Date
                        var res = mAC.filterDate(internalData, $("#beginDate").val(), $("#endDate").val(), 2);
                        res.map((ele)=>{
                            mAC.cibData.push(ele);
                        })
                        readFile(index + 1);
                    }
                    fileReader.readAsBinaryString(file);
                }
                readFile(0);
                $(".controlPanel-cib").find("span").text("Uploaded");
            });
            $("#gernateCIBData").click(function(){
                $(".btn-compare").unbind().click(function(){
                    var engine = $(this).text().trim();
                    mAC.filterEngine(engine, "cib");
                 });
                mAC.generateColumnList(mAC.cibColumnDef ,"detail-filter-panel");
                mAC.generateTable(mAC.cibData, mAC.cibColumnDef, [
                    { "visible": false,  "targets": [0, 2, 3] }
                ]);
            });
            $("#clearCIBData").click(function () {
                $("#cibFile").val('');
                mAC.cibData = [];
                $(".controlPanel-cib").find("span").text("Empty");
                $(".controlPanel-merge").find("span").text("Not ready");
                $("#exportData").hide();
            });
            $("#mergeAllData").click(function(){
                cibFileHandler.compareData(mAC.cibData, mAC.filterData);
                $(".controlPanel-merge").find("span").text("Finish merge data");
                console.log(mAC.cibData);
            });
        },

        tableFormat: function format ( d ) {
            // `d` is the original data object for the row
            var expandTable = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;"><tr><td>Merged Data:</td><tr>';
            for (let i = 0; i < d[12].length; i++) {
                expandTable += '<tr><td>'+ d[12][i] +'</td></tr>';
            }
            expandTable += '</table>';
            return expandTable;
        },

        generateTable: function(csvData, columns, visibility){
            if (mAC.resultTable) {
                mAC.resultTable.destroy();
            }
            $("#compareTable").empty();
            mAC.resultTable = $('#compareTable').DataTable({
                "search": {
                    "regex": true
                },
                "createdRow": function ( row, data, index ) {
                    if (data[12] && data[12].length > 1) {
                        $('td', row).eq(1).addClass('highlight');
                    }
                    $('td', row).eq(0).addClass('result-index');
                    $('td', row).eq(1).addClass('result-size');
                    $('td', row).eq(6).addClass('result-warning');
                    $('td', row).eq(7).addClass('result-token');
                },
                data: csvData,
                "columnDefs": visibility? visibility: [
                    { "visible": false,  "targets": [3, 4, 5, 6, 12] }
                ],
                columns: columns
            });

            //column visialblity
            $('a.toggle-vis').unbind().on( 'click', function (e) {
                e.preventDefault();
                // Get the column API object
                var column = mAC.resultTable.column( $(this).attr('data-column') );
                // Toggle the visibility
                column.visible( ! column.visible() );
            });

            //show detail
            $('#compareTable tbody').on('click', 'td.result-size', function () {
                var tr = $(this).closest('tr');
                var row =  mAC.resultTable.row( tr );
         
                if ( row.child.isShown() ) {
                    // This row is already open - close it
                    row.child.hide();
                    tr.removeClass('shown');
                }
                else {
                    // Open this row
                    if (row.data().length > 12) {
                        row.child( mAC.tableFormat(row.data()) ).show();
                    }
                    tr.addClass('shown');
                }
            });
            $('#compareTable tbody').on('click', 'td.result-token', function () {
                var tdValue = $(this).closest('td').text();
                $("#compareResult").find("input").val(tdValue);
            });
        },

        filterDate: function(data, beginDate, endDate, position){
            var result = null;
            try {
                var min = (beginDate)? new Date(beginDate): new Date(-8640000000000000);
                var max = (endDate)? new Date(endDate): new Date().now();
                result = data.filter((ele)=>{
                    if(ele[position]){
                        var valid = new Date(ele[position]);
                        if(valid > min && valid < max){
                            return ele;
                        }
                    }
                    return null;
                })
            } catch (error) {
                console.log(error);
            }
            return result;
        },

        filterEngine: function(engine, type){
            if (type== "cib") {
                filterColumn("compareTable", 6, (engine!="All")?engine:"");
            }
            else{
                filterColumn("compareTable", 9, (engine!="All")?engine:"");
            }
        },

        filterWarning: function(status, type){
            if (type== "hdfs") {
                filterColumn("compareTable", 10, (status!="All")?status:"");
            }
        },

        generateColumnList: function(column, target){
            $("." + target).empty();
            $("." + target).append("<span>Toggle column: </span><br/>")
            column.forEach((ele, i) => {
                var $item = $("<a class='toggle-vis btn btn-outline-primary' data-column='" + i + "'>" + ele.title + "</a>")
                $("." + target).append($item);
            });
        }
    }
}();

module.exports = mAC;