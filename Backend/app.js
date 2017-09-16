// Require Section

var express = require('express');
var bodyParser = require("body-parser");

var path = require('path');
var fs = require('fs');


var opn = require('opn');

var SerialPort = require('serialport');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


var rules = require('./rules.json');

// static, in future versions modular and replacable
var buildcmd = 'arduino --board esp8266:esp8266:d1_mini --port $PORT --upload tmp_build_dir/sketch.ino --verbose --pref build.flash_ld=eagle.flash.4m.ld';

var modulespath = path.join(process.cwd() , "/iotmodules/");


var components = new Array();
var hwsel = new Array();
var swsel = new Array();
var userconf = new Array();

var externallibs = new Array();

var installonly = false;

//}
//var installdependencys = false;

// Process Arguments

process.argv.forEach(function(val, index, array) {
    // Debug: CLI Arguments
    console.log(index + ': ' + val);
    if (val.includes("install-librarys")){
        installonly = true;
       
    }
    //  
});


// read modules from folder into components Array
fs.readdir(modulespath, (err, files) => {
    files.forEach(file => {
        if (file.includes(".json")) {
            components.push(require(modulespath + file));
            console.log("Loaded Module: " + file);
        }
    });
    installExternalLibs(installonly);
})





// helper functions


function checkSWRules(sw) {
    var result = "VALID";
    var dependency = new Object;
    var modulenames = new Array;

    for (var i = 0; i < sw.length; i++) {
        modulenames.push(sw[i].name);
        if (typeof sw[i].implements != 'undefined') {
            dependency[sw[i].implements] = sw[i].name;
        }

    }
    for (var i = 0; i < sw.length; i++) {
        if (sw[i].dependency != "null") {
            if (modulenames.includes(dependency[sw[i].dependency])) {
                console.log("Dependency vorhanden");
            } else result = sw[i].dependency + " not selected";
        }
    }
    return result;
}


function checkHWRules(hw) {
    var result = "VALID";
    var usedPins = new Array;

    for (var i = 0; i < hw.length; i++) {
        //		if (hw[i].pins!="i2c" && hw[i].pins!="SPI"){
        if (rules.pins.includes(hw[i].pins)) { //!="i2c" && hw[i].pins!="SPI"){

            if (usedPins.includes(hw[i].pins)) {
                result = hw[i].pins + " error";
            } else {
                usedPins.push(hw[i].pins);
            }
        } else
            usedPins.push(hw[i].pins);
    }

    if (usedPins.includes("i2c") && (usedPins.includes("D1") || usedPins.includes("D2"))) {
        result = "i2c error";

    }
    if (usedPins.includes("SPI") &&
        (usedPins.includes("D5") || usedPins.includes("D6") || usedPins.includes("D7") || usedPins.includes("D8"))

    ) {
        result = "spi error";

    }
    console.log(result);
    return result;

}


function getListOfValues(listofmodules) {

    var values = new Array;


    for (var i = 0; i < listofmodules.length; i++) {
        if (listofmodules[i].values != "null") {
            for (var j = 0; j < listofmodules[i].values.length; j++)
                values.push(listofmodules[i].values[j])
        }
    }

    return values;

}

