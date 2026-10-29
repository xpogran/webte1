const SOURCES = [
  {
    id: "hviezda",
    name: "Kino Hviezda",
    website: "https://www.kino-hviezda.example/program?tyzden=45&jazyk=sk",
    localUrl: "source/kino-hviezda.html",
    parse: parseHviezda,
  },
  {
    id: "mier",
    name: "Kino Mier",
    website: "https://kinomier.example/rozpis?mesto=ba&tyzden=45",
    localUrl: "source/kino-mier.html",
    parse: parseMier,
  },
  {
    id: "lumiere",
    name: "Kino Lumière",
    website: "https://lumiere.example/program/?od=2026-11-02&do=2026-11-08",
    localUrl: "source/kino-lumiere.html",
    parse: parseLumiere,
  },
  {
    id: "odeon",
    name: "Kino Odeon",
    website: "https://odeon.example/program",
    localUrl: "source/kino-odeon.html",
    parse: parseHviezda,
  },
];

// Simulated server delay (ms), so that we can see slow and fast sources. Not part of a real solution.
const DELAYS = { hviezda: 1500, mier: 500, lumiere: 1000 };

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadSource(source) {
  await wait(DELAYS[source.id] ?? 0);
  const response = await fetch(source.localUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return source.parse(parseHtml(await response.text()));
}

if (false) {
    async function loadAll() {
    console.time("loadAll");
    //.map() zavolá loadSource() pre každé kino zvlášť.
    const results = await Promise.allSettled(SOURCES.map(loadSource));
    console.table(results)
    console.timeEnd("loadAll");
    }
    loadAll();
}


const statusText = document.getElementById("status");
const refreshButton = document.getElementById("refresh");
const cards = document.getElementById("cards");

const results = {};

function createTodayList(days) {
  const today = DAY_NAMES[(new Date().getDay() + 6) % 7];
  const day = days.find((item) => item.day === today);
  if (!day || day.screenings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "mb-0 text-body-secondary";
    empty.textContent = `${today}: dnes sa nehrá.`;
    return empty;
  }
  const list = document.createElement("ul");
  list.className = "list-unstyled mb-0";
  for (const screening of day.screenings) {
    const item = document.createElement("li");
    const price = screening.price === null ? "cena neuvedená" : `${screening.price.toFixed(2)} €`;
    item.textContent = `${screening.time} ${screening.title} (${price})`;
    list.append(item);
  }
  return list;
}

function createCard(source) {
  const result = results[source.id];

  const column = document.createElement("div");
  column.className = "col-12 col-md-6 col-lg-4";
  column.dataset.source = source.id;

  const card = document.createElement("article");
  card.className = "card h-100";

  const header = document.createElement("div");
  header.className = "card-header d-flex justify-content-between align-items-center";
  const title = document.createElement("h2");
  title.className = "h5 mb-0";
  const link = document.createElement("a");
  link.href = source.website;
  link.textContent = source.name;
  title.append(link);
  header.append(title);

  const body = document.createElement("div");
  body.className = "card-body";

  if (result.state === "loading") {
    const spinner = document.createElement("div");
    spinner.className = "spinner-border spinner-border-sm";
    spinner.setAttribute("role", "status");
    const label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = "Načítava sa…";
    spinner.append(label);
    header.append(spinner);
    body.textContent = "Načítavam program…";
  } else if (result.state === "error") {
    body.classList.add("text-danger");
    body.textContent = `Program sa nepodarilo načítať (${result.error.message}). `;
  } else {
    body.append(createTodayList(result.days));
  }

  card.append(header, body);
  column.append(card);
  return column;
}

function renderCards() {
  cards.replaceChildren(...SOURCES.map(createCard));
}

async function loadAll() {
  const outcomes = await Promise.allSettled(SOURCES.map(loadSource));
  outcomes.forEach((outcome, index) => {
    const source = SOURCES[index];
    results[source.id] = outcome.status === "fulfilled"
      ? { state: "ok", days: outcome.value, updatedAt: new Date() }
      : { state: "error", error: outcome.reason };
  });
  renderCards();
}

