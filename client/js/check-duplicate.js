var checkDuplicate = function(){
    return{
        init:function(){
            $("#get_result").click(function(){
                checkDuplicate.requestFile();
            });
            $(".btn-secondary").click(function(){
               checkDuplicate.filterEngine();
            });
            $("#btn-warning").click(function(){
                checkDuplicate.filterWarning();
            });
            $("#generate_log").click(function(){
                checkDuplicate.getLatstFile();
            })
        },
        requestFile: function(){
            $("#result").empty();
            var $loading = $("<div class='loading-spinner'></div>");
            $("#result").append("<table id='checkTable' class='table table-striped table-bordered' width='100%'></table>")
            //.append($loading)
            var url = '/getAllData?fileName='+ $('#isource').val();
            $.get(url, function( dataSet ) {
                // $("#result").remove($loading);
                // clearInterval(countInterval);
                hdfsHandler.linuxDataHandler(dataSet.data);
                var table = $('#checkTable').DataTable({
                        // "initComplete": function () {
                        //     var api = this.api();
                        //     api.$('td').click( function () {
                        //         api.search( this.innerHTML ).draw();
                        //     } );
                        // },
                        data: hdfsHandler.linuxRepo,
                        "columnDefs": [
                            { "visible": false,  "targets": [ 4, 10 ] }
                        ],
                        columns:[
                            {title: "fileSize"},
                            {title: "updateDate"},
                            {title: "updateTime"},
                            {title: "fileDate"},
                            {title: "fileDetail"},
                            {title: "fileName"},
                            {title: "engine"},
                            {title: "ip"},
                            {title: "warning"},
                            {title: "token"},
                            {title: "fileFull"},
                        ]
                    });
                $('a.toggle-vis').on( 'click', function (e) {
                    e.preventDefault();
                    // Get the column API object
                    var column = table.column( $(this).attr('data-column') );
                    // Toggle the visibility
                    column.visible( ! column.visible() );
                });
            });
        },
        filterEngine: function(){
            var engine = $(this).text().trim();
            filterColumn("checkTable", 6, (engine!="all")?engine:"");
        },
        filterWarning: function(){
            if(checkwarning){
                filterColumn(7, "Warning");
            }
            else{
                filterColumn(7, "");
            }
            checkwarning = !checkwarning;
        },
        getLatstFile: function(){
            $.get( "/latestFile", function( dataSet, status ) {
                if (status == "success") {
                    $('#itable').html("Generate latest log list success");
                    $('#isource').val(dataSet);
                }
                console.log(dataSet);
            });
        }
    }
}();