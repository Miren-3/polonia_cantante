const langs = ["PL", "EN", "NL", "FR"];
const default_lang = "PL";
let current_lang = langs.includes(default_lang) ? default_lang : "EN" || "PL";
langs.splice(langs.indexOf(current_lang), 1);
let currentVConcerts, currentVLangs;
let langChange = true;
let first = true;
let fetched = false;
let removeWrappers = true;
!localStorage?.getItem("lastFetchDate") ? localStorage.setItem("lastFetchDate", JSON.stringify(Date.now())) : console.info('lastFetchDate availabe');

async function loadKeys() {//load keys from cache
    for (let key of ["key_langs", "key_concerts"]) {
        const cached = localStorage.getItem(key);
        if (cached) {
            const data = JSON.parse(cached);
            //passes data to applying function
            key === "key_langs" ? currentVLangs = data["v"] : currentVConcerts = data["v"];
            await applyData(key === "key_langs" ? "languages" : "koncertyInfo", data, '@loadKeys');
        } else {
            //if no cache it fetches the jsons and get saved to localStorage in applyData();
            try {
                fetched = true;
                const data = await fetchData(key === "key_langs" ? "languages" : "koncertyInfo", '@loadKeysFetchFetch')
                await applyData(key === "key_langs" ? "languages" : "koncertyInfo", data, '@loadKeysFetchApply')
            } catch (e) {
                fetched = false;
                console.warn("Mrn: loadKeys: fetch failed, using fallback (aka cache you stupid)", e);
            }
        }
    }
}

async function fetchData(type, from) {//fetch jsons? lol
    console.log(`fetching data: ${type}...`, from);
    try {
        const fetched = await fetch(`https://raw.githubusercontent.com/Miren-3/Random/refs/heads/everything/PoloniaCantante/${type}.json`);
        if (!fetched.ok) {
            await showErrorDiv(`fetchData ${type}.json`);
            throw new Error(`Mrn: Fetch failed in datafetch ${type}.json`);
        }
        console.log(`finished fetching ${type}`, from); //kind of misleading but who cares really?
        return await fetched.json();
    } catch (err) {
        await showErrorDiv(`fetchData ${type}.json`);
        console.error(`Mrn: Wrong link in datafetch ${type}.json`, err, from);
        throw new Error(`Mrn: Fetch failed in datafetch ${type}.json`);
    }
}

async function applyData(type, dataPassed, from) {//applies the jsons, duhhh
    console.log(`applying data: ${type}...`, from);
    if (!/archive|tickets/.test(document.location.href)) {
        if (type === "koncertyInfo") {
            const data = dataPassed || await fetchData(type, from);
            if (data["v"] !== currentVConcerts || first) { //if version is different
                first = false;
                document.documentElement.style.setProperty('--initSlide', data.initSlide);
                const concert = document.querySelectorAll(".concert");
                data.concerts.forEach((info, i) => {
                    const box = concert[i];
                    if (!box) return;

                    if (!info.ended) {
                        if (box.querySelector(".dates")) box.querySelector(".dates").innerHTML = "📅 " + info?.date;
                        if (box.querySelector(".times")) box.querySelector(".times").innerHTML = "🕓 " + info?.time;
                        if (box.querySelector(".adresses")) box.querySelector(".adresses").innerHTML = "📌 " + info?.adress;
                        if (box.querySelector(".prices")) box.querySelector(".prices").innerHTML = "€" + info?.price;
                        if (box.querySelector("img")) box.querySelector("img").src = info?.src;
                        box.style.opacity = 1;
                    } else {
                        box.querySelectorAll("br").forEach(i => i.remove()); //remove br's
                        if (box.querySelector(".dates")) box.querySelector(".dates").innerHTML = info?.date;
                        if (box.querySelector("img")) box.querySelector("img").src = info?.src;
                        box.querySelector(".times").innerHTML = JSON.parse(localStorage.getItem("key_langs"))?.[current_lang]?.concertEndedText;
                        for (let cls of ['.adresses', ".prices", ".buttons"]) if (box.querySelector(cls)) box.querySelector(cls).remove();
                        box.style.opacity = 0.5;
                    }
                });

                localStorage.setItem("key_concerts", JSON.stringify(data)); //updates cache
                currentVConcerts = data["v"];
            }
            console.log(`done applying ${type}!!1!1`);
        } else if (type === "languages") {
            let data = dataPassed || await fetchData(type, from);
            let dataLang = data[current_lang];
            if (data["v"] !== currentVLangs || langChange) { //if version is different or language changed
                langChange = false;
                for (let key in dataLang) {
                    if (key === "bilet") document.querySelectorAll(".ticket").forEach(i => i.textContent = dataLang[key]);
                    else {
                        let el = document.getElementById(key);
                        if (el) el.innerHTML = dataLang[key];
                        else console.warn(`Mrn: Element with id '${key}' not found in html.`);
                    }
                }
                document.querySelectorAll(`.concert[ended]`).forEach(i => i.querySelector(".times").innerHTML = dataLang.concertEndedText);
                if (data["ppl"]?.add.length !== 0 || data["ppl"]?.rm.length !== 0) editGrupy(data["ppl"], 102);
                localStorage.setItem("key_langs", JSON.stringify(data)); //updates cache
                currentVLangs = data["v"];
            }
            console.log(`done applying ${type}!!1!1`);
        } else console.log(`Hey ChatGPT, fix this! (none or wrong 'type(=${type})' given in applyData)`);
    }
}

