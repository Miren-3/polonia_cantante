//if you see this, hey there! my discord is miren.3 or email me at ber.kk.11.2022@gmail.com if you want to contact me :)
const langs = ["PL", "EN", "NL", "FR"];
const default_lang = "PL";
let current_lang = langs.includes(default_lang) ? default_lang : "EN";
const index = langs.indexOf(current_lang);
if (index !== -1) langs.splice(index, 1);
let currentVConcerts, currentVLangs;
let langChange = true;
let first = true;
let fetched = false;
!localStorage?.getItem("lastFetchDate") ? localStorage.setItem("lastFetchDate", JSON.stringify(Date.now())) : console.info('lastFetchDate availabe');

async function loadKeys() {//load keys from cache
    for (let key of ["key_langs", "key_concerts"]) {
        const cached = localStorage.getItem(key);
        if (cached) {
            const data = JSON.parse(cached);
            //passes data to applying function
            key === "key_langs" ? currentVLangs = data["v"] : currentVConcerts = data["v"];
            await applyData(key === "key_langs" ? "languages" : "koncertyInfo", data, 'apply@loadKeys');
        } else {
            //if no cache it fetches the jsons and get saved to localStorage in applyData();
            try {
                fetched = true;
                const data = await fetchData(key === "key_langs" ? "languages" : "koncertyInfo", 'fetch@loadKeysFetch')
                await applyData(key === "key_langs" ? "languages" : "koncertyInfo", data, 'apply@loadKeysFetch')
            } catch (e) {
                fetched = false;
                console.warn("Mrn: loadKeys: fetch failed, using fallback (aka cache you stupid)", e);
            }
        }
    }
}
loadKeys(); //initial load from cache
async function fetchData(type, from) {//fetch jsons? lol
    console.log(`fetching data: ${type}...`, from);
    try {
        const fetched = await fetch(`https://raw.githubusercontent.com/Miren-3/polonia_cantante/refs/heads/main/${type}.json`);
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
    //if (!first) window.reload(); //to confirm later
    const data = dataPassed || await fetchData(type, from);
    if (type === "koncertyInfo") {
        if (data["v"] !== currentVConcerts || first) { //if version is different, or first load
            first = false;
            document.documentElement.style.setProperty('--initSlide', data.initSlide);
            data.concerts.forEach((info, i) => {
                const mainBox = document.createElement('div');
                mainBox.classList.add('swiper-slide');
                mainBox.classList.add('concert');
                mainBox.id = `concert${i + 1}`;
                //mainBox.style.minWidth="clamp(280px,40vw,510px)";
                const ol = document.createElement('ol');
                const mainLi = document.createElement('li');
                const li = document.createElement('li');
                const spanDates = document.createElement('span');
                spanDates.classList.add('dates');
                spanDates.innerHTML = "📅 " + info?.date || "7-7-2026";
                mainLi.appendChild(spanDates);
                mainLi.appendChild(document.createElement('br'));
                const hr = document.createElement('hr');
                hr.style.width = "90%";
                mainLi.appendChild(hr);
                const spanTimes = document.createElement('span');
                spanTimes.classList.add('times');
                if (!info.ended) {
                    spanTimes.innerHTML = "🕓 " + info?.time || "18:00";
                    mainLi.appendChild(spanTimes);
                    mainLi.appendChild(document.createElement('br'));
                    const spanAdresses = document.createElement('span');
                    spanAdresses.classList.add('adresses');
                    spanAdresses.innerHTML = "📌 " + info?.adress || "Leuven";
                    mainLi.appendChild(spanAdresses);
                    mainLi.appendChild(document.createElement('br'));
                    const spanPrices = document.createElement('span');
                    spanPrices.classList.add('prices');
                    spanPrices.innerHTML = "€" + info?.price || 10;
                    mainLi.appendChild(spanPrices);
                    mainLi.appendChild(document.createElement('br'));
                    const spanTickets = document.createElement('span');
                    spanTickets.classList.add('buttons');
                    const a = document.createElement('a');
                    a.classList.add('ticket');
                    a.textContent = JSON.parse(localStorage.getItem("key_langs"))[current_lang]["bilet"] || "Ticket";
                    a.href = "bilety.html" || "#";
                    a.target = "_blank";
                    spanTickets.appendChild(a);
                    mainLi.appendChild(spanTickets);
                    mainLi.appendChild(document.createElement('br'));
                } else {
                    spanTimes.innerHTML = "🕓 " + JSON.parse(localStorage.getItem("key_langs"))[current_lang]["concertEndedText"] || "Ended";
                    spanTimes.id = "concertEndedText";
                    mainLi.appendChild(spanTimes);
                    mainBox.style.opacity = 0.5;
                }
                ol.appendChild(mainLi);
                const img = document.createElement('img');
                img.src = info?.src || "https://poloniacantante.org/wp-content/uploads/2026/02/kartaEnhanced.jpg";
                li.appendChild(img);
                ol.appendChild(li);
                mainBox.appendChild(ol);
                document.querySelector(".swiper-concerts .swiper-wrapper").appendChild(mainBox);
            });

            console.log(`done applying ${type}!!1!1`);
            try { localStorage.setItem("key_concerts", JSON.stringify(data)); /*updates cache*/ } catch (e) { console.error("localStorage disabled") }
            currentVConcerts = data["v"];
        }
    } else if (type === "languages") {
        let data = dataPassed || await fetchData(type, from);
        let dataLang = data[current_lang];
        if (data["v"] !== currentVLangs || langChange) { //if version is different or language changed
            langChange = false;
            for (let key in dataLang) {
                if (key === "bilet") document.querySelectorAll(".ticket").forEach(i => i.textContent = dataLang[key]);
                if (key === "concertEndedText") document.querySelectorAll("#concertEndedText").forEach(i => i.textContent = "🕓 " + dataLang[key]);
                else {
                    let el = document.getElementById(key);
                    if (el) el.innerHTML = dataLang[key];
                    else console.warn(`Mrn: Element with id '${key}' not found in html.`);
                }
            }
            document.querySelectorAll(`.concert[ended]`).forEach(i => i.querySelector(".times").innerHTML = dataLang.concertEndedText);
            if (data["ppl"]?.add.length !== 0 || data["ppl"]?.rm.length !== 0) editGrupy(data["ppl"], 137);
            try { localStorage.setItem("key_langs", JSON.stringify(data)); /*updates cache*/ } catch (e) { console.error("localStorage disabled") }
            currentVLangs = data["v"];
        }
        console.log(`done applying ${type}!!1!1`);

    } else console.log(`Hey ChatGPT, fix this! (none or wrong 'type(=${type})' given in applyData)`);
    fetched = true; //shut up i know this is a random variable
    console.log(`done applying ${type}!!1!1 ver updated: ` + ((type === "languages" ? currentVLangs : currentVConcerts) === data['v'] ? false : true));
}

function changeLang(lang) {
    current_lang = /FR|EN|NL|PL/.test(lang.toUpperCase().trim()) ? lang.toUpperCase().trim() : current_lang;
    langChange = true;
    applyData("languages", JSON.parse(localStorage.getItem("key_langs")), "langChange");
    adjustBoxes();
}

/*increments a counter through api to count how many people opened the website
NOTE: THIS IS ONLY ACTIVE ON THE WEBSITE
(function () {
  setTimeout(() => {
    fetch("https://api.counterapi.dev/v2/mirens-team-3096/page-views-pol-cant/up")
      .then(res => res.json())
      .then(data => console.log("Api counter success"))
      .catch(err => console.log("Api counter error", err));
  }, 4000);
})();
*/

function adjustBoxes() {
    for (let helpBox of ["langBox", "contactInfoBox", "pomocBox"]) {
        const box = document.getElementById(helpBox);
        const buttonPos = helpBox === 'langBox' ? document.getElementById("lang").getBoundingClientRect() : (helpBox === "contactInfoBox" ? document.getElementById("dolacz").getBoundingClientRect() : document.getElementById("pomoc").getBoundingClientRect());
        const boxPos = box.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        //Adjust the navBoxes positions
        if (window.innerWidth < 950) {
            if (window.innerWidth <= 460) {
                box.style.left = `20px`;
                box.style.top = `${window.innerHeight - 70 - boxPos.height}px`;
            } else {
                let top = 30;
                if (helpBox === 'langBox') top = 52;
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
            document.querySelector(".svgNav svg").setAttribute("fill", "#000000");
            polygon.setAttribute("points", "15,0 0,20 30,20");
            svg.style.top = "-19px";
            svg.style.right = 'auto';
            svg.style.left = `${newBoxPos.width / 2 - 15}px`;
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

//something with pictures in #boxGrupy, if you get an error with image src
setTimeout(() => {
    document.querySelectorAll("#boxGrupy li img").forEach(img => {
        img.parentElement.setAttribute("id", img.alt.toLowerCase().trim());
        img.onerror = function () {
            if (!this.src.includes("default.jpg")) {
                this.src = "pics/headshot/default.jpg";
            }
        };
        // if its already broken
        if (img.complete && img.naturalWidth === 0) {
            img.src = "pics/headshot/default.jpg";
        }
    });
}, 2000);

function changeJoinColor(type) {
    const text = document.getElementById(`text${type}`);
    const textA = document.getElementById(`textA${type}`);
    if (text.style.color == "white") {
        text.style.color = "black";
        textA.style.color = "red";
    } else {
        text.style.color = "white";
        textA.style.color = "white";
    }
}

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
        /*old code:
        img.onerror = function () { this.src = 'pics/headshot/default.jpg'; }; //if no image found in files
        img.src = `pics/headshot/${name.split("_")[0].toLowerCase().trim()}.png`;
        */
        li.appendChild(img);
        img.setAttribute("loading", "lazy");
        const h2 = document.createElement("h2");
        h2.innerHTML = name.split("_")[0];
        li.appendChild(h2);
        document.getElementById(name.split("_")[1]).querySelector("ol").appendChild(li);
    });
    console.log("finished editing grupy");
}

async function manualFetchCall() {//check this
    if (!window.confirm("Please confirm / Proszę potwierdzić / Bevestig a.u.b. / Confirmer s.v.p")) return;
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
    //if last fetch date is more than 20 hours ago (nobody knows why its 20), it fetches again (20 * 1000 * 60 * 60)
    if (Date.now() - JSON.parse(localStorage.getItem("lastFetchDate")) >= (20 * 1000 * 60 * 60)) {
        localStorage.setItem("lastFetchDate", JSON.stringify(Date.now()));
        if (!fetched) {
            applyData("languages", null, "fetch@dom");
            applyData("koncertyInfo", null, "fetch@dom");
            console.warn("fetched@dom");
        }
    }
    requestAnimationFrame(() => adjustBoxes()); //again lol, because the langBox is somehow acting weird

    //makes a new div to showcase the pictures in bigger size
    document.querySelectorAll("img").forEach(img => {
        img.addEventListener('click', () => {
            const imgDiv = document.createElement('div');
            imgDiv.style = 'position:fixed;inset:0;display:flex;justify-content:center;align-items:center;z-index:1000;opacity:0;transition-timing-function: ease-out;transition: opacity 0.7s;';
            imgDiv.id = "imgFullScreen";
            const innerDiv = document.createElement('div');
            innerDiv.style = "background-color: rgba(46, 84, 234, 0.95);max-width: 100%; max-height: 100%; width: 90%; height: auto;display: flex; justify-content: center; align-items: center;padding: 25px;position:relative;box-sizing: border-box;overflow:hidden;margin-top: 10px;border-radius: 15px;";
            const closeBtn = document.createElement('button');
            closeBtn.textContent = "X"
            closeBtn.style = "position:absolute; top: 6vh; right: 10vw; left: auto; background-color: white; height: 50px; width: 50px;border: 2px solid black; border-radius: 5px; font-size: 2.8rem; cursor: pointer;z-index: 1001;padding: 0 0 10px 0; margin: 0;";
            closeBtn.onclick = () => document.body.removeChild(document.getElementById("imgFullScreen"));
            innerDiv.appendChild(closeBtn);
            const imgEl = document.createElement('img');
            imgEl.src = img.src;
            imgEl.style = "max-width: 92vw; max-height: 90vh; min-width: clamp(300px,70vw,900px);min-height: clamp(300px,70vh,900px);height:auto; width:auto;object-fit: contain;box-sizing: border-box;border: 2px solid white";
            innerDiv.appendChild(imgEl);
            imgDiv.appendChild(innerDiv);
            document.body.appendChild(imgDiv);
            setTimeout(() => document.getElementById("imgFullScreen").style.opacity = 1, 30);
        });
    });
});

console.log("%c Hello! watch'ya doing here?\nuh wanna manage the website for me (for free ofc cuz im a minor)? message me with the error report button :3", 'background: #222; color: #bada55; font-size: 20px;');