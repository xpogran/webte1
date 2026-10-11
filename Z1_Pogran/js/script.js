const SEMESTER_START = new Date("2026-09-14T00:00:00");
const SEMESTER_END = new Date("2026-12-20T23:59:59");

if (document.getElementById("map")) {

    
    // Fixed locations
    const school = {
        name: "FEI STU",
        lat: 48.151965,
        lng: 17.072995
    };

    const home = {
        name: "Domov",
        lat: 48.1600,
        lng: 17.1100
    };


    // Create map
    const map = L.map("map").setView(
        [48.155, 17.09],
        13
    );


 
    // OpenStreetMap tiles
    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    ).addTo(map);


    // Permanent markers
    L.marker([school.lat, school.lng])
        .addTo(map)
        .bindPopup(school.name);

    L.marker([home.lat, home.lng])
        .addTo(map)
        .bindPopup(home.name);


    // User points
    let userPoints =
        JSON.parse(localStorage.getItem("userPoints")) || [];

    const pointSelect =
        document.getElementById("pointSelect");

    const message =
        document.getElementById("mapMessage");

    let connectionLine = null;


    // Add saved markers
    function showSavedPoints() {

        pointSelect.innerHTML =
            '<option value="">Vyberte bod</option>';

        userPoints.forEach(function(point, index) {

            L.marker([point.lat, point.lng])
                .addTo(map)
                .bindPopup(point.name);

            const option =
                document.createElement("option");

            option.value = index;
            option.textContent = point.name;

            pointSelect.appendChild(option);
        });

        if (userPoints.length > 0) {
            message.textContent =
                "Vyberte pridaný bod a cieľ pre výpočet vzdialenosti.";
        }
    }


    showSavedPoints();


    // Add point by clicking map
    map.on("click", function(event) {

        const name = prompt("Zadajte názov bodu:");

        if (!name) {
            return;
        }

        const newPoint = {
            name: name,
            lat: event.latlng.lat,
            lng: event.latlng.lng
        };

        userPoints.push(newPoint);

        localStorage.setItem(
            "userPoints",
            JSON.stringify(userPoints)
        );

        L.marker([newPoint.lat, newPoint.lng])
            .addTo(map)
            .bindPopup(newPoint.name)
            .openPopup();

        const option =
            document.createElement("option");

        option.value = userPoints.length - 1;
        option.textContent = newPoint.name;

        pointSelect.appendChild(option);

        pointSelect.value =
            userPoints.length - 1;

        message.textContent =
            "Bod bol pridaný.";
    });


    // Haversine distance
    function haversineDistance(
        lat1,
        lng1,
        lat2,
        lng2
    ) {

        const earthRadius = 6371;

        const latDifference =
            (lat2 - lat1) * Math.PI / 180;

        const lngDifference =
            (lng2 - lng1) * Math.PI / 180;

        const a =
            Math.sin(latDifference / 2) *
            Math.sin(latDifference / 2) +

            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *

            Math.sin(lngDifference / 2) *
            Math.sin(lngDifference / 2);

        const c =
            2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return earthRadius * c;
    }


    // Calculate distance
    document
        .getElementById("distanceButton")
        .addEventListener("click", function() {

            const selectedIndex =
                pointSelect.value;

            if (selectedIndex === "") {

                document.getElementById(
                    "distanceResult"
                ).textContent =
                    "Najskôr vyberte pridaný bod.";

                return;
            }


            const point =
                userPoints[selectedIndex];

            const destinationValue =
                document.getElementById(
                    "destinationSelect"
                ).value;


            let destination;

            if (destinationValue === "school") {
                destination = school;
            }
            else {
                destination = home;
            }


            const distance =
                haversineDistance(
                    point.lat,
                    point.lng,
                    destination.lat,
                    destination.lng
                );


            document.getElementById(
                "distanceResult"
            ).textContent =
                "Vzdialenosť medzi " +
                point.name +
                " a " +
                destination.name +
                " je " +
                distance.toFixed(2) +
                " km.";


            // Remove previous line
            if (connectionLine !== null) {
                map.removeLayer(connectionLine);
            }


            // Draw new line
            connectionLine = L.polyline(
                [
                    [point.lat, point.lng],
                    [destination.lat, destination.lng]
                ]
            ).addTo(map);


            // Popup with distance
            L.popup()
                .setLatLng([point.lat, point.lng])
                .setContent(
                    point.name +
                    "<br>Vzdialenosť: " +
                    distance.toFixed(2) +
                    " km"
                )
                .openOn(map);
        });
}