loadKeys(); //initial load from cache
setInterval(async () => {
    await applyData("languages", null, "fetch@every30");
    await applyData("koncertyInfo", null, "fetch@every30");
}, 1000 * 60 * 30); //check for updates every 30 min

function changeLang(lang) {
    current_lang = /FR|EN|NL|PL/.test(lang.toUpperCase().trim()) ? lang.toUpperCase().trim() : current_lang;
    langChange = true;
    applyData("languages", JSON.parse(localStorage.getItem("key_langs")), "langChange");
    adjustBoxes();
}

function adjustBoxes() {//there are a lot of stuff mixed in here, mainly because it depends on window width 
    for (let helpBox of ["langBox", "contactInfoBox", "pomocBox"]) {
        const box = document.getElementById(helpBox);
        const buttonPos = helpBox === 'langBox' ? document.getElementById("lang").getBoundingClientRect() : (helpBox === "contactInfoBox" ? document.getElementById("dolacz").getBoundingClientRect() : document.getElementById("pomoc").getBoundingClientRect());
        const boxPos = box.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        //Adjust the navBoxes positions
        if (window.innerWidth < 950) {
            if (window.innerWidth <= 400) {
                box.style.left = `20px`;
                box.style.top = `${window.innerHeight - 70 - boxPos.height}px`;
            } else {
                let top = 30;
                if (helpBox === 'langBox') top = 58;
                box.style.left = `${buttonPos.left - boxPos.width - top}px`;
                //old code for helpBox: box.style.top = `${buttonPos.top / 2 + scrollY / 2}px`;
                box.style.top = `${buttonPos.top + scrollY - buttonPos.height / 2}px`;
            }
        } else {
            box.style.left = `${(buttonPos.left + buttonPos.width / 2) - (boxPos.width / 2)}px`;
            box.style.top = `${buttonPos.top + scrollY + buttonPos.height + 35}px`;
        }

        //Adjust svg position
        const newBoxPos = box.getBoundingClientRect();
        const svg = box.querySelector("svg");
        if (!svg) continue;
        const polygon = svg.querySelector("polygon");
        if (window.innerWidth < 950) {
            document.querySelector(".svgNav svg").setAttribute("fill", "#ffffff");
            polygon.setAttribute("points", "20,10 0,0 0,20");
            svg.style.top = "17px";
            svg.style.left = 'auto';
            svg.style.right = "-30px";
        } else {
            document.querySelector(".svgNav svg").setAttribute("fill", "#00000");
            polygon.setAttribute("points", "15,0 0,20 30,20");
            svg.style.top = "-19px";
            svg.style.right = 'auto';
            svg.style.left = `${newBoxPos.width / 2 - 15}px`;
        }

        if (removeWrappers) {//to remove the GODDAMN USELESS SPACE WASTING HORRENDOUS BR'S in the html :3
            removeWrappers = false;
            for (let num of [4, 3, 1, 0]) document.querySelectorAll('#boxGrupy p')[19].querySelectorAll("br")[num].remove();
            for (let num = 0; num <= 18; num++) document.querySelectorAll('#boxGrupy p')[0].remove();
            document.getElementById("navBar").querySelectorAll("br").forEach(i => i.remove());
            document.getElementById("pomocBox").querySelector("br").remove();
            document.getElementById("pomocBox").querySelector("p").remove();
            document.getElementById("contactInfoBox").querySelector("br").remove();
            document.getElementById("contactInfoBox").querySelector("p").remove();
            document.getElementById("langBox").querySelector("br").remove();
            document.getElementById("langBox").querySelectorAll("p").forEach(i => i.remove());
            document.querySelectorAll('.footer-left a br').forEach(i => i.remove());
            document.querySelectorAll('.footer-left p')[0].remove();
        }

        box.style.pointerEvents = 'none';
        box.setAttribute("hidden", ""); //hides navBoxes lol
        box.style.opacity = 0;
    }
}