function generateConfigurationOptions(listofmodules) {
    var configurationOptions = new Array;
    var values = getListOfValues(listofmodules);

    for (var i = 0; i < listofmodules.length; i++) {
        if (listofmodules[i].parameter != "null") {
            var confNode = new Object;

            confNode.name = listofmodules[i].name;
            console.log(confNode.name);
            if (typeof listofmodules[i].parameter.parameter == "object") {

                confNode.staticParameter = listofmodules[i].parameter.parameter;

            }
            if (typeof listofmodules[i].parameter.dynamicParameter == "object") {
                var dynParameter = new Array;
                for (var params = 0; params < listofmodules[i].parameter.dynamicParameter.parameterList.length; params++) {
                    //check if if ('key' in myObj)
                    // type: text, generated, value
                    // 


                    if (listofmodules[i].parameter.dynamicParameter.parameterList[params].type == "value") {
                        confNode.dynParamsValues = values;
                    } else if (listofmodules[i].parameter.dynamicParameter.parameterList[params].type == "text") {
                        if (listofmodules[i].parameter.dynamicParameter.multipleValues == 0) {
                            dynParameter.push({
                                "name": listofmodules[i].parameter.dynamicParameter.parameterList[params].name,
                                "description": listofmodules[i].parameter.dynamicParameter.parameterList[params].description.en,
                                "type": "input"
                            })
                        } else {
                            // for (var dynparams = 0; dynparams < values.length; dynparams++) { 
                            console.log(listofmodules[i].parameter.dynamicParameter.parameterList[params].name);
                            dynParameter.push({
                                "name": listofmodules[i].parameter.dynamicParameter.parameterList[params].name,
                                "description": listofmodules[i].parameter.dynamicParameter.parameterList[params].description.en,
                                "type": "input"
                            });
                            //}
                        }


                    } else if (listofmodules[i].parameter.dynamicParameter.parameterList[params].type == "generated") {
                        for (var dynparams = 0; dynparams < values.length; dynparams++) { // for each possible value one field -> static Name with Prefix
                            console.log(listofmodules[i].parameter.dynamicParameter.parameterList[params].prefix + "" + String(dynparams + 1));
                            dynParameter.push({
                                "name": listofmodules[i].parameter.dynamicParameter.parameterList[params].prefix + "" + String(dynparams + 1),
                                "type": "label"
                            });
                            //save
                        }


                    } else if (listofmodules[i].parameter.dynamicParameter.parameterList[params].type == "label") {
                        console.log(listofmodules[i].parameter.dynamicParameter.parameterList[params].prefix + "" + String(dynparams + 1));
                        dynParameter.push({
                            "name": listofmodules[i].parameter.dynamicParameter.parameterList[params].name,
                            "type": "label"
                        });
                        //save

                    }

                    confNode.dynamicParameter = dynParameter;
                    confNode.dynParamMultipleValues = listofmodules[i].parameter.dynamicParameter.multipleValues;
                    console.log("MultipleVal: " + confNode.dynParamMultipleValues)


                }
            }

            configurationOptions.push(confNode);

        }
    }

    return configurationOptions;
}


function sortModules(modules) {
    var selectedModules = modules;
    var sortedModules = {
        software: new Array,
        sensor: new Array,
        service: new Array,
        processing: new Array,
        misc: new Array
    }
    for (var item of selectedModules) {
        //   for (var i = 0; i < selectedModules.length; i++) {
        if (item.type == "software") {
            sortedModules.software.push(item);
        } else if (item.type == "sensor") {
            sortedModules.sensor.push(item);
        } else if (item.type == "service") {
            sortedModules.service.push(item);
        } else if (item.type == "processing") {
            sortedModules.processing.push(item);
        } else if (item.type == "misc") {
            sortedModules.misc.push(item);
        }
    }

    return sortedModules;
}

function generateSourcCode() {
    var sortedModules = sortModules(hwsel.concat(swsel));

    var sourceString = "";

    // generate includes part by iterating through modules 
    Object.keys(sortedModules).forEach(function(key) {

        var val = sortedModules[key];
        for (var item of val) {
            if (item.sourceskel.includes != "null") {
                sourceString += item.sourceskel.includes;
            }

        }
    });
    sourceString += "\n";

    // generate declaraions part by iterating through modules 
    Object.keys(sortedModules).forEach(function(key) {

        var val = sortedModules[key];
        for (var item of val) {

            if (item.sourceskel.declarations != "null") {
                //console.log(val[i].name + "VAL NAME");
                var declarations = item.sourceskel.declarations;
                //console.log(userconf.length + " USERCONF") ;
                for (var confitem of userconf) {
                    if (confitem.moduleName == item.name) {
                        if (typeof confitem.staticParameter !== 'undefined') {

                            Object.keys(confitem.staticParameter).forEach(function(key) {

                                var kval = confitem.staticParameter[key];
                                declarations = declarations.replace("$" + key, kval);
                            });
                        }
                    }
                }

                //  console.log(declarations);



                sourceString += declarations;

            }
        }
    });
    sourceString += "\n";

    // generate functions part by iterating through modules 
    Object.keys(sortedModules).forEach(function(key) {

        var val = sortedModules[key];
        for (var item of val) {

            if (item.sourceskel.functions != "null") {
                //console.log(val[i].name + "VAL NAME");
                var functions = item.sourceskel.functions;
                //console.log(userconf.length + " USERCONF") ;


                //  console.log(declarations);



                sourceString += functions;

            }
        }
    });
    sourceString += "\n";

    // generate setup part by iterating through modules 

    sourceString += "void setup(){\n";
    Object.keys(sortedModules).forEach(function(key) {

        var val = sortedModules[key];
        for (var item of val) {

            if (item.sourceskel.setup != "null") {

                //console.log(val[i].name + "VAL NAME");
                var setup = item.sourceskel.setup;
                //console.log(userconf.length + " USERCONF") ;


                //  console.log(declarations);



                sourceString += setup;

            }
        }
    });
    sourceString += "\n}\n";

    // generate loop part by iterating through modules 
    sourceString += "void loop(){\n";
    Object.keys(sortedModules).forEach(function(key) {

        var val = sortedModules[key];
        for (var item of val) {

            if (item.sourceskel.loop != "null") {
                var loop = item.sourceskel.loop;
                for (var confitem of userconf) {
                    if (confitem.moduleName == item.name) {

                        var generated = "";
                        if (typeof item.parameter.dynamicParameter !== 'undefined') {
                            Object.keys(confitem.dynamicParameter).forEach(function(key) {
                                var kval = confitem.dynamicParameter[key];
                                if ((kval != "null") && (kval != "")) {
                                    // TODO DYNAMIC!! AND FLEXIBLE
                                    console.log(key + " : : : : " + kval);

                                    generated += item.parameter.dynamicParameter.template.replace(item.parameter.dynamicParameter.parameterList[0].placeholder, key).replace(item.parameter.dynamicParameter.parameterList[1].placeholder, kval);
                                }

                            });
                            loop = loop.replace("$" + item.parameter.dynamicParameter.placeholder, generated);
                            console.log(item.parameter.dynamicParameter.placeholder + " NAME");

                        }



                    }
                }


                sourceString += loop;

            }
        }
    });
    sourceString += "\n}\n";

    return sourceString;

}


