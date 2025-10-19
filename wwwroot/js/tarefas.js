(() => {
  const KEY = "tarefas_v4";
  const $ = s => document.querySelector(s);
  const tblBody = $("#tblTarefas tbody");
  const filtroStatus = $("#filtroStatus");
  const filtroTexto = $("#filtroTexto");
  const ordenarPor = $("#ordenarPor");

  const modalEl = document.getElementById('tarefaModal');
  const bsModal = new bootstrap.Modal(modalEl);

  const idInput = $("#tarefaId");
  const titulo = $("#titulo");
  const descricao = $("#descricao");
  const dataPrevista = $("#dataPrevista");
  const modalTitle = $("#tarefaModalLabel");

  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
  function save(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2)+Date.now()));
  const fmt = iso => !iso ? "" : new Date(iso).toLocaleDateString('pt-BR');
  const esc = s => (s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function badge(st){
    const map = { pendente: "secondary", concluida: "success", cancelada: "danger" };
    const cls = map[st] || "secondary";
    return `<span class="badge text-bg-${cls} badge-status">${st}</span>`;
  }

  function applyFilters(list){
    let data = [...list];
    const st = filtroStatus.value;
    if(st !== "todas") data = data.filter(x => x.status === st);
    const q = filtroTexto.value.trim().toLowerCase();
    if(q){ data = data.filter(x => (x.titulo||"").toLowerCase().includes(q) || (x.descricao||"").toLowerCase().includes(q)); }
    const byDate = (a,b) => new Date(a.dataPrevista||0) - new Date(b.dataPrevista||0);
    const byTitle = (a,b) => (a.titulo||"").localeCompare((b.titulo||""));
    const byStatus = (a,b) => (a.status||"").localeCompare((b.status||""));
    const ord = ordenarPor.value;
    if(ord === "data_asc") data.sort(byDate);
    if(ord === "data_desc") data.sort((a,b)=>byDate(b,a));
    if(ord === "titulo_asc") data.sort(byTitle);
    if(ord === "titulo_desc") data.sort((a,b)=>byTitle(b,a));
    if(ord === "status") data.sort(byStatus);
    return data;
  }

  function render(){
    const list = load();
    const data = applyFilters(list);
    tblBody.innerHTML = "";
    if(data.length === 0){
      tblBody.innerHTML = `<tr><td colspan="6" class="text-secondary">Nenhuma tarefa encontrada.</td></tr>`;
      return;
    }
    for(const t of data){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${esc(t.titulo)}</td>
        <td>${esc(t.descricao)}</td>
        <td>${fmt(t.dataPrevista)}</td>
        <td>${badge(t.status)}</td>
        <td>
          ${t.dataConclusao ? "<span class='text-success'>Concl.: "+fmt(t.dataConclusao)+"</span>" : ""}
          ${t.dataCancelamento ? "<br><span class='text-danger'>Canc.: "+fmt(t.dataCancelamento)+"</span>" : ""}
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" data-act="edit" data-id="${t.id}"><i class="bi bi-pencil"></i> Editar</button>
            <button class="btn btn-outline-success" data-act="done" data-id="${t.id}"><i class="bi bi-check2-circle"></i> Concluir</button>
            <button class="btn btn-outline-danger" data-act="cancel" data-id="${t.id}"><i class="bi bi-x-circle"></i> Cancelar</button>
          </div>
        </td>`;
      tblBody.appendChild(tr);
    }
  }

  function openNew(){
    idInput.value = ""; titulo.value = ""; descricao.value = "";
    const d = new Date(); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0');
    dataPrevista.value = `${yyyy}-${mm}-${dd}`;
    modalTitle.textContent = "Nova tarefa"; bsModal.show();
  }

  function openEdit(id){
    const list = load();
    const t = list.find(x => x.id === id); if(!t) return;
    idInput.value = t.id; titulo.value = t.titulo; descricao.value = t.descricao;
    dataPrevista.value = (t.dataPrevista||"").slice(0,10);
    modalTitle.textContent = "Editar tarefa"; bsModal.show();
  }

  function saveFromForm(){
    if(!titulo.value.trim() || !descricao.value.trim() || !dataPrevista.value){ alert("Preencha título, descrição e data prevista."); return; }
    const id = idInput.value.trim();
    const item = {
      id: id || uid(),
      titulo: titulo.value.trim(),
      descricao: descricao.value.trim(),
      dataPrevista: new Date(dataPrevista.value + "T12:00:00").toISOString(),
      status: "pendente",
      dataCancelamento: null,
      dataConclusao: null
    };
    const list = load();
    if(id){
      const i = list.findIndex(x => x.id === id);
      if(i>=0){
        item.status = list[i].status;
        item.dataCancelamento = list[i].dataCancelamento;
        item.dataConclusao = list[i].dataConclusao;
        list[i] = item;
      }
    }else{
      list.push(item);
    }
    save(list); render(); bsModal.hide();
  }

  function setStatus(id, status){
    const list = load();
    const t = list.find(x => x.id === id); if(!t) return;
    t.status = status;
    const now = new Date().toISOString();
    if(status === "concluida"){ t.dataConclusao = now; t.dataCancelamento = null; }
    else if(status === "cancelada"){ t.dataCancelamento = now; t.dataConclusao = null; }
    else { t.dataCancelamento = null; t.dataConclusao = null; }
    save(list); render();
  }

  document.getElementById("btnNovaTarefa").addEventListener("click", openNew);
  document.getElementById("btnSalvar").addEventListener("click", saveFromForm);
  document.querySelector("#tblTarefas tbody").addEventListener("click", e => {
    const btn = e.target.closest("button"); if(!btn) return;
    const id = btn.getAttribute("data-id"); const act = btn.getAttribute("data-act");
    if(act === "edit") openEdit(id);
    if(act === "done") setStatus(id, "concluida");
    if(act === "cancel") setStatus(id, "cancelada");
  });

  filtroStatus.addEventListener("change", render);
  ordenarPor.addEventListener("change", render);
  filtroTexto.addEventListener("input", render);

  render();
})();