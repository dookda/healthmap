angular.module('app.controller', ['ui-leaflet', 'ng-echarts'])
    .controller("mapController", function($scope, $rootScope, leafletMapEvents,
        $http, $filter, $timeout, $interval, dengueService, placeService, leafletData) {

        $scope.center = dengueService.selectedLocation;


        if ($scope.center.lat == null) {
            //console.log('yess null');
            var center = {
                lat: 17.00,
                lng: 100.00,
                zoom: 8
            }
        } else {
            var center = {
                lat: Number($scope.center.lat),
                lng: Number($scope.center.lng),
                zoom: 15
            };
            //console.log($scope.center.lat + '-' + $scope.center.lng);
        }

        $scope.title = 'map';
        angular.extend($scope, {
            center: center,
            layers: {
                baselayers: {
                    /*osm: {
                        name: 'OpenStreetMap',
                        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        type: 'xyz'
                    },*/
                    bingRoad: {
                        name: 'Bing Road',
                        type: 'bing',
                        key: 'Aj6XtE1Q1rIvehmjn2Rh1LR2qvMGZ-8vPS9Hn3jCeUiToM77JFnf-kFRzyMELDol',
                        layerOptions: {
                            type: 'Road'
                        }
                    },
                    bingAerial: {
                        name: 'Bing Aerial',
                        type: 'bing',
                        key: 'Aj6XtE1Q1rIvehmjn2Rh1LR2qvMGZ-8vPS9Hn3jCeUiToM77JFnf-kFRzyMELDol',
                        layerOptions: {
                            type: 'Aerial'
                        }
                    },

                    bingAerialWithLabels: {
                        name: 'Bing Aerial With Labels',
                        type: 'bing',
                        key: 'Aj6XtE1Q1rIvehmjn2Rh1LR2qvMGZ-8vPS9Hn3jCeUiToM77JFnf-kFRzyMELDol',
                        layerOptions: {
                            type: 'AerialWithLabels'
                        }
                    }
                },
                overlays: {
                    pro: {
                        name: 'province',
                        type: 'wms',
                        visible: true,
                        url: 'http://localhost:8080/geoserver/hms/wms?',
                        layerParams: {
                            layers: 'hms:pro_dhf',
                            format: 'image/png',
                            transparent: true
                        },
                        zIndex: 4
                    },
                    amp: {
                        name: 'amphoe',
                        type: 'wms',
                        visible: true,
                        url: 'http://localhost:8080/geoserver/hms/wms?',
                        layerParams: {
                            layers: 'hms:amp_dhf',
                            format: 'image/png',
                            transparent: true
                        },
                        zIndex: 3
                    },
                    tambon: {
                        name: 'tambon',
                        type: 'wms',
                        visible: true,
                        url: 'http://localhost:8080/geoserver/hms/wms?',
                        layerParams: {
                            layers: 'hms:tam_dhf',
                            format: 'image/png',
                            transparent: true,
                            "showOnSelector": true,
                        },
                        zIndex: 2
                    },
                    v_dengue_buffer: {
                        name: 'v_dengue_buffer',
                        type: 'wms',
                        url: 'http://localhost:8080/geoserver/hms/wms?',
                        layerParams: {
                            layers: 'hms:v_dengue_buffer',
                            format: 'image/png',
                            transparent: true,
                            "showOnSelector": true,
                        },
                        visible: false,
                        zIndex: 1
                    },
                    village: {
                        name: 'village',
                        type: 'wms',
                        url: 'http://localhost:8080/geoserver/hms/wms?',
                        layerParams: {
                            layers: 'hms:vill_dhf',
                            format: 'image/png',
                            transparent: true,
                            "showOnSelector": true,
                        },
                        visible: false,
                        zIndex: 1
                    }
                } //end overlays 
            },
            defaults: {
                scrollWheelZoom: true,
                popup: {
                    maxWidth: 800
                }
            },
            //events: {},
            markers: {}
        });

        // Get the countries geojson data
        $scope.getJson = function() {
            dengueService.getJson()
                .then(function(data) {
                    //addGeoJsonLayerWithClustering(data.data);
                    var markers = L.markerClusterGroup();
                    var geoJsonLayer = L.geoJson(data.data, {
                        onEachFeature: function(feature, layer) {
                            layer.bindPopup(feature.properties.pat_desc);
                        }
                    });
                    markers.addLayer(geoJsonLayer);
                    leafletData.getMap().then(function(map) {
                        map.addLayer(markers);
                        //map.fitBounds(markers.getBounds());
                    });

                })
        };
        $scope.getJson();

        /* // refesh layer
        var refreshIntervalInSeconds = 30;
        var actualSeconds = 0;
        $interval(function() {
            if (actualSeconds === refreshIntervalInSeconds) {
                $scope.layers.overlays.v_dengue_point.doRefresh = true;
                console.log("Overlay refreshed.")
                actualSeconds = 0;
            } else {
                console.log("Next update of overlay in " + (refreshIntervalInSeconds - actualSeconds) + " seconds.");
                actualSeconds += 1;
            }
        }, 500);
        */

        // fix baselayers change
        $scope.$on('leafletDirectiveMap.baselayerchange', function(ev, layer) {
            console.log('base layer changed to %s', layer.leafletEvent.name);
            angular.forEach($scope.layers.overlays, function(overlay) {
                if (overlay.visible) overlay.doRefresh = true;
            });
        });

        // add markers
        $scope.addPoint = false;
        var id = 1;

        $scope.markers = new Array();
        $scope.$on("leafletDirectiveMap.click", function(events, args) {
            var leafEvent = args.leafletEvent;

            if ($scope.addPoint == true) {
                $scope.markers.push({
                    getMessageScope: function() {
                        return $scope;
                    },
                    id: id,
                    lat: leafEvent.latlng.lat,
                    lng: leafEvent.latlng.lng,
                    message: '<form><div class="form-group">' +
                        '<label>รายละเอียด: </label><input type="text" class="form-control" ng-model= "dat.desc" ng-required="true" />' +

                        '<label>จังหวัด: </label><select class="form-control" ng-model="dat.prov" ng-options="p.prov_code as p.prov_name for p in province" ng-change="getAmp()" ng-required="true">' +
                        '<option value=""> </option></select>' +

                        '<label>อำเภอ:   </label><select class="form-control" ng-model="dat.amp" ng-options="a.amp_code as a.amp_name for a in amphoe" ng-change="getTam()" ng-required="true">' +
                        '<option value=""> </option></select>' +

                        '<label>ตำบล:   </label><select class="form-control" ng-model="dat.tam" ng-options="t.tam_code as t.tam_name for t in tambon" ng-change="getVill()" ng-required="true">' +
                        '<option value=""> </option></select>' +

                        '<label>หมู่บ้าน:    </label><select class="form-control" ng-model="dat.vill" ng-options="v.vill_code as v.vill_name for v in village" ng-required="true">' +
                        '<option value=""> </option></select>' +

                        '<div class="form-group"><label><strong>วันรายงาน:</strong> </label><input type="date" class="form-control" ng-model= dat.date_sick ng-required="true" /></div>' +
                        '</div>' +
                        '<button class="btn btn-success"type="submit" ng-click="insertMarker(); removeMarker(' + id + ')"><i class="icon-plus-sign icon-white"></i> เพิ่ม</button><span>  </span>' +
                        '<button class="btn btn-danger" type="submit" ng-click="removeMarker(' + id + ')"><i class="icon-minus-sign icon-white"></i> ยกเลิก</button></form>',
                    focus: true,
                    draggable: true
                });
                console.log(id);
                id++;
                $scope.dat = { lat: leafEvent.latlng.lat, lng: leafEvent.latlng.lng };
            }
        });

        // select address
        $scope.dat = {
            prov: '',
            amp: '',
            tam: '',
            vill: ''
        };

        // get everything
        $scope.getProv = function() {
            placeService.getProv()
                .then(function(response) {
                    $scope.province = response.data;
                })
        };
        $scope.getProv();

        $scope.getAmp = function() {
            placeService.getAmp($scope.dat.prov)
                .then(function(response) {
                    $scope.amphoe = response.data;
                    $scope.tambon = [];
                    $scope.village = [];
                })
        };

        $scope.getTam = function() {
            placeService.getTam($scope.dat.amp)
                .then(function(response) {
                    $scope.tambon = response.data;
                    $scope.village = [];
                })
        };

        $scope.getVill = function() {
            placeService.getVill($scope.dat.tam)
                .then(function(response) {
                    $scope.village = response.data;
                })
        };

        // marker of everything 
        $scope.addMarkers = function() {
            $scope.addPoint = true;
        };

        $scope.removeMarker = function(item) {
            var latSearch = item;
            var foundItem = $filter('filter')($scope.markers, { id: latSearch }, true)[0];
            var index = $scope.markers.indexOf(foundItem);
            $scope.markers.splice(index, 1);
        };

        $scope.removeMarkers = function() {
            $scope.markers = new Array();
            $scope.addPoint = false;
        };

        // insert data 
        $scope.insertMarker = function() {

            var link = 'http://localhost/hms/case_insert.php';
            //$http.post(link, {username : $scope.data.farmer_fname})
            $http.post(link, $scope.dat)
                .then(function(res) {
                    $scope.response = res.data;
                    console.log(res.data);

                    // refesh layer
                    $timeout(function() {
                        //$scope.layers.overlays.v_dengue_point.doRefresh = true;
                        $scope.getJson();
                        console.log('refreshed');
                    }, 400);
                });
        };

        //refesh
        $scope.reload = function() {
            location.reload();
        };
    })

