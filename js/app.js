"strict";
var angular,
    moment,
    IDBStore,
    $;

angular.module("trainApp", ["ui.bootstrap"])
    .controller("MainController", function ($scope) {
        var $s = $scope,
            sto,
            stt,
            tables;
        var urls = [
            "http://api.511.org/transit/stops?api_key=a9a92f72-6f26-4d58-a1ab-db8ab5833ed2&operator_id=Capitol Corridor&format=Json",
            "http://api.511.org/transit/timetable?api_key=a9a92f72-6f26-4d58-a1ab-db8ab5833ed2&operator_id=Capitol Corridor&line_id=CAPITOL"
        ];

        new Promise((resolve) => {
            // Load IDBstore first
            tables = new IDBStore({
                dbVersion: 1,
                storeName: "trainTimes",
                keyPath: "id",
                onStoreReady: function () {
                    var onsuccess = function (data) {
                        // If stored data exists
                        if (data) {
                            // Stations
                            sto = data.sto;
                            // Specific timetable
                            stt = data.stt;
                            resolve();
                        }
                    };
                    var onerror = function (error) {
                        $(".help-tool-5").show();
                        console.log(error);
                        resolve();
                    };
                    tables.get(1, onsuccess, onerror);

                }
            });
        }).then(function () {
            // catch JSON after
            Promise.all(urls.map(url => fetch(url)))
                .then(response => Promise.all(response.map(res => res.json())))
                .then(result => {
                    var s = [],
                        st = result[0].Contents.dataObjects.ScheduledStopPoint;

                    for (var i = 0; i < st.length; i++) {
                        var sa = st[i];
                        s.push(sa.Name + " - " + sa.id);
                    }
                    // Rearrange order
                    sto = [s[11], s[1], s[7], s[2], s[3], s[0], s[6], s[5], s[4], s[9], s[10], s[8]];

                    stt = result[1].Content.TimetableFrame;

                    var times = {
                        id: 1,
                        sto: sto,
                        stt: stt
                    };

                    var onsuccess = function (id) {
                        console.log("updated: " + id);
                    };
                    var onerror = function (error) {
                        console.log(error);
                    };

                    tables.put(times, onsuccess, onerror);

                }).catch(function (error) {
                    // Load an error message
                    $(".help-tool-5").show();
                    console.log(error);
                });
        }).then(function () {
            // Typeahead (searching station)
            $s.stations = sto;
        });

        // RadioModel (arriving 1 & departing 0)
        $s.radioModel = 0;

        // Datepicker
        $s.today = function () {
            $s.dt = new Date();
        };
        $s.today();

        $s.clear = function () {
            $s.dt = null;
        };

        $s.inlineOptions = {
            customClass: getDayClass,
            minDate: new Date(),
            showWeeks: false
        };

        $s.dateOptions = {
            formatYear: "yy",
            minDate: new Date(),
            startingDay: 1,
            showWeeks: false
        };

        $s.open1 = function () {
            $s.popup1.opened = true;
        };

        $s.open2 = function () {
            $s.popup2.opened = true;
        };

        $s.setDate = function (year, month, day) {
            $s.dt = new Date(year, month, day);
        };

        $s.format = "dd MMMM yyyy";
        $s.altInputFormats = ["M!/d!/yyyy"];

        $s.popup1 = {
            opened: false
        };

        $s.popup2 = {
            opened: false
        };

        function getDayClass(data) {
            var date = data.date,
                mode = data.mode;
            if (mode === "day") {
                var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

                for (var i = 0; i < $s.events.length; i++) {
                    var currentDay = new Date($s.events[i].date).setHours(0, 0, 0, 0);

                    if (dayToCheck === currentDay) {
                        return $s.events[i].status;
                    }
                }
            }
            return "";
        }

        // Time picker
        $s.myValue = false;
        $s.mytime = new Date();

        $s.hstep = 1;
        $s.mstep = 5;
        $s.ismeridian = false;

        // Station positions & time
        var setTimeT1,
            setTimeT2,
            s1,
            s2,
            _m,
            _n,
            rStops = [];

        $s.trainTimes = {
            "Departure": "-",
            "From": "-",
            "To": "-",
            "Arrival": "-",
            "Duration": "-",
            "Stops": {
                "numStops": "-",
                "listStops": "-"
            }
        };

        $s.check = () => {
            // Check the stations
            s1 = $("#station_1").val();
            s2 = $("#station_2").val();

            // Feedbacl, input must not be empty
            if (!s1) {
                $(".help-tool-1").show();
                return false;
            }
            if (!s2) {
                $(".help-tool-2").show();
                $(".help-tool-3").hide();
                return false;
            }

            if (s1 === s2) {
                $(".help-tool-3").show();
                return false;
            }


            if (typeof s1 !== "undefined" && typeof s2 !== "undefined") {
                for (var l = 1; l < 4; l++) {
                    var ht = ".help-tool-" + l;
                    $(ht).hide();
                }
            }

            for (var i = 0; i < sto.length; i++) {
                if (s1 === sto[i]) {
                    _m = i;
                    break;
                }
            }

            for (var j = 0; j < sto.length; j++) {
                if (s2 === sto[j]) {
                    _n = j;
                    break;
                }
            }

            function getStops(a1, a2, a3) {
                rStops = [];
                for (var k = a1; k < a2; k++) {
                    rStops.push(sto[k].slice(0, -9));
                }
                if (!a3) {
                    rStops.reverse();
                }
            }

            if (_m < _n) {
                getStops(_m + 1, _n + 1), 1;
                setTimeTable(1);
            }

            if (_m > _n) {
                getStops(_n, _m, 0);
                setTimeTable(0);
            }
        };

        function setTimeTable(arg) {
            // Date & time 
            var inputDate = getDate(),
                iT = moment($s.mytime).format("HH:mm:ss"),
                iD = $s.radioModel; // 0 depart or 1 arrival

            if (!inputDate) {
                $(".help-tool-4").show();
                return false;
            } else {
                $(".help-tool-4").hide();
            }

            // false for inbound, true for outbound
            if (!arg) {
                // Returns the day of the week number
                switch (inputDate) {
                case 0:
                    getSj(3, iD, iT);
                    break;
                case 6:
                    getSj(1, iD, iT);
                    break;
                default:
                    getSj(0, iD, iT);
                }
            }
            if (arg) {
                switch (inputDate) {
                case 0:
                    getSj(7, iD, iT);
                    break;
                case 6:
                    getSj(5, iD, iT);
                    break;
                default:
                    getSj(4, iD, iT);
                }

            }
        }

        function getSj(a, b, c) {
            var t1 = s1.substring(s1.length - 7), // Ref point
                t2 = s2.substring(s2.length - 7),
                ca = stt[a].vehicleJourneys.ServiceJourney;


            var count = [0, 0];

            var goTrains = false;

            loop: for (var i = 0; i < ca.length; i++) {
                var da = ca[i].calls.Call;

                // Reset count 
                count = [0, 0];

                for (var j = 0; j < da.length; j++) {
                    var cj = da[j],
                        pRef = cj.ScheduledStopPointRef.ref,
                        dt = cj.Departure.Time;

                    var tDiff = moment.utc(moment(dt, "HH:mm:ss").diff(moment(c, "HH:mm:ss"))).format("HH:mm:ss").substring(0, 2);
                    // Depart
                    if (!b) {
                        if (pRef === t1) {

                            if (1.5 > tDiff) {
                                // Get the closest time
                                count[0] = 1;
                                setTimeT1 = dt;
                            }
                        }

                        if (pRef === t2) {
                            setTimeT2 = dt;
                            count[1] = 1;
                        }
                    }
                    // Arrival
                    if (b) {
                        if (pRef === t2) {
                            if (1.5 > tDiff) {
                                count[1] = 1;
                                setTimeT2 = dt;
                            }
                            if (pRef === t1) {
                                setTimeT1 = dt;
                                count[1] = 1;
                            }
                        }
                    }

                    // On successful result, print out scope
                    if (count[0] && count[1]) {
                        $(".noTrains").hide();

                        $s.myValue = true;
                        var tt = moment.utc(moment(setTimeT2, "HH:mm:ss").diff(moment(setTimeT1, "HH:mm:ss"))).format("HH:mm:ss").substring(0, 5),
                            htt = tt.substring(0, 2),
                            mtt = tt.substring(3, 5);
                        goTrains = true;

                        $s.trainTimes = {
                            Departure: setTimeT1.slice(0, -3),
                            From: s1,
                            Arrival: setTimeT2.slice(0, -3),
                            To: s2,
                            Duration: htt + " hr " + mtt + " min",
                            Stops: {
                                numStops: Math.abs(_m - _n),
                                listStops: rStops
                            }
                        };

                        window.scrollTo(0, document.body.scrollHeight);
                        break loop;
                    }
                }
            }
            if (!goTrains) {
                $(".noTrains").show();
                window.scrollTo(0, document.body.scrollHeight);
            }
        }

        function getDate() {
            var now = $("#when").val(),
                df = "Do MMMM yyyy",
                nm = moment(now, df),
                dd = nm.day();

            // Invalid date test
            if (!moment(nm, df, true).isValid()) {
                return false;
            }
            return dd;
        }
    });
