// Minimal interactive logic for the dashboard (updated course list)
const courses = [
  {
    id: "c1",
    title: "DSA",
    category: "programming",
    desc: "Data Structures & Algorithms — fundamentals, problems and solutions.",
    files: [
      {name: "DSA_Notes.pdf", url: "files/dsa_notes.pdf", size: "2.3 MB"},
      {name: "DSA_Problems.zip", url: "files/dsa_problems.zip", size: "6.8 MB"}
    ]
  },
  {
    id: "c2",
    title: "OS",
    category: "programming",
    desc: "Operating Systems — processes, threads, memory and scheduling.",
    files: [
      {name: "OS_Concepts.pdf", url: "files/os_concepts.pdf", size: "3.0 MB"},
      {name: "OS_Exercises.zip", url: "files/os_exercises.zip", size: "4.2 MB"}
    ]
  },
  {
    id: "c3",
    title: "JAVA",
    category: "programming",
    desc: "Java programming — core libraries, OOP and practical examples.",
    files: [
      {name: "Java_Guide.pdf", url: "files/java_guide.pdf", size: "2.7 MB"},
      {name: "Java_Projects.zip", url: "files/java_projects.zip", size: "9.4 MB"}
    ]
  },
  {
    id: "c4",
    title: "UNIX",
    category: "languages",
    desc: "UNIX essentials — shell, commands, scripting and administration.",
    files: [
      {name: "Unix_CheatSheet.pdf", url: "files/unix_cheatsheet.pdf", size: "0.9 MB"},
      {name: "Unix_Scripts.zip", url: "files/unix_scripts.zip", size: "1.8 MB"}
    ]
  },
  {
    id: "c5",
    title: "MATH",
    category: "math",
    desc: "Mathematics for CS — discrete math, calculus basics and practice.",
    files: [
      {name: "Math_Notes.pdf", url: "files/math_notes.pdf", size: "3.6 MB"},
      {name: "Math_Problems.zip", url: "files/math_problems.zip", size: "5.0 MB"}
    ]
  },
  {
    id: "c6",
    title: "DDCO",
    category: "design",
    desc: "DDCO (Digital Design & Computer Organization) — digital logic and architecture.",
    files: [
      {name: "DDCO_Notes.pdf", url: "files/ddco_notes.pdf", size: "2.1 MB"},
      {name: "DDCO_Examples.zip", url: "files/ddco_examples.zip", size: "3.3 MB"}
    ]
  }
];

// --- IndexedDB helpers for storing uploaded community resources ---
function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open('learnhub',1);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('uploads')){
        db.createObjectStore('uploads',{keyPath:'id'});
      }
    };
    req.onsuccess = (e)=> resolve(e.target.result);
    req.onerror = (e)=> reject(e.target.error);
  });
}

async function addUploadRecord(title, filename, blob, size){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('uploads','readwrite');
    const store = tx.objectStore('uploads');
    const id = Date.now();
    const rec = {id, title, filename, blob, size};
    const req = store.add(rec);
    req.onsuccess = ()=> resolve(rec);
    req.onerror = (e)=> reject(e.target.error);
  });
}