.controller("chartController", function($scope, placeService, chartService, $timeout) {
    $scope.title = 'chart';

    // select address
    $scope.dat = {
        prov: '',
        amp: '',
        tam: '',
        vill: ''
    };

    // get everything
    $scope.getProv = function() {
        placeService.getProv()
            .then(function(response) {
                $scope.province = response.data;
            })
    };
    $scope.getProv();

    $scope.getAmp = function() {
        placeService.getAmp($scope.dat.prov)
            .then(function(response) {
                $scope.amphoe = response.data;
                $scope.tambon = [];
                $scope.village = [];
            })
        
    };

    $scope.getTam = function() {
        placeService.getTam($scope.dat.amp)
            .then(function(response) {
                $scope.tambon = response.data;
                $scope.village = [];
            })
        
    };

    $scope.getVill = function() {
        placeService.getVill($scope.dat.tam)
            .then(function(response) {
                $scope.village = response.data;
            })
        
    };


    $scope.getChartProv = function(){
      $timeout(function() {$scope.loadCaseProv('province', $scope.dat.prov);}, 400);
    };
    $scope.getChartAmp = function(){
      $timeout(function() {$scope.loadCaseProv('amphoe', $scope.dat.amp);}, 400);
    };
    $scope.getChartTam = function(){
      $timeout(function() {$scope.loadCaseProv('tambon', $scope.dat.tam);}, 400);
    };
    $scope.getChartVill = function(){
      $timeout(function() {$scope.loadCaseProv('village', $scope.dat.vill);}, 400);
    };





    $scope.getVill2 = function() {
/*        placeService.getVill($scope.dat.vill)
            .then(function(response) {
                $scope.village = response.data;
            })*/
        
    };


    $scope.reload = function() {
        location.reload();
    };


    //var caseProv = [];

    $scope.loadCaseProv = function(place, code) {
        var caseProv = [];
        chartService.getCase(place, code)
            .then(function(data) {
                for (var prop in data.data[0]) {
                    for (var i = 49; i <= 59; i++) {
                        var c = 'case' + i;
                        if (prop == c) {
                            if (Number(data.data[0][prop]) > 0) {
                                caseProv.push((Number(data.data[0][prop])).toFixed(2));
                                //console.log('ok');
                            } else {
                                caseProv.push(0);
                                //console.log('null')
                            }
                        }
                    }
                }
                
                var scopeName = {
                    title: {
                        text: 'ทดสอบ',
                        subtext: 'test'
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    legend: {
                        data: ['aaa']
                    },
                    toolbox: {
                        show: false,
                        feature: {
                            mark: { show: false },
                            dataView: { show: false, readOnly: false },
                            magicType: { show: true, type: ['line', 'bar'] },
                            restore: { show: true },
                            saveAsImage: { show: true }
                        }
                    },
                    calculable: true,
                    xAxis: [{
                        type: 'category',
                        boundaryGap: false,
                        data: ['2549', '2550', '2551', '2552', '2553', '2554', '2555', '2556', '2557', '2558', '2559']
                    }],
                    yAxis: [{
                        type: 'value',
                        axisLabel: {
                            formatter: '{value} คน'
                        }
                    }],
                    series: [{
                        name: 'aaa',
                        type: 'line',
                        smooth: true,
                        data: caseProv,
                        markPoint: {
                            data: [
                                { type: 'max', name: 'max' },
                                { type: 'min', name: 'min' }
                            ]
                        },
                        markLine: {
                            data: [
                                { type: 'average', name: 'mean' }
                            ]
                        }
                    }]
                };

                if(place=='province'){
                    $scope.lineOptionP = scopeName;
                }else if(place=='amphoe'){
                    $scope.lineOptionA = scopeName;
                }else if(place=='tambon'){
                    $scope.lineOptionT = scopeName;
                }else if(place=='village'){
                    $scope.lineOptionV = scopeName;
                }
                
            })
    };

    //$scope.loadCaseProv('53');

    $scope.lineOptionP = {};
    $scope.lineOptionA = {};
    $scope.lineOptionT = {};
    $scope.lineOptionV = {};

    // chart
    $scope.lineConfig = {
        theme: 'default', //['default','vintage'];
        dataLoaded: true
    };

    //$scope.lineOption = echartService.lineOption;

   
    //end chart

})

.controller("formController", function($scope) {
    $scope.title = 'form';
})

.controller('reportController', function($scope, $http, dengueService) {
    $scope.title = 'report';
    $scope.loadDenguePoint = function() {
        dengueService.loadDenguePoint()
            //$http.get('http://localhost/hms-api/index.php/denguepoint')
            .then(function(response) {
                $scope.dengues = response.data;
                $scope.countRec = response.data.length;
                //console.log(response.data.length);
            })
    };
    $scope.loadDenguePoint();

    $scope.delete = function(item) {
        //console.log(item);
        $scope.dengues.splice($scope.dengues.indexOf(item), 1);

        var link = 'http://localhost/hms/case_remove.php';
        $http.post(link, item)
            .then(function(res) {
                $scope.response = res.data;
                //delete $scope.data;
            });
    };

    $scope.reload = function() {
        location.reload();
    };
    //$scope.dat = { lat: '', lng: ''};
    $scope.goMap = function(lat, lng) {
        $scope.dat = { lat: lat, lng: lng };
        dengueService.selectedLocation = $scope.dat; //console.log(lat+'-'+lng);
    };
});