function installExternalLibs(doit) {
    var base = "arduino --install-library \"NAME\" && ";
    var ges = "";

    for (var item of components) {
        if (typeof item.librarys !== "undefined") {
            for (var lib of item.librarys) {
                externallibs.push(lib);
                ges += base.replace("NAME", lib)
            }
        }
    }


    if (doit){
        ges+="echo 'done'";
        exec(ges, (err, stdout, stderr) => {
        console.log('stdout is:' + stdout);
        console.log('stderr is:' + stderr);
        console.log('error is:' + err);
        error = stderr;
    }).on('close', (code) => {
       console.log('final exit code is', code);

    }).on('exit', (code) => {
        process.exit(0);
    });
   

    }
    // ToDo: make configurable and only install when chosen.
    /*  if (installdependencys){
   
   
} */

    console.log(externallibs);
}



var app = express();

// Static HTML/CSS/JS Files
app.use(express.static(path.join(process.cwd(),'../Frontend')));

// Plugin for parsing POST Data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));



// start expressjs app
app.listen(3000, function() {
    console.log('IoTiZe listening on port 3000!');
});


// open Frontend in Browser - not working when packaged, patch available but not in stable
opn('http://127.0.0.1:3000');





// API Functions


// Serve UI when GET / 
app.get('/', function(req, res) {
    res.sendFile(path.join(process.cwd(),'../Frontend/ui.html'));
});




// API Step 0: send hw components to Frontend
app.get('/stage0/getHWComponents', function(req, res) {
    // send Hardware Modules
    console.log(req.query); // debug
    var list = new Array;
    for (var item of components) {
        if (item.hardware == true) {
            console.log(JSON.stringify(item.name));
            list.push({
                "name": item.name,
                "description": item.description,
                "bus": item.pins
            });
        }
    }
    res.send(list);
});


// API Step 1.1: receive hw components from Frontend and check validity
app.post('/stage1/submitHWComponents', function(req, res) {

    hwsel = new Array;
    if (req.body.modules[0] != "NULL") {
        console.log(req.body.modules.toString());
        for (var hw = 0; hw < req.body.modules.length; hw++) {

            for (var item = 0; item < components.length; item++) {
                if (components[item].name == req.body.modules[hw]) {
                    hwsel.push(components[item]);
                    console.log("Added Element: " + req.body.modules[hw]);
                }
            }
        }


        // CHECK VALIDITY!!! Check HW and PORTS!!

        res.send(checkHWRules(hwsel));
    } else res.send("VALID");

});


// API Step 1.2: send sw components to Frontend
app.get('/stage1/getSWComponents', function(req, res) {

    console.log(req.query);

    var list = new Array;

    for (var item of components) {
        //	console.log(JSON.stringify(components[item].name));

        if (item.hardware == false) {
            console.log(JSON.stringify(item.name));
            list.push({
                "name": item.name,
                "description": item.description
            });
        }
    }
    res.send(list);
});


// API Step 2.1: receive sw components from Frontend and check validity
app.post('/stage2/submitSWComponents', function(req, res) {
    swsel = new Array;
    if (req.body.modules[0] != "NULL") {
        console.log(req.body.modules.toString());
        for (var sw = 0; sw < req.body.modules.length; sw++) {
            console.log("ITEM: " + req.body.modules[sw]);

            for (var item = 0; item < components.length; item++) {
                if (components[item].name == req.body.modules[sw]) {
                    swsel.push(components[item]);
                    console.log("Added Element: " + req.body.modules[sw]);
                }
            }
        }
        res.send(checkSWRules(swsel));
    } else res.send("VALID");

});