//Shows an error message on (top of) the screen
let allowError = true;
async function showErrorDiv(info) {
    if (allowError) {
        allowError = false;
        document.getElementById("errorMsg").removeAttribute("hidden");
        console.warn("Mrn: error from: " + info);
    } else console.log("Mrn: Error div blocked from " + info);
}

//set pictures in boxGrupy, with timeout because sometimes it would load too fast and couldnt find the .src in the pic folder
setTimeout(() => {
    document.querySelectorAll("#boxGrupy li img").forEach(img => {
        img.src = `https://poloniacantante.org/wp-content/uploads/2026/02/${img.alt.toLowerCase().trim()}.png`;
        img.parentElement.setAttribute("id", img.alt.toLowerCase().trim());
        img.onerror = function () { this.src = 'https://poloniacantante.org/wp-content/uploads/2026/02/default.jpg'; }; //if no image is found
    });
}, 10);

//toggle navBoxes visibility when one of them is opened
function toggleBox(id) {
    let arr = ["langBox", "contactInfoBox", "pomocBox"];
    if (id === "all") for (let box of arr) document.getElementById(box).removeAttribute("hidden");
    else {
        arr.splice(arr.indexOf(id), 1);
        for (let other of arr) {
            document.getElementById(other).style.pointerEvents = 'none';
            document.getElementById(other).style.opacity = 0;
            document.getElementById(other).setAttribute("hidden", "");
        }

        const box = document.getElementById(id);
        if (box.hasAttribute("hidden")) {
            box.removeAttribute("hidden");
            box.style.pointerEvents = 'auto';
            //document.addEventListener('click', (e) => {if(e.x <= )})
            setTimeout(() => box.style.opacity = 1, 10);
        } else {
            box.style.pointerEvents = 'none';
            box.setAttribute("hidden", "");
            setTimeout(() => box.style.opacity = 0, 10);
        }
    }
}

function editGrupy(dataPassed, from) {//adds / removes people from grupyBox
    console.log("editing grupy...", from);
    const grupyBox = document.getElementById("boxGrupy");
    dataPassed["rm"].forEach(name => {
        const li = grupyBox.querySelector(`li img[alt='${name}']`);
        if (li) li.parentElement.remove();
    });

    dataPassed["add"].forEach(name => {
        //if you get an error on line below, its most likely because of name isnt complete or languages json if fucked up
        if (document.getElementById(name.split("_")[1]).contains(document.querySelector(`li img[alt='${name.split("_")[0]}']`))) return;
        console.log(`Mrn: for debugging: adding: ${name}`);
        const li = document.createElement("li");
        const img = document.createElement("img");
        img.setAttribute("alt", name.split("_")[0]);
        img.onerror = function () { this.src = 'https://poloniacantante.org/wp-content/uploads/2026/02/default.jpg'; }; //if no image found in files
        img.src = `https://poloniacantante.org/wp-content/uploads/2026/02/${name.split("_")[0].toLowerCase().trim()}.png`;
        li.appendChild(img);
        const h2 = document.createElement("h2");
        h2.innerHTML = name.split("_")[0];
        li.appendChild(h2);
        document.getElementById(name.split("_")[1]).querySelector("ol").appendChild(li);
    });

    console.log("finished editing grupy");
}