async function getAllUploadsFromDB(){
  const db = await openDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('uploads','readonly');
    const store = tx.objectStore('uploads');
    const req = store.getAll();
    req.onsuccess = ()=> resolve(req.result || []);
    req.onerror = (e)=> reject(e.target.error);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  // grab contribute modal elements
  const contributeBtn = document.getElementById('contribute-btn');
  const contributeModal = document.getElementById('contribute-modal');
  const closeContribute = document.getElementById('close-contribute');
  const cancelContribute = document.getElementById('cancel-contribute');
  const contributeForm = document.getElementById('contribute-form');
  const contribCourse = document.getElementById('contrib-course');
  const contribFile = document.getElementById('contrib-file');
  const contribDesc = document.getElementById('contrib-desc');
  const grid = document.getElementById("grid");
  const detail = document.getElementById("detail-pane");
  const detailTitle = document.getElementById("detail-title");
  const detailDesc = document.getElementById("detail-desc");
  const fileList = document.getElementById("file-list");
  const closeDetail = document.getElementById("close-detail");
  const downloadAll = document.getElementById("download-all");
  const yearEl = document.getElementById("year");
  const search = document.getElementById("search");
  const categories = document.querySelectorAll(".cat");
  const quick = document.getElementById("quick-downloads");
  let activeCategory = "all";

  yearEl.textContent = new Date().getFullYear();

  // load persisted uploads from IndexedDB and merge into courses list
  (async function loadUploads(){
    try{
      const uploads = await getAllUploadsFromDB();
      uploads.forEach(u => {
        // create a course-like entry for each upload
        const id = `u-${u.id}`;
        const courseObj = {
          id,
          title: u.title,
          category: 'community',
          desc: u.desc || 'Shared by community',
          files: [
            {name: u.filename, url: URL.createObjectURL(u.blob), size: u.size}
          ]
        };
        // add to courses so it shows up in lists
        courses.push(courseObj);
      });
      // re-render after uploads loaded
      filterAndRender();
    }catch(err){
      console.warn('Could not load uploads', err);
    }
  })();

  function renderGrid(list){
    grid.innerHTML = "";
    if(list.length === 0){
      grid.innerHTML = `<div style="color:var(--muted);padding:12px">No courses found.</div>`;
      return;
    }
    list.forEach(c => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = c.id;
      card.innerHTML = `
        <div class="meta">
          <div class="badge">${c.category}</div>
          <div style="flex:1">
            <h3>${c.title}</h3>
            <p>${c.desc}</p>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">
          <small class="file-meta">${c.files.length} file(s)</small>
          <button class="btn" data-id="${c.id}">View</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function openDetail(course){
    detailTitle.textContent = course.title;
    detailDesc.textContent = course.desc;
    fileList.innerHTML = "";
    course.files.forEach(f => {
      // normalize URL: if it's an absolute http(s) URL or blob URL keep it,
      // otherwise assume JSON uses `files/<name>` and map it to `/assets/courses/<course-folder>/<name>`
      const courseFolder = course.title.toLowerCase().replace(/\s+/g, '_');
      const url = (f.url && /^(?:https?:\/\/|\/|blob:)/.test(f.url))
        ? f.url
        : `/assets/courses/${courseFolder}/${f.url.replace(/^files\//,"")}`;

      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display:flex;flex-direction:column">
          <span class="file-name">${f.name}</span>
          <span class="file-meta">${f.size}</span>
        </div>
        <div>
          <a class="btn" href="${url}" download>Download</a>
        </div>
      `;
      fileList.appendChild(li);
    });
    downloadAll.onclick = () => {
      // Download each file individually by creating temporary anchors.
      const courseFolder = course.title.toLowerCase().replace(/\s+/g, '_');
      course.files.forEach(f => {
          const url = (f.url && /^(?:https?:\/\/|\/|blob:)/.test(f.url))
            ? f.url
            : `/assets/courses/${courseFolder}/${f.url.replace(/^files\//,"")}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    };
    detail.classList.add("open");
    detail.scrollIntoView({behavior:"smooth"});
  }

  grid.addEventListener("click", e => {
    const id = e.target.dataset.id || e.target.closest(".card")?.dataset?.id;
    if(id){
      const course = courses.find(c=>c.id===id);
      if(course) openDetail(course);
    }
  });

  closeDetail.addEventListener("click", () => {
    detail.classList.remove("open");
  });

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    filterAndRender(q, activeCategory);
  });

  categories.forEach(cat => {
    cat.addEventListener("click", () => {
      categories.forEach(c=>c.classList.remove("active"));
      cat.classList.add("active");
      activeCategory = cat.dataset.cat;
      filterAndRender(search.value.trim().toLowerCase(), activeCategory);
    });
  });

  function filterAndRender(q="", category="all"){
    let filtered = courses.filter(c => {
      const matchesCat = category === "all" ? true : c.category === category;
      const matchesQ = q === "" ? true : (c.title + " " + c.desc).toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
    renderGrid(filtered);
    renderQuickDownloads(filtered);
  }

  function renderQuickDownloads(list){
    quick.innerHTML = "";
    const files = [];
    list.forEach(c=>{
      const folder = c.title.toLowerCase().replace(/\s+/g,'_');
      c.files.forEach(f=>files.push({...f, course:c.title, folder}));
    });
    files.slice(0,5).forEach(f=>{
      const li = document.createElement("li");
      const url = (f.url && /^(?:https?:\/\/|\/|blob:)/.test(f.url))
        ? f.url
        : `/assets/courses/${f.folder}/${f.url.replace(/^files\//,"")}`;
      li.innerHTML = `<a href="${url}" download style="color:inherit;text-decoration:none">${f.name} <span style="color:var(--muted)">— ${f.course}</span></a>`;
      quick.appendChild(li);
    });
    if(files.length === 0) quick.innerHTML = `<li style="color:var(--muted)">No downloads</li>`;
  }

  // initial render
  filterAndRender();

  // --- Contribute modal behaviour ---
  function openContribute(){
    contributeModal.setAttribute('aria-hidden','false');
    contributeModal.style.display = 'block';
  }
  function closeContributeModal(){
    contributeModal.setAttribute('aria-hidden','true');
    contributeModal.style.display = 'none';
    contributeForm.reset();
  }

  contributeBtn.addEventListener('click', openContribute);
  closeContribute.addEventListener('click', closeContributeModal);
  cancelContribute.addEventListener('click', closeContributeModal);

  contributeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = contribCourse.value.trim();
    const file = contribFile.files[0];
    const desc = contribDesc.value.trim();
    if(!title || !file) return alert('Please provide course name and a file');
    // Save file into IndexedDB
    try{
      const sizeStr = `${(file.size/1024/1024).toFixed(1)} MB`;
      const rec = await addUploadRecord(title, file.name, file, sizeStr);
      // create course-like entry and add to UI
      const id = `u-${rec.id}`;
      const courseObj = {
        id,
        title,
        category: 'community',
        desc: desc || 'Shared by community',
        files: [ { name: file.name, url: URL.createObjectURL(file), size: sizeStr } ]
      };
      courses.push(courseObj);
      filterAndRender();
      closeContributeModal();
      alert('Thank you — resource saved locally and available in the dashboard.');
    }catch(err){
      console.error('Upload failed', err);
      alert('Could not save file locally: ' + (err && err.message));
    }
  });

  // small theme toggle (dark/light)
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    if(document.body.classList.contains("light")){
      document.documentElement.style.setProperty('--bg','#f7fafc');
      document.documentElement.style.setProperty('--card','#ffffff');
      document.documentElement.style.setProperty('--text','#0b1220');
      document.documentElement.style.setProperty('--muted','#475569');
      document.documentElement.style.setProperty('--glass','rgba(11,18,32,0.03)');
    } else {
      location.reload();
    }
  });

});