// API Step 2.2: send configuration components to Frontend
app.get('/stage2/getConfigurationOptions', function(req, res) {

    console.log(req.query);
    console.log(JSON.stringify(generateConfigurationOptions(swsel.concat(hwsel))));

    res.send(generateConfigurationOptions(swsel.concat(hwsel)));
});

// API Step 3.1: receive configuration Frontend
app.post('/stage3/submitConfig', function(req, res) {

    userconf = req.body.conf;

    console.log(JSON.stringify(userconf));

    // ToDo: Verify/Check Validity
    res.send('VALID');
});


// API Step 3.2: generate arduino code and send it to Frontend
app.get('/stage3/getSourceCode', function(req, res) {

    var sourceString = generateSourcCode();
    console.log(sourceString);

    var response = {
            sourceString: sourceString,
            usbports: new Array
        }
        // create List of USB Ports
    SerialPort.list(function(err, ports) {
        ports.forEach(function(port) {
            if (typeof port.pnpId !== 'undefined') {
                response.usbports.push(port);
                console.log(port.comName);
                //	console.log(port.pnpId);
                //	console.log(response.usbports.length);
                console.log(port.manufacturer);
            }
        });
        res.send(response);

    });



});


// API Step 4.1: create List of USB Ports and send it to Frontend (REFRESH BUTTON)
app.get('/stage4/getUSBDevices', function(req, res) {

    var response = {
        usbports: new Array
    };

    SerialPort.list(function(err, ports) {
        ports.forEach(function(port) {
            if (typeof port.pnpId !== 'undefined') {
                response.usbports.push(port);
                console.log(port.comName);
                //	console.log(port.pnpId);
                //	console.log(response.usbports.length);
                console.log(port.manufacturer);
            }
        });
        res.send(response);

    });

});

// API Step 4.2: receive final sourcecode from Frontend and build and flash it
app.post('/stage4/compile', function(req, res) {

    var data = req.body.data;
    var error = "";
    // CHECK VALIDITY!!! (Dependency and Values))
    console.log(JSON.stringify(req.body.data));

    //    console.log(hwsel.concat(swsel));

    fs.writeFile('tmp_build_dir/sketch.ino', data.code, function(err) {
        if (err) res.send("error saving file");
    });
    console.log("Build Command: " + buildcmd.replace("$PORT", data.usbport));
    var exitcode = -1;
    exec(buildcmd.replace("$PORT", data.usbport), (err, stdout, stderr) => {
        console.log('stdout is:' + stdout)
        console.log('stderr is:' + stderr)
        console.log('error is:' + err)
        error = stderr;
    }).on('close', (code) => {
        //
        console.log('final exit code is', code);
        exitcode = code;

        res.send({
            'EXITCODE': code,
            'ERRORCODE': error
        });
    });

    // res.send('VALID');
});



// import json and build
app.post('/importjson', function(req, res) {
    var decoded = new Buffer(req.body.iotconf.fileData.split(",")[1], 'base64').toString('ascii');
    //console.log(decoded);
    var data = JSON.parse(decoded);
    console.log(data);

    // reinitialize arrays
    hwsel = new Array;
    swsel = new Array;

    for (var hw = 0; hw < data.hardwareModules.length; hw++) {
        for (var item = 0; item < components.length; item++) {
            if (components[item].name == data.hardwareModules[hw]) {
                hwsel.push(components[item]);
            }
        }
    }

    for (var sw = 0; sw < data.softwareModules.length; sw++) {
        for (var item = 0; item < components.length; item++) {
            if (components[item].name == data.softwareModules[sw]) {
                swsel.push(components[item]);
            }
        }
    }


    userconf = data.configuration;
    var response = {
        sourceString: generateSourcCode(),
        usbports: new Array
    }
    console.log(response.sourceString);
    // create List of USB Ports
    SerialPort.list(function(err, ports) {
        ports.forEach(function(port) {
            if (typeof port.pnpId !== 'undefined') {
                response.usbports.push(port);
                console.log(port.comName);
                //	console.log(port.pnpId);
                //	console.log(response.usbports.length);
                console.log(port.manufacturer);
            }
        });
        res.send(response);

    });

});


// export json config
app.get('/exportjson', function(req, res) {
    var data = {
        configuration: userconf,
        hardwareModules: new Array,
        softwareModules: new Array
    };
    for (var hw = 0; hw < hwsel.length; hw++)
        data.hardwareModules.push(hwsel[hw].name)
    for (var sw = 0; sw < swsel.length; sw++)
        data.softwareModules.push(swsel[sw].name)
    console.log(JSON.stringify(data));
    res.send(data);
});