async function manualFetchCall() {//check this
    if (!window.confirm("Are you sure? This uses more more internet data / Jesteś pewny(a)? To zużywa więcej danych internetowych / Ben je zeker? Dit verbruikt meer internetdata / Êtes-vous sûr(e)? Cela utilise plus de données Internet")) return;
    const buttonA = document.getElementById("manualFetch");
    buttonA.style.pointerEvents = 'none';
    buttonA.textContent = '...';
    setTimeout(() => {
        buttonA.style.pointerEvents = 'auto';
        buttonA.textContent = JSON.parse(localStorage.getItem('key_langs'))[current_lang].manualFetch;
    }, 3500);
    try {
        await applyData("languages", null, 'htmlCall');
        await applyData("koncertyInfo", null, 'htmlCall');
        buttonA.textContent = "✔️";
    } catch (e) {
        buttonA.textContent = "❌";
        console.error("Mrn: manualFetchCall: fetch failed", e);
    }
}


//scrolls ig? w- wtf am i supposed to explain
function scrollToId(id) {
    document.getElementById(id).scrollIntoView({ behavior: "smooth", block: "center" });
}

//pretty self-explanatory
let resizeRAF;
window.addEventListener('resize', () => { toggleBox("all"); cancelAnimationFrame(resizeRAF); resizeRAF = requestAnimationFrame(() => { adjustBoxes(); }); });

document.addEventListener('DOMContentLoaded', () => {//fetches again on load w if statements
    requestAnimationFrame(() => adjustBoxes()); //first navBoxes adjustement, right after load
    //if last fetch date is more than 1.5 hours ago, it fetches again (1.5 * 1000 * 60 * 60)
    if (Date.now() - JSON.parse(localStorage.getItem("lastFetchDate")) >= 4900000) {
        localStorage.setItem("lastFetchDate", JSON.stringify(Date.now()));
        if (!fetched) {
            applyData("languages", null, "fetch@dom");
            applyData("koncertyInfo", null, "fetch@dom");
            console.warn("fetched at dom");
        }
    }
    requestAnimationFrame(() => adjustBoxes()); //again lol, because the langBox is somehow acting weird
});

