// DEMO DATA ONLY — replace with data obtained through fetch + DOMParser later.
// Every restaurant returns the same structure: { id, name, location, menu: {day: [items]} }.
const restaurants = [
    {
        id: "a", name: "Reštaurácia A", location: "Ukážková reštaurácia",
        menu: {
            1: [{ type: "Polievka", name: "Hovädzí vývar", price: "2,20 €", allergens: "1, 9" }, { type: "Hlavné jedlo", name: "Kuracie prsia s ryžou", price: "7,90 €", weight: "150 g" }],
            2: [{ type: "Polievka", name: "Paradajková polievka", price: "2,40 €" }, { type: "Hlavné jedlo", name: "Zeleninové rizoto", price: "7,50 €" }],
            3: [{ type: "Polievka", name: "Cesnaková polievka", price: "2,20 €" }, { type: "Hlavné jedlo", name: "Bravčové na hubách", price: "8,20 €" }],
            4: [{ type: "Polievka", name: "Šošovicová polievka", price: "2,20 €" }, { type: "Hlavné jedlo", name: "Kurací rezeň, zemiaky", price: "8,00 €" }],
            5: [{ type: "Polievka", name: "Zeleninový vývar", price: "2,20 €" }, { type: "Hlavné jedlo", name: "Špagety s paradajkovou omáčkou", price: "7,60 €" }]
        }
    },
    {
        id: "b", name: "Reštaurácia B", location: "Ukážková reštaurácia",
        menu: {
            1: [{ type: "Polievka", name: "Hrachová polievka", price: "2,10 €" }, { type: "Hlavné jedlo", name: "Morčacie soté s ryžou", price: "8,30 €" }],
            2: [{ type: "Polievka", name: "Hovädzí vývar", price: "2,30 €" }, { type: "Hlavné jedlo", name: "Vyprážaný syr, hranolky", price: "7,90 €" }],
            3: [{ type: "Polievka", name: "Fazuľová polievka", price: "2,30 €" }, { type: "Hlavné jedlo", name: "Pečené kuracie stehno", price: "8,00 €" }],
            4: [{ type: "Polievka", name: "Krémová brokolicová polievka", price: "2,30 €" }, { type: "Hlavné jedlo", name: "Bravčový perkelt", price: "8,10 €" }],
            5: [{ type: "Polievka", name: "Paradajková polievka", price: "2,10 €" }, { type: "Hlavné jedlo", name: "Penne s kuracím mäsom", price: "8,40 €" }]
        }
    },
    {
        id: "c", name: "Jedáleň C", location: "Ukážková jedáleň",
        menu: {
            1: [{ type: "Polievka", name: "Zeleninová polievka", price: "1,80 €" }, { type: "Hlavné jedlo", name: "Segedínsky guláš", price: "6,90 €" }],
            2: [{ type: "Polievka", name: "Kurací vývar", price: "1,80 €" }, { type: "Hlavné jedlo", name: "Zapekané cestoviny", price: "6,50 €" }],
            3: [{ type: "Polievka", name: "Kapustová polievka", price: "1,80 €" }, { type: "Hlavné jedlo", name: "Pečené rybie filé", price: "7,20 €" }],
            4: [{ type: "Polievka", name: "Mrkvová polievka", price: "1,80 €" }, { type: "Hlavné jedlo", name: "Špenátové halušky", price: "6,80 €" }],
            5: [{ type: "Polievka", name: "Zemiaková polievka", price: "1,80 €" }, { type: "Hlavné jedlo", name: "Kurací paprikáš", price: "7,10 €" }]
        }
    }
];

const dayNames = ["", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];
let selectedDay = new Date().getDay();
if (selectedDay === 0 || selectedDay === 6) selectedDay = 1;

// Create checkboxes once, one per restaurant.
restaurants.forEach(function (restaurant) {
    const label = $("<label>").addClass("restaurant-choice");
    const checkbox = $("<input>").attr({ type: "checkbox", value: restaurant.id, checked: true });
    label.append(checkbox, $("<span>").text(restaurant.name));
    $("#restaurant-filters").append(label);
});

function makeMealGroup(items, type) {
    const group = $("<div>").addClass("meal-group");
    group.append($("<h4>").text(type === "Polievka" ? "Polievky" : "Hlavné jedlá"));

    const filtered = items.filter(item => item.type === type);
    if (!filtered.length) return group.append($("<p>").addClass("no-menu").text("Žiadna položka"));

    filtered.forEach(function (item) {
        const info = $("<div>");
        info.append($("<p>").addClass("meal-name").text(item.name));
        const details = [item.weight, item.allergens ? `Alergény: ${item.allergens}` : ""].filter(Boolean).join(" · ");
        if (details) info.append($("<p>").addClass("meal-details").text(details));
        group.append($("<div>").addClass("meal-item").append(
            info,
            $("<span>").addClass("meal-price").text(item.price || "Cena neuvedená")
        ));
    });
    return group;
}

function makeRestaurantCard(restaurant) {
    const card = $("<article>").addClass("restaurant-card");
    card.append($("<h3>").text(restaurant.name));
    card.append($("<p>").addClass("restaurant-location").text(restaurant.location));

    const days = selectedDay === "all" ? [1, 2, 3, 4, 5] : [Number(selectedDay)];
    days.forEach(function (day) {
        if (selectedDay === "all") card.append($("<h4>").addClass("day-label").text(dayNames[day]));
        const items = restaurant.menu[day];
        if (!items || !items.length) {
            card.append($("<p>").addClass("no-menu").text("Menu na tento deň nie je k dispozícii."));
        } else {
            card.append(makeMealGroup(items, "Polievka"));
            card.append(makeMealGroup(items, "Hlavné jedlo"));
        }
    });
    return card;
}

function renderMenus() {
    $(".day-buttons button").removeClass("active").filter(function () {
        return $(this).attr("data-day") === String(selectedDay);
    }).addClass("active");

    $("#menu-title").text(selectedDay === "all" ? "Menu na celý týždeň" : `${dayNames[Number(selectedDay)]} – obedové menu`);
    const container = $("#restaurant-container").empty();
    const selectedIds = $("#restaurant-filters input:checked").map(function () {
        return this.value;
    }).get();
    const visible = restaurants.filter(r => selectedIds.includes(r.id));

    if (!visible.length) {
        container.append($("<p>").addClass("no-menu").text("Vyberte aspoň jednu reštauráciu."));
        return;
    }

    visible.forEach(function (restaurant) {
        // Bootstrap columns: mobile = 1, tablet = 2, desktop = 3.
        container.append($("<div>").addClass("col-12 col-md-6 col-lg-4").append(makeRestaurantCard(restaurant)));
    });
}

$(".day-buttons button").on("click", function () {
    const day = $(this).attr("data-day");
    selectedDay = day === "all" ? "all" : Number(day);
    renderMenus();
});
$("#restaurant-filters").on("change", "input", renderMenus);

renderMenus();