if (document.getElementById("scheduleTable")) {

    const lessons = document.querySelectorAll(".lesson");

    const currentLessonText =
        document.getElementById("currentLesson");

    const filterMessage =
        document.getElementById("filterMessage");


    // Converts time such as "13:50" into minutes from midnight.
    function timeToMinutes(time) {

        const parts = time.split(":");

        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        return hours * 60 + minutes;
    }


    // Finds current lesson or the next lesson.
    function updateCurrentLesson() {

        const now = new Date();

        const currentDay = now.getDay();

        const currentTime =
            now.getHours() * 60 + now.getMinutes();

        let activeLesson = null;


        lessons.forEach(function(lesson) {

            lesson.classList.remove("currentLesson");

            const lessonDay =
                Number(lesson.dataset.day);

            const start =
                timeToMinutes(lesson.dataset.start);

            const end =
                timeToMinutes(lesson.dataset.end);


            if (
                lessonDay === currentDay &&
                currentTime >= start &&
                currentTime <= end
            ) {
                activeLesson = lesson;
            }
        });


        // A lesson is currently running.
        if (activeLesson !== null) {

            activeLesson.classList.add("currentLesson");

            const name =
                activeLesson.querySelector("strong").textContent;

            currentLessonText.textContent =
                "Práve prebieha: " +
                name +
                " (" +
                activeLesson.dataset.start +
                " – " +
                activeLesson.dataset.end +
                ").";

            return;
        }


        // No lesson right now, find the closest future one.
        let closestLesson = null;
        let smallestDifference = Infinity;


        lessons.forEach(function(lesson) {

            const lessonDay =
                Number(lesson.dataset.day);

            const lessonStart =
                timeToMinutes(lesson.dataset.start);


            let dayDifference =
                lessonDay - currentDay;


            // Move to the same day next week if needed.
            if (
                dayDifference < 0 ||
                (
                    dayDifference === 0 &&
                    lessonStart <= currentTime
                )
            ) {
                dayDifference += 7;
            }


            const difference =
                dayDifference * 24 * 60 +
                lessonStart -
                currentTime;


            if (difference < smallestDifference) {

                smallestDifference = difference;
                closestLesson = lesson;
            }
        });


        if (closestLesson !== null) {

            const dayNames = [
                "nedeľu",
                "pondelok",
                "utorok",
                "stredu",
                "štvrtok",
                "piatok",
                "sobotu"
            ];

            const name =
                closestLesson.querySelector("strong").textContent;

            currentLessonText.textContent =
                "Momentálne neprebieha žiadna výučba. " +
                "Najbližšie: " +
                name +
                " v " +
                dayNames[Number(closestLesson.dataset.day)] +
                " o " +
                closestLesson.dataset.start +
                ".";
        }
    }


    // Schedule filters
    const filterButtons =
        document.querySelectorAll(".filterButton");


    filterButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            const selectedFilter =
                button.dataset.filter;


            // Remove active state from all buttons.
            filterButtons.forEach(function(otherButton) {
                otherButton.classList.remove("active");
            });


            // Highlight selected filter.
            button.classList.add("active");


            let visibleLessons = 0;


            lessons.forEach(function(lesson) {

                const lessonType =
                    lesson.dataset.type;


                if (
                    selectedFilter === "all" ||
                    lessonType === selectedFilter
                ) {
                    lesson.classList.remove("filteredOut");
                    visibleLessons++;
                }
                else {
                    lesson.classList.add("filteredOut");
                }
            });


            if (visibleLessons === 0) {

                filterMessage.textContent =
                    "Pre tento filter sa nenašla žiadna výučba.";
            }
            else {

                filterMessage.textContent = "";
            }
        });
    });


    // Semester progress
    function updateSemesterProgress() {

        const now = new Date();

        const progressBar =
            document.getElementById("semesterProgressBar");

        const progressText =
            document.getElementById("semesterProgressText");


        let percentage;


        if (now < SEMESTER_START) {

            percentage = 0;

            progressText.textContent =
                "Semester ešte nezačal.";
        }
        else if (now > SEMESTER_END) {

            percentage = 100;

            progressText.textContent =
                "Semester skončil – 100 %.";
        }
        else {

            const semesterLength =
                SEMESTER_END - SEMESTER_START;

            const elapsed =
                now - SEMESTER_START;

            percentage =
                (elapsed / semesterLength) * 100;


            progressText.textContent =
                "Uplynulo " +
                percentage.toFixed(1) +
                " % semestra.";
        }


        progressBar.style.width =
            percentage + "%";
    }


    updateCurrentLesson();
    updateSemesterProgress();
}