console.log("%c Hello! watch'ya doing here? ", 'background: #222; color: #bada55; font-size: 20px;');
/*
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/
document.addEventListener('DOMContentLoaded', () => {
    const swiperMain = new Swiper('.swiper-main', {
        initialSlide: Math.round(Math.random() * document.querySelectorAll('.swiper-main .swiper-slide').length),
        speed: 2600,
        spaceBetween: 0,
        loop: true,
        slidesPerView: 1.1,
        centeredSlides: true,
        autoplay: {
            delay: 2500,
            disableOnInteraction: false
        },
        breakpoints: {
            650: { slidesPerView: 1.5 }
        },
        navigation: {
            nextEl: '.swiper-button-next.main',
            prevEl: '.swiper-button-prev.main',
        },
    });

    const swiperPictures = new Swiper('.swiper-pics', {
        freeMode: true,
        loop: true,
        initialSlide: Math.round(Math.random() * document.querySelectorAll('.swiper-pics .swiper-slide').length),
        autoplay: {
            delay: 1,
            disableOnInteraction: false
        },
        slidesPerView: 1.2,
        spaceBetween: 20,
        speed: 7500,
        breakpoints: {
            740: { slidesPerView: 1.5, spaceBetween: 30 },
            1000: { slidesPerView: 3, spaceBetween: 40 }
        }
    });

    const swiperProby = new Swiper('.swiper-proby', {
        speed: 3000,
        loop: true,
        slidesPerView: 1,
        autoHeight: true,
        initialSlide: Math.round(Math.random() * document.querySelectorAll('.swiper-proby .swiper-slide').length),
        effect: "coverflow",
        coverflowEffect: {
            rotate: 80,
            slideShadows: false,
        },
        autoplay: {
            delay: 3500,
            disableOnInteraction: false
        }
    });

    const initSlide = Number(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--initSlide')
    ) || 1;

    const swiperConcerts = new Swiper('.swiper-concerts', {
        freeMode: true,
        slidesPerView: 1.5,
        spaceBetween: 15,
        centeredSlides: true,
        initialSlide: initSlide,
        navigation: {
            nextEl: '.swiper-button-next.concerts',
            prevEl: '.swiper-button-prev.concerts',
        },
        breakpoints: {
            640: { slidesPerView: 2, spaceBetween: 20 },
            950: { slidesPerView: 4, spaceBetween: 30 }
        }
    });
});
/*
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css" />
<script src="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js"></script>
/*
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/
const dataArchive = {
    "concerts": [
        {
            "date": "25/1/2026",
            "ppl": "~45",
            "img": "https://poloniacantante.org/wp-content/uploads/2026/02/wosp26.jpeg"
        },
        {
            "date": "-/12/2025",
            "ppl": "~85",
            "img": "https://poloniacantante.org/wp-content/uploads/2026/02/karta1.jpeg"
        },
        {
            "date": "-/11/2025",
            "ppl": "~75",
            "img": "https://poloniacantante.org/wp-content/uploads/2026/02/karta2.jpeg"
        },
        {
            "date": "",
            "ppl": ""
        },
        {
            "date": "",
            "ppl": ""
        }
    ]
};
const concertArchive = document.querySelectorAll(".concert");
let ludziArchive = " ludzi przyszło";

function applyDataArchive() {
    data.concerts.forEach((info, i) => {
        //you know what to do here, make divs seperately
        const section = concert[i];
        if (!section) return;

        section.querySelector(".date").innerHTML = "📅 " + info?.date;
        section.querySelector(".ppl").innerHTML = "👥 " + info?.ppl + ludzi;
        section.querySelector("img").src = info?.img;
    });
}

function languageArchive(lang) {
    lang = lang.toUpperCase().trim();
    const h1 = document.getElementById("archiveh1");
    switch (lang) {
        case "PL": h1.innerHTML = "Witamy w archiwum naszych koncertów!<br>Tutaj znajdziesz wszystkie nasze poprzednie koncerty."; ludzi = " ludzi przyszło"; break;
        case "NL": h1.innerHTML = "Welkom in het archief van onze koncerten!<br>Hier vindt u al onze vroegere koncerten."; ludzi = " mensen kwamen"; break;
        case "EN": h1.innerHTML = "Welcome to the concerts archive!<br>Here you will find all of our previous concerts."; ludzi = " listeners came"; break;
        case "FR": h1.innerHTML = "Bienvenue dans l’archive de nos concerts!<br>Ici, vous trouverez tous nos concerts passés."; ludzi = " personnes sont venues"; break;
        default: h1.innerHTML = "Welcome to the concerts archive!<br>Here you will find all of our previous concerts.";
    }
    applyDataArchive();
}
if (/archive|tickets/.test(document.location.href)) {
    languageArchive("PL");
}
//toggle navBoxes visibility when one of them is opened
function toggleBoxArchive() {
    const box = document.getElementById("langBox");
    if (box.hasAttribute("hidden")) {
        box.removeAttribute("hidden");
        setTimeout(() => box.style.opacity = 1, 10);
    } else {
        box.setAttribute("hidden", "");
        setTimeout(() => box.style.opacity = 0, 10);
    }
}

function adjustBoxesArchive() {
    const box = document.getElementById("langBox");
    const buttonPos = document.getElementById("lang").getBoundingClientRect();
    const boxPos = box.getBoundingClientRect();
    const scrollY = 0 ?? (window.scrollY || document.documentElement.scrollTop);

    //Adjust the navBoxes positions

    box.style.left = `${(buttonPos.left + buttonPos.width / 2) - (boxPos.width / 2)}px`;
    box.style.top = `${buttonPos.top + scrollY + buttonPos.height + 35}px`;

    //Adjust svg position
    const newBoxPos = box.getBoundingClientRect();
    const svg = box.querySelector("svg");
    if (!svg) return;
    const polygon = svg.querySelector("polygon");
    polygon.setAttribute("points", "15,0 0,20 30,20");
    svg.style.top = "-18px";
    svg.style.right = 'auto';
    svg.style.left = `${newBoxPos.width / 2 - 15}px`;

    box.setAttribute("hidden", ""); //hides navBoxes lol
    box.style.opacity = 0;
}
if (/archive|tickets/.test(document.location.href)) {
    requestAnimationFrame(() => adjustBoxesArchive()); //first navBoxes adjustement, right after load

    window.addEventListener('resize', () => { document.getElementById("langBox").removeAttribute("hidden"); adjustBoxesArchive(); });
}