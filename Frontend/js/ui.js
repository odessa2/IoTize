$(document).ready(function() {
    var nofHW;
    var nofSW;

    var hwValid = null;
    var swValid = null;
    var confValid = null;


    function checkConstraints() {
        return hwValid && swValid && confValid;
    };

    function setProgress(value) {

        $('.progress-bar').css('width', value + '%').attr('aria-valuenow', value);


    }

    function fade(outID, inID) {
        if ($('html').scrollTop()) {
            $('html').animate({
                scrollTop: 0
            });
        }

        if ($('body').scrollTop()) {
            $('body').animate({
                scrollTop: 0
            });

        }
        $(outID).fadeOut("slow", function() {
            $(inID).fadeIn("slow", function() { // Animation complete
            });

        });
    }


    $("#stepbtn0").click(function() {
        fade("#step0", "#step1");
        setProgress(0);

        //load module data
        $.get("stage0/getHWComponents", function(data) {
            for (var i = 0; i < data.length; i++) {
                $("#stage1list").append('<tr><td><input type="checkbox" id="s1cb' + i + '" value=""></td><td id="hw' + i + '"">' + data[i].name.toString() + '</td><td>' + data[i].description.toString() + '</td><td>' + data[i].bus.toString() + '</td></tr>');

                console.log(data[i].name.toString());

            }
            nofHW = data.length;

        });
    });

    $("#stepbtn1").click(function() {

        var selectedModules = new Array;
        for (i = 0; i < nofHW; i++) {
            if ($('#s1cb' + i).is(":checked"))
                selectedModules.push($('#hw' + i).html())


        }
        console.log(selectedModules.length);
        if (selectedModules.length == 0) selectedModules.push("NULL");
        $.post("/stage1/submitHWComponents", {
                modules: selectedModules
            },
            function(data, status) {
                if (data == "VALID") {
                    console.log("HW is Valid");
                    hwValid = true;



                } else hwValid = false;

                if ((selectedModules.length != 0) && (hwValid == true)) {
                    fade("#step1", "#step2");
                    setProgress(25);


                    $.get("stage1/getSWComponents", function(data) {
                        for (var i = 0; i < data.length; i++) {


                            $("#stage2list").append('<tr><td><input type="checkbox" id="s2cb' + i + '" value=""></td><td id="sw' + i + '">' + data[i].name.toString() + '</td><td>' + data[i].description.toString() + '</td></tr>');

                            console.log(data[i].name.toString());

                        }
                        nofSW = data.length;

                    });



                } else {
                    $("#s1warning").css("display", "block");
                    if (checkConstraints() == false)
                        $("#s1warning").html("<strong>Warnung!</strong> - Constraint Error - Some pins are used multiple Times, which is only allowed in i2c (D1,D2) and SPI (D4,D5,D6,D7)");


                }


            });



    });

    var confdata = new Object;
    $("#stepbtn2").click(function() {

        var selectedModules = new Array;
        for (i = 0; i < nofSW; i++) {
            if ($('#s2cb' + i).is(":checked"))
                selectedModules.push($('#sw' + i).html())
                //console.log($('#s1cb'+ i).is(":checked"));
                //    console.log($('#hw'+i).html());

        }
        console.log(selectedModules.length);
        if (selectedModules.length == 0) selectedModules.push("NULL");

        $.post("/stage2/submitSWComponents", {
                modules: selectedModules
            },
            function(data, status) {
                if (data == "VALID") {
                    console.log("SW is Valid");
                    swValid = true;
                } else swValid = false;

                if ((selectedModules.length != 0) && (swValid == true)) {
                    fade("#step2", "#step3");
                    setProgress(50);

                    $("#confDiv").text("");

                    $.get("stage2/getConfigurationOptions", function(data) {
                        console.log(data);
                        confdata = data;
                        for (var i = 0; i < data.length; i++) {
                            var htmltemplate = '<div class=\"panel panel-default\" id=\"' + data[i].name + 'ConfPanel\">    <div class=\"panel-heading\"><h3 class=\"panel-title\">' + data[i].name + '</h3>    </div>   <div class=\"panel-body\"> $FORM </div></div>';
                            /**/
                            var formtemplate = '<form>$FORMITEMS</form>';
                            var staticParamTemplate = '  <div class=\"form-group\">     <label for=\"$INPUTPARAMID\">$INPUTPARAMNAME</label> $DESCRIPTION <input type=\"text\" class=\"form-control\" id=\"$INPUTPARAMID\" placeholder=\"\"></div>';
                            var dynParamTemplate = '<div class=\"form-group\"><label for=\"$SELECTNAME\">$DYNPARAMNAME</label> <select id=\"$SELECTNAME\" class=\"form-control\">$VALUES</select></div>';
                            var formItems = "";
                            var staticparamsSection = "";
                            if ("staticParameter" in data[i]) {
                                for (var j = 0; j < data[i].staticParameter.length; j++) {
                                    staticparamsSection += staticParamTemplate.replace("$DESCRIPTION", data[i].staticParameter[j].description.en).replace("$INPUTPARAMID", data[i].staticParameter[j].name + "InputID").replace("$INPUTPARAMID", data[i].staticParameter[j].name + "InputID").replace("$INPUTPARAMNAME", data[i].staticParameter[j].name);

                                }
                            }
                            formItems += staticparamsSection;

                            var dynparamSection = "";
                            var optionsTemplate = "<option>$OPTIONNAME</option>";

                            if ("dynamicParameter" in data[i]) {


                                //type: input or label

                                for (var j = 0; j < data[i].dynamicParameter.length; j++) {
                                    var options = optionsTemplate.replace("$OPTIONNAME", "null");
                                    if (data[i].dynamicParameter[j].type == "label") {

                                        for (var k = 0; k < data[i].dynParamsValues.length; k++) {
                                            options += optionsTemplate.replace("$OPTIONNAME", data[i].dynParamsValues[k].name);
                                        }
                                        dynparamSection += dynParamTemplate.replace("$SELECTNAME", data[i].dynamicParameter[j].name + "InputID").replace("$SELECTNAME", data[i].dynamicParameter[j].name + "InputID").replace("$DYNPARAMNAME", data[i].dynamicParameter[j].name).replace("$VALUES", options);


                                    }
                                    if (data[i].dynamicParameter[j].type == "input") {

                                        var inputTemplate = " <label for=\"$INPUTPARAMID\">$INPUTPARAMNAME</label> $DESCRIPTION <input type=\"text\" class=\"form-control\" id=\"$INPUTPARAMID\" placeholder=\"\">";
                                        dynparamSection = "";

                                        var numberOfFields;
                                        if (data[i].dynParamMultipleValues == 0) n = 1
                                        else n = data[i].dynParamsValues.length;
                                        for (var l = 0; l < n; l++) {
                                            var options = optionsTemplate.replace("$OPTIONNAME", "null");
                                            for (var k = 0; k < data[i].dynParamsValues.length; k++) {
                                                options += optionsTemplate.replace("$OPTIONNAME", data[i].dynParamsValues[k].name);
                                            }
                                            dynparamSection += inputTemplate.replace("$INPUTPARAMID", data[i].dynamicParameter[j].name + j + "TextInputID").replace("$INPUTPARAMID", data[i].dynamicParameter[j].name + l + "TextInputID").replace("$INPUTPARAMNAME", data[i].dynamicParameter[j].name).replace("$DESCRIPTION", data[i].dynamicParameter[j].description);
                                            dynparamSection += dynParamTemplate.replace("$SELECTNAME", data[i].dynamicParameter[j].name + "InputID").replace("$SELECTNAME", data[i].dynamicParameter[j].name + l + "InputID").replace("$DYNPARAMNAME", "Value").replace("$VALUES", options);
                                        }
                                    }

                                }
                                formItems += dynparamSection;

                            } // data lengh


                            $("#confDiv").append(htmltemplate.replace("$FORM", formtemplate.replace("$FORMITEMS", formItems)));

                        }


                    });


                } else {

                    $("#s2warning").css("display", "block");
                    if (checkConstraints() == false)
                        $("#s2warning").html("<strong>Constraint Error!</strong> " + data);

                }
            });



    });


    $("#stepbtn3").click(function() {

        var confReply = new Array;
        // retreive inputs
        for (var i = 0; i < confdata.length; i++) {
            var moduleConf = new Object;
            moduleConf.moduleName = confdata[i].name;
            moduleConf.staticParameter = new Object;


            if ("staticParameter" in confdata[i]) {
                for (var j = 0; j < confdata[i].staticParameter.length; j++) {
                    moduleConf.staticParameter[confdata[i].staticParameter[j].name] = $("#" + confdata[i].staticParameter[j].name + "InputID").val();
                }
            }
            moduleConf.dynamicParameter = new Object;
            if ("dynamicParameter" in confdata[i]) {

                for (var j = 0; j < confdata[i].dynamicParameter.length; j++) {
                    if (confdata[i].dynamicParameter[j].type == "label") {
                        moduleConf.dynamicParameter[confdata[i].dynamicParameter[j].name] =
                            $('#' + confdata[i].dynamicParameter[j].name + 'InputID option:selected').text();
                    }
                    if (confdata[i].dynamicParameter[j].type == "input") {
                        if (confdata[i].dynParamMultipleValues == 0) n = 1
                        else n = confdata[i].dynParamsValues.length;
                        for (var l = 0; l < n; l++) {
                            if ($('#' + confdata[i].dynamicParameter[j].name + l + 'InputID option:selected').text() != "null")
                                moduleConf.dynamicParameter[$('#' + confdata[i].dynamicParameter[j].name + l + "TextInputID").val()] = $('#' + confdata[i].dynamicParameter[j].name + l + 'InputID option:selected').text();
                        }
                    }


                }



            }



            confReply.push(moduleConf);

        }


        console.log(JSON.stringify(confReply));
        $.post("/stage3/submitConfig", {
                conf: confReply
            },
            function(data, status) {
                if (data == "VALID") {
                    console.log("Conf is Valid");
                    confValid = true;
                }

                if ((confValid == true)) {

                    setProgress(75);
                    fade("#step3", "#step4");


                    $.get("stage3/getSourceCode", function(data) {
                        console.log(data);
                        $("#generatedCode").text(data.sourceString);
                        for (var i = 0; i < data.length; i++) {

                        }
                        $('pre code').each(function(i, block) {
                            hljs.highlightBlock(block);
                        });
                        var usbhtml = "<select id='usbSelector' class='form-control'>";
                        // $("#usbSelectorDiv").append();
                        for (var i = 0; i < data.usbports.length; i++) {
                            console.log(data.usbports[i]);
                            usbhtml += "<option>" + data.usbports[i].comName + "|" + data.usbports[i].pnpId + "</option>";
                        }

                        usbhtml += "</select>";
                        $("#usbSelectorDiv").html(usbhtml);



                    });
                } else {
                    $("#s3warning").css("display", "block");
                    if (checkConstraints() == false)
                        $("#s3warning").html("<strong>Error!</strong> - Constraint Error ");


                }


            });


    });



    $("#stepbtn4").click(function() {

        var data = new Object;
        data.code = $("#generatedCode").text();
        data.usbport = $('#usbSelectorDiv option:selected').text().split("|")[0];
        if (data.usbport.length == 0) {
            $("#s4fail").css("display", "block");
            $("#s4fail").html("<strong>NO USBPORT FOUND</strong>");
        } else {
            $("#s4info").css("display", "block");

            $("#s4info").html("<strong>Building!</strong> - Please wait");


            $.post("/stage4/compile", {
                    data: data
                },
                function(data, status) {
                    if (data.EXITCODE == 0) {
                  
                        $("#s4info").css("display", "none");
                        $("#s4success").css("display", "block");
                        $("#s4success").html("<strong>Build and Flash successful!</strong>");
                        setProgress(100);

                    } else {
                        $("#s4info").css("display", "none");

                        $("#s4fail").css("display", "block");

                        $("#s4fail").html("<strong>Build and Flash failed!</strong> </br> ");
                        $("#s4fail").append(data.ERRORCODE);
                        console.log(data.ERRORCODE);
                        console.log(JSON.stringify(data.ERRORCODE));

                    }
                });


        }

    });


    $("#exportConfFileBtn").click(function()

        {
            $.get("exportjson", function(data) {
                var text = JSON.stringify(data);

                function download(filename, text) {
                    var pom = document.createElement('a');
                    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                    pom.setAttribute('download', filename);

                    if (document.createEvent) {
                        var event = document.createEvent('MouseEvents');
                        event.initEvent('click', true, true);
                        pom.dispatchEvent(event);
                    } else {
                        pom.click();
                    }
                }
                download("myexport.iotjson", JSON.stringify(data));
                console.log(JSON.stringify(data));
            });

        });

    $("#importConfFileBtn").click(function()

        {

            var file = $("#importConfFileInput")[0].files[0];
            console.log(file)
                // Ein Objekt um Dateien einzulesen
            var reader = new FileReader();

            var senddata = new Object();
            // Auslesen der Datei-Metadaten
            senddata.name = file.name;
            senddata.date = file.lastModified;
            senddata.size = file.size;
            senddata.type = file.type;

            // Wenn der Dateiinhalt ausgelesen wurde...
            reader.onload = function(theFileData) {
                senddata.fileData = theFileData.target.result; // Ergebnis vom FileReader auslesen

                $.post("/importjson", {
                        iotconf: senddata
                    },
                    function(data, status) {
                        // wenn alles gut: goto step 4 (lese quellcode etc)
                        console.log(data);
                        fade("#step0", "#step4");
                        setProgress(75);

                        $("#generatedCode").text(data.sourceString);
                        for (var i = 0; i < data.length; i++) {

                        }
                        $('pre code').each(function(i, block) {
                            hljs.highlightBlock(block);
                        });
                        var usbhtml = "<select id='usbSelector' class='form-control'>";
                        for (var i = 0; i < data.usbports.length; i++) {
                            console.log(data.usbports[i]);
                            usbhtml += "<option>" + data.usbports[i].comName + "|" + data.usbports[i].pnpId + "</option>";
                        }

                        usbhtml += "</select>";
                        $("#usbSelectorDiv").html(usbhtml);

                    });

            }

            // Die Datei einlesen und in eine Data-URL konvertieren
            reader.readAsDataURL(file);


        });

    $("#usbrefresh").click(function() {
        $.get("/stage4/getUSBDevices", function(data) {
            console.log(data);
            $("#s4fail").css("display", "none");

            var usbhtml = "<select id='usbSelector' class='form-control'>";
            // $("#usbSelectorDiv").append();
            for (var i = 0; i < data.usbports.length; i++) {
                console.log(data.usbports[i]);
                usbhtml += "<option>" + data.usbports[i].comName + "|" + data.usbports[i].pnpId + "</option>";
            }
            usbhtml += "</select>";
            $("#usbSelectorDiv").html(usbhtml);
        });

    });

    $("#codeEdit").on('input', function() {
        $('#codeEdit').attr('rows', $("#codeEdit").val().split("\n").length);

    });

    $("#editCodeBtn").click(function() {

        $("#codeViewDiv").css("display", "none");
        $("#editRow").css("display", "none");
        $("#codeEditDiv").css("display", "block");
        $("#codeEdit").val($("#generatedCode").text());
        $('#codeEdit').attr('rows', $("#codeEdit").val().split("\n").length);
        });

    $("#saveCodeBtn").click(function() {
        $("#generatedCode").text($("#codeEdit").val());
        $("#codeEditDiv").css("display", "none");
        $("#codeViewDiv").css("display", "block");
        $("#editRow").css("display", "block");
    });

    $("#discardCodeBtn").click(function() {
        $("#codeEditDiv").css("display", "none");
        $("#codeViewDiv").css("display", "block");
        $("#editRow").css("display", "block");
    });


});