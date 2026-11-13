// ================== ملف واحد لكل الصفحات الأربعة ==================

// --- 1. مشترك بين كل الصفحات ---
function toggleMenu() {
  document.getElementById("myMenu")?.classList.toggle("show");
}
function openPage(id) {
  closeAll();
  document.getElementById(id + '-page').style.display = 'block';
  document.getElementById("myMenu")?.classList.remove("show");
}
function closeAll() {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
}
document.addEventListener('click', (e)=>{
  const menu = document.getElementById("myMenu");
  const btn = document.querySelector(".menu-btn");
  if(menu && btn &&!menu.contains(e.target) &&!btn.contains(e.target)) menu.classList.remove("show");
});

// كيشوف واش كنت داير dark من قبل
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

const toggleBtn = document.getElementById("themeToggle");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}
 // التاريخ كيتبدل كل نهار بوحدو
function updateDate(){
  let now = new Date();
  let options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  let dateStr = now.toLocaleDateString('ar-MA', options);
  const todayEl = document.getElementById('todayDate');
  if (todayEl) todayEl.innerText = "📅 اليوم: " + dateStr;
}
updateDate();

// --- 2. خاص بـ first page.html : البحث ---
const searchInput = document.querySelector('input[type="search"]');
if(searchInput){
  searchInput.addEventListener('input', function(){
    let val = this.value.toLowerCase();
    document.querySelectorAll('.call-item').forEach(item=>{
      let name = item.innerText.toLowerCase();
      item.style.display = name.includes(val)? 'flex' : 'none';
    });
  });
}

// --- 3. خاص بـ HTML A.html : INFO PERSONAL ---
function goStep2(){
  // تصحيح reduired -> required
  let empty = false;
  document.querySelectorAll('input').forEach(inp=>{
    if((inp.hasAttribute('reduired') || inp.hasAttribute('required')) && inp.type!='radio' && inp.offsetParent!==null){
      if(inp.value.trim() === ''){
        empty = true;
        inp.style.border = "2px solid red";
      } else inp.style.border = "";
    }
  });
  if(empty){ alert("please fill out the form completely"); return; }

  document.getElementById("confirmDialog")?.close();
  let step2 = document.getElementById('step2');
  if(step2){ step2.hidden = false; step2.scrollIntoView({behavior:'smooth'}); }

  // حفظ فالمتصفح
  let data = {
    name: document.querySelector('input[name="name"]')?.value,
    phone: document.querySelector('input[type="tel"]')?.value,
    email: document.querySelector('input[type="email"]')?.value,
  };
  localStorage.setItem("userInfo", JSON.stringify(data));
}

// أزرار I agree و submit ف HTML A
document.addEventListener("DOMContentLoaded", ()=>{
  // زر I agree
  let agreeBtn = document.querySelector("#step2 button");
  if(agreeBtn){
    agreeBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      let info = JSON.parse(localStorage.getItem("userInfo")||"{}");
      alert("thank you " + (info.name||"") + " Saved successfully  ✅");
    });
  }
  

  // اللغات: إلا وافق على لغة يبان المستوى
  document.querySelectorAll('fieldset').forEach(fs=>{
    if(fs.innerHTML.includes("اللغات")){
      fs.querySelectorAll('input[type="radio"]').forEach((radio,i)=>{
        radio.addEventListener("change", ()=>{
          let range = fs.querySelectorAll('input[type="range"]')[i];
          if(range) range.value = 10;
        });
      });
    }
  });
});

